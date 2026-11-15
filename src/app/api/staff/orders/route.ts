import { NextResponse } from "next/server";
import { isStaff } from "@/lib/server/staff-auth";
import { getOrder, listOrders, saveOrder } from "@/lib/server/orders";
import { isStoreId } from "@/lib/site";
import type { OrderStatus } from "@/lib/order-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "Sign in first." }, { status: 401 });

/** Paid orders from the last day and a half, newest first. ?store=amstel|elkton */
export async function GET(req: Request) {
  if (!(await isStaff())) return deny();
  const store = new URL(req.url).searchParams.get("store");
  const orders = await listOrders(isStoreId(store) ? store : undefined);
  return NextResponse.json({ orders: orders.filter((o) => o.status !== "awaiting_payment") });
}

const NEXT: OrderStatus[] = ["ready", "picked_up", "cancelled"];

/** { id, status } moves an order along: paid -> ready -> picked_up (or cancelled). */
export async function PATCH(req: Request) {
  if (!(await isStaff())) return deny();
  const { id, status } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || !NEXT.includes(status)) {
    return NextResponse.json({ error: "Bad update." }, { status: 400 });
  }
  const order = await getOrder(id);
  if (!order || order.status === "awaiting_payment") return NextResponse.json({ error: "Not found." }, { status: 404 });
  order.status = status;
  await saveOrder(order);
  return NextResponse.json({ ok: true });
}
