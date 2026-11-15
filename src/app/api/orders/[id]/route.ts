import { NextResponse } from "next/server";
import { finalizeOrder } from "@/lib/server/finalize";

export const runtime = "nodejs";

/**
 * POST: called by the confirmation page after payment. Checks with Stripe and
 * returns the order. Only the fields a customer needs are sent back.
 * Body { demo: true } completes a demo-mode order (only while Stripe keys are absent).
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  let order;
  try {
    order = await finalizeOrder(id, { demo: body?.demo === true });
  } catch {
    return NextResponse.json({ error: "Couldn't check that order." }, { status: 400 });
  }
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  const { code, store, status, pickup, lines, subtotalCents, taxCents, tipCents, totalCents, customer } = order;
  return NextResponse.json({
    code,
    store,
    status,
    pickup,
    lines,
    subtotalCents,
    taxCents,
    tipCents,
    totalCents,
    name: customer.name,
  });
}
