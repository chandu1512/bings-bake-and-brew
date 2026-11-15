/**
 * Shapes shared by the browser (bag, checkout) and the server (pricing, orders).
 * Money is always whole cents once it reaches the server.
 */
import type { StoreId } from "./site";

/** What the browser sends for one bag line. Prices are never trusted from here. */
export type CartLineInput = {
  id: string;
  qty: number;
  /** groupId -> chosen option ids */
  choices: Record<string, string[]>;
  note?: string;
};

export type CheckoutInput = {
  store: StoreId;
  lines: CartLineInput[];
  customer: { name: string; phone: string; email: string };
  /** "asap" or an ISO time for a scheduled pickup. */
  pickup: string;
  /** Optional tip in cents. */
  tip?: number;
};

export type PricedLine = {
  id: string;
  name: string;
  qty: number;
  /** "Large · Oat Milk · Caramel" */
  options: string[];
  note?: string;
  unitCents: number;
  totalCents: number;
};

export type OrderStatus = "awaiting_payment" | "paid" | "demo_paid" | "ready" | "picked_up" | "cancelled";

export type Order = {
  id: string;
  /** Short code staff read out loud: "A-1042" */
  code: string;
  store: StoreId;
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
  pickup: string;
  customer: { name: string; phone: string; email: string };
  lines: PricedLine[];
  subtotalCents: number;
  taxCents: number;
  tipCents: number;
  totalCents: number;
  paymentIntentId?: string;
  alertsSent?: boolean;
};
