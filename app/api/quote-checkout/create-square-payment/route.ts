import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { settings, quotes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSettings } from '@/lib/database';
import { sendEmail, createInsurancePolicyEmail } from '@/lib/email';
import { generateInvoicePdf } from '@/lib/invoice';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  // Store original toJSON if it exists to avoid side-effects
  const originalToJSON = (BigInt.prototype as any).toJSON;

  try {
    // Temporarily modify BigInt serialization to Number for this request
    (BigInt.prototype as any).toJSON = function () {
      return Number(this);
    };

    const squareSettingsRecord = await db.select().from(settings).where(eq(settings.param, 'square'));

    if (squareSettingsRecord.length === 0 || !squareSettingsRecord[0].value) {
      return NextResponse.json({ success: false, details: 'Square settings not found.' }, { status: 500 });
    }

    const squareSettings = JSON.parse(squareSettingsRecord[0].value);
    const { accessToken, appLocationId, environment } = squareSettings;

    if (!accessToken || !appLocationId) {
      return NextResponse.json({ success: false, details: 'Square access token or location ID is not configured.' }, { status: 500 });
    }

    const squareClient = new SquareClient({
      environment: environment === 'sandbox' ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
      token: accessToken,
    });

    const { sourceId, quoteData, user } = await req.json();


    if (!sourceId || !quoteData || !user || !quoteData.id) {
      return NextResponse.json({ success: false, details: "Missing required payment information or quote ID." }, { status: 400 });
    }

    const amount = quoteData.total || 0;
    if (amount <= 0) {
      return NextResponse.json({ success: false, details: "Payment amount must be positive." }, { status: 400 });
    }

    const totalAmount = BigInt(Math.round(amount * 100));

    // Run FraudLabsPro check before charging
    try {
      const fraudSettings = await getSettings("fraudLabsPro");
      const apiKey = fraudSettings?.apiKey;
      if (apiKey && quoteData) {
        const params = new URLSearchParams();
        params.set("key", apiKey);
        if (user?.email) params.set("email", user.email);
        if (quoteData?.customerData?.firstName) params.set("first_name", quoteData.customerData.firstName as string);
        if (quoteData?.customerData?.lastName) params.set("last_name", quoteData.customerData.lastName as string);
        params.set("amount", String(quoteData.total || 0));

        // Optional additional fields
        if (quoteData?.id) params.set('order_id', String(quoteData.id));
        const currency = (quoteData as any)?.currency || 'GBP';
        if (currency) params.set('currency', currency);
        if (quoteData?.customerData?.address) params.set('billing_address', quoteData.customerData.address as string);
        const postcode = quoteData?.customerData?.post_code ?? quoteData?.customerData?.postcode ?? (quoteData?.customerData as any)?.postCode;
        if (postcode) params.set('billing_postcode', postcode as string);
        const phone = quoteData?.customerData?.phoneNumber ?? (quoteData?.customerData as any)?.phone;
        if (phone) params.set('billing_phone', phone as string);
        const ua = req.headers.get('user-agent');
        if (ua) params.set('user_agent', ua);

        // IP: skip private/local IPs
        const isPrivateIp = (ip?: string) => {
          if (!ip) return true;
          if (ip === '::1' || ip === '127.0.0.1') return true;
          if (/^10\./.test(ip)) return true;
          if (/^192\.168\./.test(ip)) return true;
          if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
          if (/^fc00:/i.test(ip) || /^fe80:/i.test(ip)) return true;
          return false;
        }
        const xff = req.headers.get("x-forwarded-for");
        if (xff) {
          const ip = xff.split(",")[0].trim();
          if (ip && !isPrivateIp(ip)) params.set("ip", ip);
        }

        params.set('format', 'json');
        const url = `https://api.fraudlabspro.com/v2/order/screen`;
        const fraudRes = await fetch(url, { method: "POST", headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
        const raw = await fraudRes.json().catch(() => null);

        let score: number | null = null;
        if (raw) {
          score = raw.fraudlabspro_score ?? raw.risk_score ?? raw.score ?? null;
          if (typeof score === "string") {
            const n = Number(score);
            if (!Number.isNaN(n)) score = n;
          }
        }

        const blockThreshold = fraudSettings?.blockThreshold ?? 80;
        const warnThreshold = fraudSettings?.warnThreshold ?? 60;
        const explicitFraud = raw && (raw.is_fraud === true || raw.is_highrisk === true || raw.is_flagged === true);

        let action: "block" | "warn" | "allow" = "allow";
        if (explicitFraud) action = "block";
        else if (typeof score === "number") {
          if (score >= blockThreshold) action = "block";
          else if (score >= warnThreshold) action = "warn";
          else action = "allow";
        }

        await db.update(quotes).set({
          fraudStatus: action === "allow" ? "ok" : action,
          fraudScore: score ?? undefined,
          fraudDetails: raw ?? undefined,
          fraudCheckedAt: new Date().toISOString(),
        }).where(eq(quotes.id, quoteData.id));

        if (action === "block") {
          return NextResponse.json({ success: false, details: "Transaction blocked due to suspected fraud." }, { status: 403 });
        }
      }
    } catch (fErr) {
      console.error('Fraud check failed for Square:', fErr);
    }

    // Fetch site name and currency from settings
    const generalSettings = await db.query.settings.findFirst({
      where: eq(settings.param, 'general')
    });
    let siteName = "";
    let currency = "GBP"; // Default currency
    if (generalSettings && generalSettings.value) {
      const parsedSettings = JSON.parse(generalSettings.value);
      siteName = parsedSettings.siteName || "TEMPNOW";
      currency = parsedSettings.currency || "GBP";
    }

    const paymentResult = await squareClient.payments.create({
        sourceId,
        idempotencyKey: randomUUID(),
        locationId: appLocationId,
        amountMoney: {
            amount: totalAmount,
            currency: currency,
        },
        note: `${siteName} Docs: Policy ${quoteData.id}`,
    });



    

    if (paymentResult.payment) {
      // Update database
      await db.update(quotes).set({
        paymentStatus: 'paid',
        status: 'completed',
        userId: user.id,
        spaymentId: paymentResult.payment.id,
        paymentMethod: 'square',
        paymentDate: new Date().toISOString(),
        mailSent: true,
        updatedAt: new Date().toISOString()
      }).where(eq(quotes.id, quoteData.id));

      revalidatePath('/api/quotes');
      revalidatePath('/administrator');
      revalidatePath('/api/admin/quotes');

      // Fetch the updated quote to get the policy number
      const quoteRecord = await db.select().from(quotes).where(eq(quotes.id, quoteData.id)).limit(1);
      if (!quoteRecord.length) {
        throw new Error('Quote not found after update');
      }
      const quote = quoteRecord[0];

      // Use the stored discounted price, fallback to original price (cpw)
      const effectivePrice = (quote.updatePrice && quote.updatePrice !== 'false') ? quote.updatePrice : quote.cpw;
      const finalAmount = parseFloat(effectivePrice || quoteData.total);

      // Generate invoice
      const pdfBytes = await generateInvoicePdf({ ...quoteData, total: finalAmount, paymentDate: quote.paymentDate }, user, quote.policyNumber, siteName);

      // Send confirmation email
      const vehicle = quoteData.customerData.vehicle;
      
      const emailHtml = await createInsurancePolicyEmail(
        user.firstName || '',
        user.lastName || '',
        quote.policyNumber,
        quote.regNumber || '', // Use quote.regNumber from the database
        vehicle.make,
        vehicle.model,
        vehicle.year,
        quoteData.startTime,
        quoteData.expiryTime,
        finalAmount,
        `${process.env.NEXT_PUBLIC_BASE_URL}/order/details?number=${quote.policyNumber}`,
        quoteData.coverReason || 'N/A'
      );





      await sendEmail({
        to: user.email,
        subject: emailHtml.subject,
        html: emailHtml.html,
        attachments: [
          {
            filename: `invoice-${quote.policyNumber}.pdf`,
            content: Buffer.from(pdfBytes),
          },
        ],
      });
    }

    return NextResponse.json({ success: true, payment: paymentResult.payment });
  } catch (error: any) {
    console.error('Square payment error:', error);
    const errorMessage = error?.errors?.[0]?.detail || "An unexpected error occurred during payment.";
    return NextResponse.json({ success: false, details: errorMessage }, { status: 500 });
  } finally {
    // Restore original toJSON to prevent side-effects
    (BigInt.prototype as any).toJSON = originalToJSON;
  }
}
