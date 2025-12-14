import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { users, quotes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { settings } from "@/lib/schema";
import { revalidatePath } from "next/cache";
import { getSettings } from "@/lib/database";

export async function POST(req: NextRequest) {
  const { quoteData, user } = await req.json();

  if (!quoteData) {
    return NextResponse.json({ error: "Quote data is required." }, { status: 400 });
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe secret key is not set in the environment variables." }, { status: 500 });
    }

    // Fetch site name from settings
    const generalSettings = await db.query.settings.findFirst({
      where: eq(settings.param, 'general')
    });
    let siteName = "";
    if (generalSettings && generalSettings.value) {
      const parsedSettings = JSON.parse(generalSettings.value);
      siteName = parsedSettings.siteName || "";
    }

    const stripe = new Stripe(stripeSecretKey);

    let stripeCustomerId = user.stripeCustomerId;

  

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({ email: user.email });
      stripeCustomerId = customer.id;
      await db.update(users).set({ stripeCustomerId }).where(eq(users.userId, user.id));
    }

    const finalAmount = quoteData.total;

    // Run a FraudLabsPro check before creating payment intent
    try {
      const fraudSettings = await getSettings("fraudLabsPro");
      const apiKey = fraudSettings?.apiKey;
      if (apiKey) {
        const params = new URLSearchParams();
        params.set("key", apiKey);
        if (user?.email) params.set("email", user.email);
        if (quoteData?.customerData?.firstName) params.set("first_name", quoteData.customerData.firstName as string);
        if (quoteData?.customerData?.lastName) params.set("last_name", quoteData.customerData.lastName as string);
        if (finalAmount) params.set("amount", String(finalAmount));

        // Additional optional fields to improve accuracy (only set when available)
        if (quoteData?.id) params.set("order_id", String(quoteData.id));
        // Currency: prefer quoteData.currency, otherwise default to GBP
        const currency = (quoteData as any)?.currency || "GBP";
        if (currency) params.set("currency", currency);

        const billingAddress = quoteData?.customerData?.address;
        if (billingAddress) params.set("billing_address", billingAddress as string);

        const postcode = quoteData?.customerData?.post_code ?? quoteData?.customerData?.postcode ?? (quoteData?.customerData as any)?.postCode;
        if (postcode) params.set("billing_postcode", postcode as string);

        const phone = quoteData?.customerData?.phoneNumber ?? (quoteData?.customerData as any)?.phone;
        if (phone) params.set("billing_phone", phone as string);

        // User agent / device info
        const ua = req.headers.get("user-agent");
        if (ua) params.set("user_agent", ua);

        // Try to get client IP from headers (if behind proxy) but skip private/local IPs
        const checkIsPrivateIp = (ip?: string) => {
          if (!ip) return true;
          if (ip === "::1" || ip === "127.0.0.1") return true;
          if (/^10\./.test(ip)) return true;
          if (/^192\.168\./.test(ip)) return true;
          if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
          if (/^fc00:/i.test(ip) || /^fe80:/i.test(ip)) return true;
          return false;
        }

        const xff = req.headers.get("x-forwarded-for");
        if (xff) {
          const ip = xff.split(",")[0].trim();
          if (ip && !checkIsPrivateIp(ip)) params.set("ip", ip);
        }



          // console.log('FraudLabsPro check params:', Object.fromEntries(params.entries()));


          // Use documented /v2/order/screen endpoint (POST, form-encoded)
          params.set("format", "json");

          const url = `https://api.fraudlabspro.com/v2/order/screen`;
          const fraudRes = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
          });

          // console.log('FraudLabsPro HTTP status:', fraudRes.status, fraudRes.statusText);
          const raw = await fraudRes.json().catch(() => null);

          // console.log('FraudLabsPro response:', raw);

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

        const providerError = !fraudRes.ok || (raw && (raw.error || raw.error_message || raw.error_code));

        let action: "block" | "warn" | "allow" | "error" = "allow";

        if (providerError) {
          action = "error";
        } else if (explicitFraud) action = "block";
        else if (typeof score === "number") {
          if (score >= blockThreshold) action = "block";
          else if (score >= warnThreshold) action = "warn";
          else action = "allow";
        }

        // Persist fraud check on quote
        await db.update(quotes).set({
          fraudStatus: action === "allow" ? "ok" : action,
          fraudScore: score ?? undefined,
          fraudDetails: raw ?? undefined,
          fraudCheckedAt: new Date().toISOString(),
        }).where(eq(quotes.id, quoteData.id));

        // Decide whether to block on provider errors depending on admin setting
        const failOpen = fraudSettings?.failOpen !== undefined ? !!fraudSettings.failOpen : true;
        if (action === "block" || (action === "error" && !failOpen)) {
          return NextResponse.json({ error: "Transaction blocked due to suspected fraud." }, { status: 403 });
        }
      }
    } catch (fraudError) {
      console.error("FraudLabsPro check failed:", fraudError);
      // Continue with payment creation on fraud check failure (fail-open)
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100),
      currency: "gbp",
      customer: stripeCustomerId,
      description: `${siteName} Docs: ${quoteData.id}`,
      metadata: {
        type: 'quote',
        quote_id: quoteData.id, // Assuming quoteData has an id
        user_details: JSON.stringify(user),
      },
    });

    // Here you would typically update the quote in your database with the paymentIntent.id
    // For example:
    await db.update(quotes).set({ paymentIntentId: paymentIntent.id }).where(eq(quotes.id, quoteData.id));

    revalidatePath('/api/quotes');
    revalidatePath('/administrator');
    revalidatePath('/api/admin/quotes');

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe payment intent creation failed:", error);
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: "Failed to create Stripe payment intent.", details: errorMessage }, { status: 500 });
  }
}