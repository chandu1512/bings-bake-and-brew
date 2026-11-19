"use client";

import { useBag } from "./providers";
import Link from "next/link";
import { ArrowRight, BagIcon, Lock } from "./icons";
import BeanDivider from "@/components/BeanDivider";

const STEPS = [
  { t: "Pick your shop", d: "Amstel Square or Elkton. The menu, prices and hours below follow your choice." },
  { t: "Make it yours", d: "Pick a size, milk, flavor or an extra shot, then add it to your bag." },
  { t: "Pay and pick up", d: "Pay right here by card, Apple Pay or Google Pay, choose a pickup time, and we’ll have it ready." },
];

export default function OrderIntro() {
  const { open, count } = useBag();
  return (
    <div>
      <div className="section-head !mb-10">
        <h1 className="display-xl">Order ahead, pick it up.</h1>
        <BeanDivider />
        <p className="lede">
          Build your order, pay right here, and skip the line. Card details go straight to Stripe and never touch our servers.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={open} className="btn btn-cherry">
            <BagIcon size={18} /> Open your bag ({count})
          </button>
          <Link href="/checkout" className="btn btn-glass">
            Go to checkout <ArrowRight className="nudge" />
          </Link>
        </div>
      </div>
      <ol className="mx-auto max-w-[1000px] md:grid md:grid-cols-3 md:gap-8">
        {STEPS.map((s, i) => (
          <li key={s.t} className="flex gap-5 border-t border-ink/10 py-5 last:border-b md:border-b">
            <span className="tnum font-display text-[2rem] leading-none text-cherry">{i + 1}</span>
            <div>
              <h2 className="font-sans text-[1.1rem] font-semibold tracking-normal">
                {s.t} {i === 2 && <Lock className="ml-1 inline align-[-2px]" />}
              </h2>
              <p className="mt-1 text-ink-soft">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
