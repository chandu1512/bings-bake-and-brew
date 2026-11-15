import "server-only";
import type { Order } from "../order-types";
import { STORES } from "../site";

/**
 * New-order alerts. Each channel switches itself on when its keys are in
 * .env.local and otherwise just logs, so the site works before anything is set up.
 *
 *   Email (Resend):  RESEND_API_KEY, ORDER_EMAIL_FROM, ORDER_EMAIL_AMSTEL, ORDER_EMAIL_ELKTON
 *   Text  (Twilio):  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM, ORDER_SMS_AMSTEL, ORDER_SMS_ELKTON
 *
 * The live orders page (/staff) needs no keys: it reads the saved orders.
 */
const money = (c: number) => `$${(c / 100).toFixed(2)}`;
const env = (k: string) => process.env[k]?.trim() || "";

function pickupLabel(o: Order) {
  if (o.pickup === "asap") return "As soon as possible";
  return new Date(o.pickup).toLocaleString("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function textBody(o: Order) {
  const shop = STORES[o.store];
  const lines = o.lines.map(
    (l) => `${l.qty} x ${l.name}${l.options.length ? ` (${l.options.join(", ")})` : ""}${l.note ? ` - "${l.note}"` : ""}`,
  );
  return [
    `New pickup order ${o.code}${o.status === "demo_paid" ? " [TEST - not charged]" : ""}`,
    `${shop.name} · Pickup: ${pickupLabel(o)}`,
    `${o.customer.name} · ${o.customer.phone}`,
    "",
    ...lines,
    "",
    `Total ${money(o.totalCents)} (paid online)`,
  ].join("\n");
}

async function sendEmail(o: Order) {
  const key = env("RESEND_API_KEY");
  const to = env(o.store === "amstel" ? "ORDER_EMAIL_AMSTEL" : "ORDER_EMAIL_ELKTON");
  if (!key || !to) return console.log(`[orders] email skipped (no keys)\n${textBody(o)}`);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env("ORDER_EMAIL_FROM") || "Bing's Orders <onboarding@resend.dev>",
      to: to.split(",").map((s) => s.trim()),
      subject: `New order ${o.code} · ${o.customer.name} · ${money(o.totalCents)}`,
      text: textBody(o),
    }),
  });
  if (!res.ok) console.error("[orders] email failed", res.status, await res.text());
}

async function sendSms(o: Order) {
  const sid = env("TWILIO_ACCOUNT_SID");
  const token = env("TWILIO_AUTH_TOKEN");
  const from = env("TWILIO_FROM");
  const to = env(o.store === "amstel" ? "ORDER_SMS_AMSTEL" : "ORDER_SMS_ELKTON");
  if (!sid || !token || !from || !to) return console.log(`[orders] text skipped (no keys) for ${o.code}`);
  const body = `${o.code} ${o.customer.name}: ${o.lines.reduce((n, l) => n + l.qty, 0)} items, ${money(o.totalCents)}. Pickup ${pickupLabel(o)}.`;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  if (!res.ok) console.error("[orders] text failed", res.status, await res.text());
}

export async function alertShop(o: Order) {
  await Promise.allSettled([sendEmail(o), sendSms(o)]);
}
