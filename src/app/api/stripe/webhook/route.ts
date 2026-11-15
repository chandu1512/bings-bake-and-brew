import { NextResponse } from "next/server";
import { stripe } from "@/lib/server/stripe";
import { finalizeOrder } from "@/lib/server/finalize";

export const runtime = "nodejs";

/**
 * Stripe webhook. Point a webhook at https://<site>/api/stripe/webhook for the
 * `payment_intent.succeeded` event and put its signing secret in
 * STRIPE_WEBHOOK_SECRET. This catches orders where the customer closed the
 * tab before the confirmation page loaded.
 */
export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!s || !secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  const sig = req.headers.get("stripe-signature") ?? "";
  let event;
  try {
    event = s.webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  if (event.type === "payment_intent.succeeded") {
    const orderId = event.data.object.metadata?.orderId;
    if (orderId) await finalizeOrder(orderId);
  }
  return NextResponse.json({ received: true });
}
