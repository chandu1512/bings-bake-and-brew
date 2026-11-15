import "server-only";
import Stripe from "stripe";

/**
 * Stripe client, or null in demo mode (no STRIPE_SECRET_KEY set).
 * Demo mode lets the whole checkout run end to end without charging anyone,
 * and every demo order is marked "TEST - not charged" for staff.
 */
let client: Stripe | null | undefined;

export function stripe(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  client = key ? new Stripe(key) : null;
  return client;
}

export const isDemoPayments = () => !process.env.STRIPE_SECRET_KEY?.trim();
