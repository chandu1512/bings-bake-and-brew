import "server-only";
import { getOrder, saveOrder } from "./orders";
import { alertShop } from "./notify";
import { isDemoPayments, stripe } from "./stripe";
import type { Order } from "../order-types";

/**
 * Mark an order paid once Stripe confirms it, then alert the shop exactly once.
 * Called from the confirmation page and from the Stripe webhook; whichever
 * arrives first does the work and the other finds it already done.
 */
export async function finalizeOrder(id: string, opts: { demo?: boolean } = {}): Promise<Order | null> {
  const order = await getOrder(id);
  if (!order) return null;
  if (order.status !== "awaiting_payment") return order;

  if (opts.demo) {
    if (!isDemoPayments()) return order; // demo payments only exist while Stripe keys are absent
    order.status = "demo_paid";
  } else {
    const s = stripe();
    if (!s || !order.paymentIntentId) return order;
    const pi = await s.paymentIntents.retrieve(order.paymentIntentId);
    if (pi.status !== "succeeded" || pi.amount !== order.totalCents) return order;
    order.status = "paid";
  }

  order.paidAt = new Date().toISOString();
  await saveOrder(order);
  if (!order.alertsSent) {
    await alertShop(order);
    order.alertsSent = true;
    await saveOrder(order);
  }
  return order;
}
