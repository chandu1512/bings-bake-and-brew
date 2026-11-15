import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Staff sign-in for /staff. One shared password per site in STAFF_PASSWORD.
 * The cookie holds an HMAC of the password, so changing the password signs
 * every tablet out.
 */
const COOKIE = "bings_staff";

function token() {
  const pw = process.env.STAFF_PASSWORD?.trim();
  if (!pw) return null;
  return createHmac("sha256", pw).update("bings-staff-v1").digest("hex");
}

export const staffConfigured = () => !!token();

export function passwordMatches(input: string) {
  const pw = process.env.STAFF_PASSWORD?.trim() ?? "";
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  return pw.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

export async function setStaffCookie() {
  const t = token();
  if (!t) return;
  (await cookies()).set(COOKIE, t, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function isStaff() {
  const t = token();
  const c = (await cookies()).get(COOKIE)?.value;
  if (!t || !c || c.length !== t.length) return false;
  return timingSafeEqual(Buffer.from(c), Buffer.from(t));
}
