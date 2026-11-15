import { NextResponse } from "next/server";
import { priceCart } from "@/lib/pricing";
import { isStoreId, STORES } from "@/lib/site";
import { newOrderIds, saveOrder } from "@/lib/server/orders";
import { isDemoPayments, stripe } from "@/lib/server/stripe";
import type { CheckoutInput, Order } from "@/lib/order-types";

export const runtime = "nodejs";

const bad = (msg: string) => NextResponse.json({ error: msg }, { status: 400 });

/** Price the bag on the server, save the order, and open a Stripe payment for it. */
export async function POST(req: Request) {
  let body: CheckoutInput;
  try {
    body = await req.json();
  } catch {
    return bad("Something went wrong reading your order.");
  }
  if (!isStoreId(body.store)) return bad("Pick a shop first.");
  const name = body.customer?.name?.trim() ?? "";
  const phone = body.customer?.phone?.trim() ?? "";
  const email = body.customer?.email?.trim() ?? "";
  if (name.length < 2) return bad("Add a name for the order.");
  if (phone.replace(/\D/g, "").length < 10) return bad("Add a phone number so the shop can reach you.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad("Add an email for your receipt.");

  let priced;
  try {
    priced = priceCart(body.store, Array.isArray(body.lines) ? body.lines : [], body.tip);
  } catch (e) {
    return bad((e as Error).message);
  }
  if (priced.totalCents < 50) return bad("Orders must be at least $0.50.");

  const { id, code } = newOrderIds(body.store);
  const order: Order = {
    id,
    code,
    store: body.store,
    status: "awaiting_payment",
    createdAt: new Date().toISOString(),
    pickup: body.pickup === "asap" || !Number.isNaN(Date.parse(body.pickup)) ? body.pickup : "asap",
    customer: { name: name.slice(0, 60), phone: phone.slice(0, 20), email: email.slice(0, 120) },
    ...priced,
  };

  const s = stripe();
  if (!s) {
    await saveOrder(order);
    return NextResponse.json({ orderId: id, code, demo: isDemoPayments(), totalCents: order.totalCents });
  }

  const pi = await s.paymentIntents.create(
    {
      amount: order.totalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: order.customer.email,
      description: `${STORES[order.store].name} pickup ${code}`,
      metadata: { orderId: id, code, store: order.store },
    },
    { idempotencyKey: `order-${id}` },
  );
  order.paymentIntentId = pi.id;
  await saveOrder(order);
  return NextResponse.json({ orderId: id, code, clientSecret: pi.client_secret, totalCents: order.totalCents });
}
