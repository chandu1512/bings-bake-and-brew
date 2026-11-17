"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { itemById, money } from "@/lib/menu";
import { priceLine } from "@/lib/pricing";
import { useBag, useMenuPhoto, useStore } from "./providers";
import { ArrowRight, Close, Lock, Minus, Plus } from "./icons";
import { lockScroll } from "./SmoothScroll";

const EASE = [0.32, 0.72, 0, 1] as const;

export function Stepper({
  qty,
  onChange,
  label,
  small = false,
}: {
  qty: number;
  onChange: (n: number) => void;
  label: string;
  small?: boolean;
}) {
  const d = small ? "h-9 w-9" : "h-10 w-10";
  return (
    <div className="inline-flex items-center rounded-full bg-ink/[0.07] p-0.5 shadow-[inset_0_1px_2px_rgba(29,20,17,0.12)]">
      <button
        type="button"
        aria-label={`One fewer ${label}`}
        onClick={() => onChange(qty - 1)}
        className={`${d} grid place-items-center rounded-full bg-white shadow-sm transition-transform duration-150 ease-out active:scale-90`}
      >
        <Minus size={16} />
      </button>
      <span className="tnum relative grid h-9 w-8 place-items-center overflow-hidden text-[0.95rem] font-bold" aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={qty}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          >
            {qty}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        aria-label={`One more ${label}`}
        onClick={() => onChange(qty + 1)}
        className={`${d} grid place-items-center rounded-full bg-white shadow-sm transition-transform duration-150 ease-out active:scale-90`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

/**
 * The bag. Items are collected here, then /checkout takes payment on this
 * site through Stripe. Card details go straight to Stripe, never to our server.
 */
export default function BagDrawer() {
  const { isOpen, close, lines, total, hasUnpriced, count, setQty, clear, editLine } = useBag();
  const { id: storeId } = useStore();
  const { store } = useStore();
  const photo = useMenuPhoto();
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    lockScroll(isOpen);
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={`Your bag at ${store.name}`}>
          <motion.button
            type="button"
            aria-label="Close the bag"
            tabIndex={-1}
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 h-full w-full cursor-default bg-espresso/45"
          />
          <motion.aside
            initial={reduce ? { opacity: 0 } : { x: "104%" }}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={reduce ? { opacity: 0 } : { x: "104%", transition: { duration: 0.24, ease: EASE } }}
            transition={{ duration: 0.46, ease: EASE }}
            className="glass absolute bottom-0 right-0 top-0 flex h-[100dvh] w-full max-w-[440px] flex-col !bg-[rgba(250,251,248,0.94)] sm:bottom-3 sm:right-3 sm:top-3 sm:h-auto sm:rounded-[28px]"
          >
            <header className="flex items-start justify-between gap-4 px-6 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
              <div>
                <h2 className="text-[1.9rem]">Your bag</h2>
                <p className="mt-1 text-[0.95rem] text-ink-soft">
                  Pickup at <strong className="font-semibold text-ink">{store.name}</strong>, {store.street}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close the bag"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink/[0.07] transition-transform duration-150 ease-out active:scale-90"
              >
                <Close />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto overscroll-contain px-6">
              {lines.length === 0 ? (
                <div className="grid h-full place-items-center pb-10 text-center">
                  <div>
                    <p className="font-display text-[1.6rem]">Nothing in the bag yet.</p>
                    <p className="mx-auto mt-2 max-w-[28ch] text-ink-soft">
                      Add a drink or something from the bakery case and it lands here.
                    </p>
                    <Link href="/menu" onClick={close} className="btn btn-glass mt-6">
                      See the {store.name} menu
                    </Link>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-ink/10">
                  <AnimatePresence initial={false} mode="popLayout">
                    {lines.map((l) => {
                      const item = itemById(l.id);
                      if (!item) return null;
                      let p: number | null = null;
                      let opts: string[] = [];
                      try {
                        const pl = priceLine(storeId, l);
                        p = pl.totalCents / 100;
                        opts = pl.options;
                      } catch {}
                      return (
                        <motion.li
                          key={l.key}
                          layout={reduce ? false : "position"}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.16 } }}
                          transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                          className="flex gap-4 py-4"
                        >
                          <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden rounded-2xl bg-porcelain-deep">
                            <Image src={photo(item.id)} alt={item.name} fill sizes="68px" className="object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <h3 className="text-[1rem]">{item.name}</h3>
                              <span className="tnum shrink-0 text-right text-[0.95rem] font-semibold">
                                {p !== null ? money(p) : "Ask at counter"}
                              </span>
                            </div>
                            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-[0.85rem] leading-snug text-ink-soft">
                                  {[...opts, l.note ? `“${l.note}”` : ""].filter(Boolean).join(" · ")}
                                </p>
                                {item.groups?.length || item.base != null ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      close();
                                      editLine(l.key);
                                    }}
                                    className="link-under mt-1.5 -ml-0.5 px-0.5 py-1 text-[0.85rem] font-semibold text-ink"
                                    aria-label={`Edit ${item.name}`}
                                  >
                                    Edit
                                  </button>
                                ) : null}
                              </div>
                              <Stepper small qty={l.qty} onChange={(n) => setQty(l.key, n)} label={item.name} />
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {lines.length > 0 && (
              <footer className="border-t border-ink/10 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-ink-soft">
                    Estimated total, {count} {count === 1 ? "item" : "items"}
                  </span>
                  <span className="tnum relative overflow-hidden font-display text-[1.9rem] leading-none">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={total.toFixed(2)}
                        className="block"
                        initial={{ opacity: 0, y: 10, filter: "blur(3px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10, filter: "blur(3px)" }}
                        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                      >
                        {money(total)}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </div>
                <p className="mt-1 text-[0.85rem] text-ink-faint">
                  {hasUnpriced ? "Counter-only items are left out. " : ""}Subtotal before tax.
                </p>

                <Link href="/checkout" onClick={close} className="btn btn-cherry mt-4 w-full">
                  Checkout <ArrowRight className="nudge" />
                </Link>
                <p className="mt-3 flex gap-2 text-[0.88rem] leading-snug text-ink-soft">
                  <Lock className="mt-0.5 shrink-0" />
                  <span>Pay right here with card, Apple Pay or Google Pay. Pick up at {store.name}.</span>
                </p>
                <div className="mt-2 flex justify-end text-[0.9rem]">
                  <button type="button" onClick={clear} className="min-h-[44px] font-semibold text-ink-faint hover:text-ink">
                    Empty the bag
                  </button>
                </div>
              </footer>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
