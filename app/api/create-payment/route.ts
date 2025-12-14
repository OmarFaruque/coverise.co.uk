import { NextRequest, NextResponse } from "next/server";
import { getMollieClient } from "@/lib/mollie";
import { getPaddleInstance, getPaddleApiKey, getPaddleEnvironment, getPaddleProductId, updatePaddleProductId } from "@/lib/paddle";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';
import { settings, aiDocuments, quotes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSettings } from "@/lib/database";

export async function POST(req: NextRequest) {
  const { quoteData, docData, user, tip, discount } = await req.json();
  // Log incoming body for debugging
  
  if (!user) {
    return NextResponse.json({ error: "User data is required." }, { status: 400 });
  }

  const paymentSettings = await db.query.settings.findFirst({
    where: eq(settings.param, 'payment'),
  });

  const activeProvider = paymentSettings ? JSON.parse(paymentSettings.value as string).activeProcessor : 'stripe';

  // Fetch site name from settings
  const generalSettings = await db.query.settings.findFirst({
    where: eq(settings.param, 'general')
  });
  let siteName = "";
  if (generalSettings && generalSettings.value) {
    const parsedSettings = JSON.parse(generalSettings.value);
    siteName = parsedSettings.siteName || "";
  }

  if (activeProvider === 'mollie') {
    try {
      const mollie = await getMollieClient();
      let amount;
      let description;
      let metadata;
      let redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payment-confirmation`;

      if (docData) {
        const amountValue = docData.price + (tip || 0) - (discount || 0);
        amount = amountValue.toFixed(2);
        redirectUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/ai-payment-confirmation`;
        description = `${siteName} AI Document: ${docData.prompt.substring(0, 50)}...`;
        
        const newDocument = await db.insert(aiDocuments).values({
          uuid: uuidv4(),
          prompt: docData.prompt,
          content: docData.content,
          email: user.email,
          userId: user.id,
          status: 'pending',
          amount: amount,
          currency: 'GBP',
        }).returning({ id: aiDocuments.id });

        metadata = { type: 'ai-document', documentId: newDocument[0].id };

      } else if (quoteData) {
        const amountValue = quoteData.total - (discount || 0);
        amount = amountValue.toFixed(2);
        description = `${siteName} Docs: ${quoteData.policyNumber}`;
        metadata = { type: 'quote', policyNumber: quoteData.policyNumber };
      } else {
        return NextResponse.json({ error: "No document or quote data provided." }, { status: 400 });
      }

      // Run fraud check for quotes
      if (quoteData) {
        try {
          const fraudSettings = await getSettings("fraudLabsPro");
          const apiKey = fraudSettings?.apiKey;
          if (apiKey) {
            const params = new URLSearchParams();
            params.set("key", apiKey);
            if (user?.email) params.set("email", user.email);
            if (quoteData?.customerData?.firstName) params.set("first_name", quoteData.customerData.firstName as string);
            if (quoteData?.customerData?.lastName) params.set("last_name", quoteData.customerData.lastName as string);
            if (amount) params.set("amount", String(amount));

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

            // Try to get client IP from headers (if behind proxy) but skip private/local IPs
            const isPrivateIp = (ip?: string) => {
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
              if (ip && !isPrivateIp(ip)) params.set("ip", ip);
            }

            // Use documented /v2/order/screen endpoint (POST, form-encoded)
            params.set("format", "json");
            const url = `https://api.fraudlabspro.com/v2/order/screen`;
            const fraudRes = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: params.toString(),
            });
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
        } catch (fraudErr) {
          console.error("Fraud check failed:", fraudErr);
        }
      }

      const payment = await mollie.payments.create({
        amount: {
          currency: "GBP",
          value: amount,
        },
        description: description,
        redirectUrl: redirectUrl,
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/mollie-webhook`,
        metadata: metadata,
      });

      return NextResponse.json({ checkoutUrl: payment.getCheckoutUrl() });
    } catch (error) {
      console.error("Mollie payment creation failed:", error);
      let errorMessage = "An unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return NextResponse.json({ error: "Failed to create Mollie payment.", details: errorMessage }, { status: 500 });
    }
  } else if (activeProvider === 'paddle') {
    try {
        const paddle = await getPaddleInstance();
        const apiKey = await getPaddleApiKey();
        const environment = await getPaddleEnvironment();
        const paddleApiUrl = environment === 'production'
          ? 'https://api.paddle.com'
          : 'https://sandbox-api.paddle.com';

        let product;
        const productId = await getPaddleProductId();

        if (productId) {
            const productResponse = await fetch(`${paddleApiUrl}/products/${productId}`, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                },
            });
            if (productResponse.ok) {
                const productData = await productResponse.json();
                product = productData.data;
            }
        }

        if (!product) {
          const createProductResponse = await fetch(`${paddleApiUrl}/products`, {
            method: 'POST',
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: docData ? `${siteName} AI Docs` : `${siteName} Docs`,
              tax_category: "standard",
            }),
          });
          const createProductData = await createProductResponse.json();
          product = createProductData.data;
          await updatePaddleProductId(product.id);
        }

        const amount = docData ? (docData.price + (tip || 0) - (discount || 0)) * 100 : (quoteData.total - (discount || 0)) * 100;
        const description = docData ? `${siteName} AI Document: ${docData.prompt.substring(0, 50)}...` : `${siteName} Docs: One-time payment for docs`;
        const custom_data = docData ? { doc_details: JSON.stringify(docData), user_details: JSON.stringify(user) } : { quote_details: JSON.stringify(quoteData), user_details: JSON.stringify(user) };

        const createPriceResponse = await fetch(`${paddleApiUrl}/prices`, {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: product.id,
            description: description,
            billing_cycle: null,
            trial_period: null,
            tax_mode: "account_setting",
            unit_price: {
              amount: Math.round(amount).toString(),
              currency_code: "GBP",
            },
            custom_data: custom_data,
          }),
        });
        const createPriceData = await createPriceResponse.json();
        const price = createPriceData.data;

        if (price.id) {
          return NextResponse.json({ priceId: price.id, customer: user });
        } else {
          console.error("Paddle price ID not found in price:", price);
          return NextResponse.json({ error: "Failed to create Paddle price." }, { status: 500 });
        }
    } catch (error) {
        console.error("Paddle transaction creation failed:", error);
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'detail' in error) {
          errorMessage = (error as any).detail;
        }
        return NextResponse.json({ error: "Failed to create Paddle transaction.", details: errorMessage }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Invalid payment provider." }, { status: 400 });
  }
}