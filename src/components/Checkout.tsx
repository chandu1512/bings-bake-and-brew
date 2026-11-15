"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { itemById, money } from "@/lib/menu";
import { TAX_RATE, priceLine } from "@/lib/pricing";
import { clock, shopTime } from "@/lib/hours";
import { useBag, useMenuPhoto, useNow, useStore } from "./providers";
import { ArrowRight, Lock } from "./icons";

const EASE = [0.23, 1, 0.32, 1] as const;
const PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => (stripePromise ??= PK ? loadStripe(PK) : Promise.resolve(null));

type Slot = { value: string; label: string };

/** Pickup times in 15-minute steps: today from 15 minutes out, or the next open day. */
function pickupSlots(hours: ({ open: number; close: number } | null)[], now: Date): { slots: Slot[]; asap: boolean } {
  const { day, mins } = shopTime(now);
  for (let d = 0; d < 7; d++) {
    const h = hours[(day + d) % 7];
    if (!h) continue;
    const start = d === 0 ? Math.max(h.open, Math.ceil((mins + 15) / 15) * 15) : h.open;
    const out: Slot[] = [];
    for (let m = start; m <= h.close - 15; m += 15) {
      const at = new Date(now.getTime() + (d * 1440 + m - mins) * 60_000);
      at.setSeconds(0, 0);
      const dayLabel = d === 0 ? "Today" : d === 1 ? "Tomorrow" : at.toLocaleDateString("en-US", { weekday: "long" });
      out.push({ value: at.toISOString(), label: `${dayLabel}, ${clock(m)}` });
    }
    if (out.length) return { slots: out, asap: d === 0 && mins >= h.open && mins < h.close - 10 };
  }
  return { slots: [], asap: false };
}

function PayButton({ orderId, total }: { orderId: string; total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/order/confirmed?order=${orderId}` },
    });
    // Only reached when the payment didn't go through; success redirects.
    setErr(error?.message ?? "The payment didn't go through. Try again.");
    setBusy(false);
  };

  return (
    <>
      <PaymentElement options={{ layout: "tabs", wallets: { applePay: "auto", googlePay: "auto" } }} />
      {err && <p role="alert" className="mt-3 text-[0.92rem] font-semibold text-cherry">{err}</p>}
      <button type="button" onClick={pay} disabled={!stripe || busy} className="btn btn-cherry mt-5 w-full disabled:opacity-60">
        {busy ? "Paying…" : `Pay ${money(total / 100)}`}
      </button>
    </>
  );
}

export default function Checkout() {
  const { lines, clear } = useBag();
  const { id: storeId, store } = useStore();
  const photo = useMenuPhoto();
  const now = useNow();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickup, setPickup] = useState("asap");
  const [tipPct, setTipPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [session, setSession] = useState<{ orderId: string; clientSecret?: string; demo?: boolean; totalCents: number } | null>(null);

  const priced = useMemo(
    () =>
      lines.flatMap((l) => {
        try {
          return [{ line: l, p: priceLine(storeId, l) }];
        } catch {
          return [];
        }
      }),
    [lines, storeId],
  );
  const subtotal = priced.reduce((n, x) => n + x.p.totalCents, 0);
  const tax = Math.round(subtotal * TAX_RATE[storeId]);
  const tip = Math.round((subtotal * tipPct) / 100);
  const total = subtotal + tax + tip;

  const { slots, asap } = useMemo(() => (now ? pickupSlots(store.hours, now) : { slots: [], asap: false }), [now, store.hours]);
  const pickupValue = pickup === "asap" && !asap ? slots[0]?.value ?? "asap" : pickup;

  const start = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: storeId,
          lines: priced.map(({ line }) => ({ id: line.id, qty: line.qty, choices: line.choices, note: line.note })),
          customer: { name, phone, email },
          pickup: pickupValue,
          tip,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setSession(data);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const placeDemo = async () => {
    if (!session) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${session.orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ demo: true }),
    });
    if (res.ok) {
      clear();
      router.push(`/order/confirmed?order=${session.orderId}`);
    } else {
      setErr("Couldn't place the test order.");
      setBusy(false);
    }
  };

  if (!priced.length) {
    return (
      <div className="card mx-auto max-w-xl p-10 text-center">
        <p className="font-display text-[2rem]">Your bag is empty.</p>
        <p className="mt-2 text-ink-soft">Pick a drink or something from the bakery case first.</p>
        <Link href="/menu" className="btn btn-cherry mt-6">
          See the {store.name} menu <ArrowRight className="nudge" />
        </Link>
      </div>
    );
  }

  const field = "mt-1.5 w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 text-[16px] outline-none transition-colors focus:border-ink/60";
  const locked = !!session;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
      <section className="card p-6 md:p-8">
        <h2 className="text-[1.5rem]">Pickup details</h2>
        <fieldset disabled={locked} className="mt-5 grid gap-4 sm:grid-cols-2 disabled:opacity-70">
          <label className="sm:col-span-2">
            <span className="text-[0.9rem] font-semibold">Name for the order</span>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label>
            <span className="text-[0.9rem] font-semibold">Phone</span>
            <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" />
          </label>
          <label>
            <span className="text-[0.9rem] font-semibold">Email for the receipt</span>
            <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />
          </label>
          <label className="sm:col-span-2">
            <span className="text-[0.9rem] font-semibold">Pickup time at {store.name}</span>
            <select className={field} value={pickupValue} onChange={(e) => setPickup(e.target.value)}>
              {asap && <option value="asap">As soon as it&rsquo;s ready (about 10 min)</option>}
              {slots.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <span className="text-[0.9rem] font-semibold">Tip the baristas</span>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[0, 10, 15, 20].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTipPct(p)}
                  aria-pressed={tipPct === p}
                  className={`min-h-[44px] rounded-2xl border text-[0.92rem] font-semibold transition-colors ${
                    tipPct === p ? "border-ink bg-ink text-white" : "border-ink/15 bg-white"
                  }`}
                >
                  {p ? `${p}%` : "None"}
                </button>
              ))}
            </div>
          </div>
        </fieldset>

        <AnimatePresence mode="wait" initial={false}>
          {!session ? (
            <motion.div key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {err && <p role="alert" className="mt-5 text-[0.92rem] font-semibold text-cherry">{err}</p>}
              <button type="button" onClick={start} disabled={busy} className="btn btn-cherry mt-6 w-full disabled:opacity-60">
                {busy ? "One moment…" : "Continue to payment"} <ArrowRight className="nudge" />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="pay"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="mt-7 border-t border-ink/10 pt-6"
            >
              <h2 className="flex items-center gap-2 text-[1.5rem]">
                <Lock size={18} /> Payment
              </h2>
              {session.clientSecret && PK ? (
                <div className="mt-4">
                  <Elements
                    stripe={getStripe()}
                    options={{
                      clientSecret: session.clientSecret,
                      appearance: {
                        theme: "stripe",
                        variables: { colorPrimary: "#7a1f2b", borderRadius: "16px", fontFamily: "inherit" },
                      },
                    }}
                  >
                    <PayButton orderId={session.orderId} total={session.totalCents} />
                  </Elements>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-cherry/50 bg-cherry/5 p-5">
                  <p className="font-semibold">Test mode: payments aren&rsquo;t switched on yet.</p>
                  <p className="mt-1 text-[0.92rem] text-ink-soft">
                    Add the shop&rsquo;s Stripe keys to take real cards. For now, this places a test order the shop
                    can see, and nobody is charged.
                  </p>
                  {err && <p role="alert" className="mt-3 text-[0.92rem] font-semibold text-cherry">{err}</p>}
                  <button type="button" onClick={placeDemo} disabled={busy} className="btn btn-cherry mt-4 w-full disabled:opacity-60">
                    {busy ? "Placing…" : `Place test order · ${money(session.totalCents / 100)}`}
                  </button>
                </div>
              )}
              <button type="button" onClick={() => setSession(null)} className="link-under mt-4 text-[0.9rem] text-ink-soft">
                Change details
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <aside className="card p-6 md:p-8 lg:sticky lg:top-28">
        <h2 className="text-[1.5rem]">Your order</h2>
        <p className="mt-1 text-[0.92rem] text-ink-soft">
          Pickup at {store.name}, {store.street}
        </p>
        <ul className="mt-5 divide-y divide-ink/10">
          {priced.map(({ line, p }) => (
            <li key={line.key} className="flex gap-3 py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-porcelain-deep">
                <Image src={photo(line.id, 200, 200)} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">
                    {p.qty} × {itemById(line.id)?.name}
                  </span>
                  <span className="tnum">{money(p.totalCents / 100)}</span>
                </div>
                {(p.options.length > 0 || p.note) && (
                  <p className="text-[0.85rem] text-ink-soft">{[...p.options, p.note ? `“${p.note}”` : ""].filter(Boolean).join(" · ")}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-ink/10 pt-4 text-[0.95rem]">
          <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tnum">{money(subtotal / 100)}</dd></div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Tax{TAX_RATE[storeId] ? ` (${TAX_RATE[storeId] * 100}%)` : ""}</dt>
            <dd className="tnum">{money(tax / 100)}</dd>
          </div>
          {tip > 0 && <div className="flex justify-between"><dt className="text-ink-soft">Tip</dt><dd className="tnum">{money(tip / 100)}</dd></div>}
          <div className="flex justify-between pt-2 font-display text-[1.6rem]"><dt>Total</dt><dd className="tnum">{money(total / 100)}</dd></div>
        </dl>
      </aside>
    </div>
  );
}
