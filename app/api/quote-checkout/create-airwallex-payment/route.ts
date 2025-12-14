
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings, quotes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSettings } from '@/lib/database';

export async function POST(req: NextRequest) {
  const { quoteData, user } = await req.json();

  if (!quoteData) {
    return NextResponse.json({ error: "Quote data is required." }, { status: 400 });
  }

  try {
    const airwallexSettings = await db.select().from(settings).where(eq(settings.param, 'airwallex')).limit(1);

    if (!airwallexSettings || airwallexSettings.length === 0) {
      return NextResponse.json({ error: "Airwallex settings not found." }, { status: 500 });
    }

    const airwallexConfig = JSON.parse(airwallexSettings[0].value || '{}');
    const clientId = airwallexConfig.client_id;
    const apiKey = airwallexConfig.apikey;
    const environment = airwallexConfig.environment;
    const baseUrl = environment === 'test' ? 'https://api-demo.airwallex.com' : 'https://api.airwallex.com';

    if (!clientId || !apiKey) {
      return NextResponse.json({ error: "Airwallex client ID or API key not found in settings." }, { status: 500 });
    }

    const airwallexAuthResponse = await fetch(`${baseUrl}/api/v1/authentication/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-api-key': apiKey
      }
    });

    const authData = await airwallexAuthResponse.json();
    const token = authData.token;

    if (!token) {
      return NextResponse.json({ error: "Failed to authenticate with Airwallex." }, { status: 500 });
    }

    const finalAmount = quoteData.total;

    // Run FraudLabsPro check before creating Airwallex intent
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

        // Try to get client IP from headers but skip private/local IPs
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
          return NextResponse.json({ error: "Transaction blocked due to suspected fraud." }, { status: 403 });
        }
      }
    } catch (fraudErr) {
      console.error('Fraud check failed for Airwallex:', fraudErr);
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

    const paymentIntentResponse = await fetch(`${baseUrl}/api/v1/pa/payment_intents/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        request_id: crypto.randomUUID(),
        amount: finalAmount,
        currency: "GBP",
        merchant_order_id: crypto.randomUUID(),
        description: `${siteName} Docs: Docs ${quoteData.id}`,
        metadata: {
          type: 'quote',
          quote_id: quoteData.id,
          user_details: JSON.stringify(user),
        },
      })
    });

    if (!paymentIntentResponse.ok) {
      const errorBody = await paymentIntentResponse.json();
      console.error("Airwallex payment intent creation failed:", errorBody);
      return NextResponse.json({ error: "Failed to create Airwallex payment intent.", details: errorBody }, { status: 500 });
    }

    const paymentIntent = await paymentIntentResponse.json();

    if (!paymentIntent || !paymentIntent.id || !paymentIntent.client_secret) {
        console.error("Invalid payment intent response from Airwallex:", paymentIntent);
        return NextResponse.json({ error: "Invalid payment intent response from Airwallex." }, { status: 500 });
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret, intentId: paymentIntent.id });
  } catch (error) {
    console.error("Airwallex payment intent creation failed:", error);
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: "Failed to create Airwallex payment intent.", details: errorMessage }, { status: 500 });
  }
}
