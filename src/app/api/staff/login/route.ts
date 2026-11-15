import { NextResponse } from "next/server";
import { passwordMatches, setStaffCookie, staffConfigured } from "@/lib/server/staff-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!staffConfigured()) {
    return NextResponse.json({ error: "Set STAFF_PASSWORD in .env.local to turn on the orders page." }, { status: 503 });
  }
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || !passwordMatches(password)) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "That password isn't right." }, { status: 401 });
  }
  await setStaffCookie();
  return NextResponse.json({ ok: true });
}
