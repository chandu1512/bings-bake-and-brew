"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { STORES, type StoreId } from "@/lib/site";
import { money } from "@/lib/menu";
import type { PricedLine } from "@/lib/order-types";
import { useBag } from "@/components/providers";
import { Check } from "@/components/icons";

type Result = {
  code: string;
  store: StoreId;
  status: string;
  pickup: string;
  name: string;
  lines: PricedLine[];
  totalCents: number;
};

function Confirmed() {
  const params = useSearchParams();
  const orderId = params.get("order") ?? "";
  const { clear } = useBag();
  const [order, setOrder] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return setErr("No order to show.");
    let tries = 0;
    const check = async () => {
      const res = await fetch(`/api/orders/${orderId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) return setErr(data.error ?? "Couldn't find that order.");
      if (data.status === "awaiting_payment" && tries++ < 6) return void setTimeout(check, 1500);
      setOrder(data);
      if (data.status !== "awaiting_payment") clear();
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (err) return <p className="text-center text-ink-soft">{err}</p>;
  if (!order) return <p className="text-center text-ink-soft">Checking your payment…</p>;

  const paid = order.status !== "awaiting_payment";
  const store = STORES[order.store];
  const when =
    order.pickup === "asap"
      ? "in about 10 minutes"
      : new Date(order.pickup).toLocaleString("en-US", { timeZone: "America/New_York", weekday: "long", hour: "numeric", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="card mx-auto max-w-xl p-8 text-center md:p-10"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6, bounce: 0.35, delay: 0.1 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cherry text-white"
      >
        <Check size={30} />
      </motion.div>
      <h1 className="display-md mt-5">{paid ? `Thanks, ${order.name.split(" ")[0]}!` : "Payment pending"}</h1>
      <p className="mt-2 text-ink-soft">
        {paid
          ? `Order ${order.code} is in. Pick it up at ${store.name}, ${store.street}, ${when}.`
          : "We haven't heard back from the bank yet. Refresh in a minute, or call the shop."}
      </p>
      {order.status === "demo_paid" && (
        <p className="mt-3 rounded-xl bg-cherry/10 px-3 py-2 text-[0.88rem] font-semibold text-cherry">Test order: nobody was charged.</p>
      )}
      <p className="mt-6 font-display text-[3rem] leading-none tracking-wide">{order.code}</p>
      <p className="text-[0.85rem] text-ink-faint">Give this name or code at the counter</p>
      <ul className="mt-6 space-y-1 text-left text-[0.95rem]">
        {order.lines.map((l, i) => (
          <li key={i} className="flex justify-between gap-3">
            <span>
              {l.qty} × {l.name}
              {l.options.length > 0 && <span className="text-ink-soft"> · {l.options.join(", ")}</span>}
            </span>
            <span className="tnum">{money(l.totalCents / 100)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t border-ink/10 pt-2 font-semibold">
          <span>Total paid</span>
          <span className="tnum">{money(order.totalCents / 100)}</span>
        </li>
      </ul>
      <Link href="/" className="btn btn-glass mt-8">
        Back to the shop
      </Link>
    </motion.div>
  );
}

export default function ConfirmedPage() {
  return (
    <div className="shell pb-24 pt-28 md:pt-36">
      <Suspense fallback={<p className="text-center text-ink-soft">Loading…</p>}>
        <Confirmed />
      </Suspense>
    </div>
  );
}
