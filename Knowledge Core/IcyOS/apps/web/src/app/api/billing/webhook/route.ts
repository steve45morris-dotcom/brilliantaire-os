import { NextRequest, NextResponse } from 'next/server';
import { getServiceDb, getStripe } from '../../../../lib/billing/server';
import { handleStripeEvent } from '../../../../lib/billing/webhook';

// Called by Stripe, not by a signed-in user: public in the middleware, and
// trusted only after the signature check below.
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get('stripe-signature');
  if (!secret) return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  if (!signature) return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 });

  const stripe = getStripe();
  let event;
  try {
    // The raw body is required: re-serialized JSON would not match the signature.
    event = await stripe.webhooks.constructEventAsync(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const outcome = await handleStripeEvent(event, stripe, getServiceDb());
    return NextResponse.json({ received: true, outcome });
  } catch (err) {
    console.error('Stripe webhook failed:', err);
    // A 5xx makes Stripe retry with backoff.
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
