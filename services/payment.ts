/**
 * Payment provider abstraction.
 *
 * No live payment gateway is wired in yet (no Stripe/Paystack/Flutterwave
 * keys were provided). This service isolates all payment-provider-specific
 * logic so a real provider can be dropped in later without touching the
 * checkout UI, the Payment model, or the enrollment logic.
 *
 * Flow this is built for:
 *   1. POST /api/payment/checkout  -> creates a PENDING Payment row + a
 *      provider checkout session/reference.
 *   2. The real provider redirects the user back and/or calls
 *      POST /api/payment/webhook with a signed event confirming success.
 *   3. Only the webhook (server-to-server, signature-verified) is allowed
 *      to flip a Payment to SUCCESS and create the Enrollment. The client
 *      redirecting to /payment/success does NOT by itself grant access.
 */

export interface CheckoutSession {
  reference: string;
  checkoutUrl: string | null;
}

export async function createCheckoutSession(params: {
  amount: number;
  reference: string;
  customerEmail: string;
  courseTitle: string;
}): Promise<CheckoutSession> {
  const providerKey = process.env.PAYMENT_PROVIDER_SECRET_KEY;

  if (!providerKey) {
    // No provider configured. Return a session with no external checkoutUrl —
    // the checkout page will show a clear "payments not yet configured" state
    // rather than pretending a real gateway is live.
    return { reference: params.reference, checkoutUrl: null };
  }

  // Example real integration (Paystack-style) — left as a template:
  //
  // const res = await fetch('https://api.paystack.co/transaction/initialize', {
  //   method: 'POST',
  //   headers: {
  //     Authorization: `Bearer ${providerKey}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     email: params.customerEmail,
  //     amount: Math.round(params.amount * 100),
  //     reference: params.reference
  //   })
  // });
  // const data = await res.json();
  // return { reference: params.reference, checkoutUrl: data.data.authorization_url };

  return { reference: params.reference, checkoutUrl: null };
}

/**
 * Verifies an inbound webhook signature. Stubbed until a provider is chosen —
 * always returns false (reject) when no secret is configured, so we never
 * silently trust an unverified request.
 */
export function verifyWebhookSignature(_rawBody: string, _signatureHeader: string | null): boolean {
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  // Example (HMAC-SHA512 style, provider-specific):
  // const hash = crypto.createHmac('sha512', webhookSecret).update(rawBody).digest('hex');
  // return hash === signatureHeader;

  return false;
}
