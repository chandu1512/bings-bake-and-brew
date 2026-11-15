"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Order } from "@/lib/order-types";
import { STORES, type StoreId } from "@/lib/site";
import { money } from "@/lib/menu";

/**
 * Live orders for the counter tablet. Sign in with STAFF_PASSWORD, pick the
 * shop, and new paid orders appear within a few seconds with a chime.
 */
const POLL_MS = 5000;

function chime() {
  try {
    const ctx = new AudioContext();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.4);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.45);
    });
  } catch {}
}

const label = (o: Order) => {
  if (o.pickup === "asap") return "ASAP";
  const tz = { timeZone: "America/New_York" } as const;
  const at = new Date(o.pickup);
  const sameDay = at.toLocaleDateString("en-US", tz) === new Date().toLocaleDateString("en-US", tz);
  return at.toLocaleString("en-US", { ...tz, hour: "numeric", minute: "2-digit", ...(sameDay ? {} : { weekday: "short" }) });
};

export default function StaffPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [store, setStore] = useState<StoreId>("amstel");
  const [orders, setOrders] = useState<Order[]>([]);
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/staff/orders?store=${store}`, { cache: "no-store" });
    if (res.status === 401) return setAuthed(false);
    const data = await res.json();
    setAuthed(true);
    const list: Order[] = data.orders ?? [];
    if (seen.current && list.some((o) => !seen.current!.has(o.id))) chime();
    seen.current = new Set(list.map((o) => o.id));
    setOrders(list);
  }, [store]);

  useEffect(() => {
    seen.current = null;
    load();
    const t = window.setInterval(load, POLL_MS);
    return () => window.clearInterval(t);
  }, [load]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (!res.ok) return setErr((await res.json()).error);
    setPw("");
    load();
  };

  const move = async (id: string, status: Order["status"]) => {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch("/api/staff/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  };

  if (authed === false) {
    return (
      <div className="shell grid min-h-[80vh] place-items-center pt-24">
        <form onSubmit={signIn} className="card w-full max-w-sm p-8">
          <h1 className="text-[1.8rem]">Staff sign in</h1>
          <p className="mt-1 text-[0.92rem] text-ink-soft">Live pickup orders for both shops.</p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
            placeholder="Password"
            className="mt-5 w-full rounded-2xl border border-ink/15 bg-white px-4 py-3 text-[16px] outline-none focus:border-ink/60"
          />
          {err && <p role="alert" className="mt-3 text-[0.9rem] font-semibold text-cherry">{err}</p>}
          <button className="btn btn-cherry mt-5 w-full">Sign in</button>
        </form>
      </div>
    );
  }

  const open = orders.filter((o) => o.status === "paid" || o.status === "demo_paid" || o.status === "ready");
  const done = orders.filter((o) => o.status === "picked_up" || o.status === "cancelled").slice(0, 12);

  return (
    <div className="shell pb-24 pt-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-md">Live orders</h1>
          <p className="text-ink-soft">Refreshes every few seconds. Keep this tab open with sound on.</p>
        </div>
        <div className="inline-flex rounded-full bg-ink/[0.07] p-1">
          {(Object.keys(STORES) as StoreId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setStore(id)}
              className={`min-h-[44px] rounded-full px-5 font-semibold transition-colors ${store === id ? "bg-white shadow-sm" : "text-ink-faint"}`}
            >
              {STORES[id].name}
            </button>
          ))}
        </div>
      </div>

      {open.length === 0 && authed && <p className="mt-16 text-center text-ink-soft">No open orders right now.</p>}

      <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence initial={false}>
          {open.map((o) => (
            <motion.li
              key={o.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.45, bounce: 0.1 }}
              className={`card p-5 ${o.status === "ready" ? "ring-2 ring-emerald-600/60" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-[2rem] leading-none">{o.code}</p>
                  <p className="mt-1 font-semibold">{o.customer.name}</p>
                  <a href={`tel:${o.customer.phone}`} className="text-[0.9rem] text-ink-soft underline">
                    {o.customer.phone}
                  </a>
                </div>
                <div className="text-right">
                  <p className="rounded-full bg-ink px-3 py-1 text-[0.85rem] font-bold text-white">{label(o)}</p>
                  {o.status === "demo_paid" && <p className="mt-1 text-[0.75rem] font-bold text-cherry">TEST · not charged</p>}
                </div>
              </div>
              <ul className="mt-4 space-y-1.5 border-t border-ink/10 pt-3">
                {o.lines.map((l, i) => (
                  <li key={i}>
                    <span className="font-semibold">
                      {l.qty} × {l.name}
                    </span>
                    {l.options.length > 0 && <span className="block text-[0.88rem] text-ink-soft">{l.options.join(" · ")}</span>}
                    {l.note && <span className="block text-[0.88rem] italic text-cherry">“{l.note}”</span>}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.9rem] text-ink-soft">Paid {money(o.totalCents / 100)}</p>
              <div className="mt-4 flex gap-2">
                {o.status !== "ready" ? (
                  <button type="button" onClick={() => move(o.id, "ready")} className="btn btn-cherry flex-1">
                    Mark ready
                  </button>
                ) : (
                  <button type="button" onClick={() => move(o.id, "picked_up")} className="btn btn-ink flex-1">
                    Picked up
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => confirm(`Cancel ${o.code}? Refund it in Stripe too.`) && move(o.id, "cancelled")}
                  className="btn btn-glass"
                >
                  Cancel
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {done.length > 0 && (
        <details className="mt-12">
          <summary className="cursor-pointer font-semibold">Finished today ({done.length})</summary>
          <ul className="mt-3 space-y-1 text-[0.92rem] text-ink-soft">
            {done.map((o) => (
              <li key={o.id}>
                {o.code} · {o.customer.name} · {money(o.totalCents / 100)} · {o.status === "cancelled" ? "cancelled" : "picked up"}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
