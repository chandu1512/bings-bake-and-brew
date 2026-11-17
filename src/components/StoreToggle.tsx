"use client";

import { motion, useReducedMotion } from "framer-motion";
import { STORE_IDS, STORES } from "@/lib/site";
import { openStatus } from "@/lib/hours";
import { useNow, useStore } from "./providers";

/**
 * The shop switch. Two options, one glass pill that slides between them.
 * `id` keeps each copy's pill separate so two switches on a page never fight.
 */
export default function StoreToggle({
  id,
  size = "lg",
  tone = "light",
  className = "",
}: {
  id: string;
  size?: "sm" | "lg";
  tone?: "light" | "dark";
  className?: string;
}) {
  const { id: active, setStore } = useStore();
  const now = useNow();
  const reduce = useReducedMotion();
  const lg = size === "lg";
  const dark = tone === "dark";

  return (
    <div
      role="radiogroup"
      aria-label="Choose your shop"
      className={`relative grid grid-cols-2 rounded-full ${lg ? "p-1.5" : "p-1"} ${
        dark
          ? "bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]"
          : "bg-ink/[0.07] shadow-[inset_0_1px_2px_rgba(29,20,17,0.14),inset_0_0_0_1px_rgba(29,20,17,0.05)]"
      } ${className}`}
    >
      {STORE_IDS.map((sid) => {
        const s = STORES[sid];
        const on = sid === active;
        const open = now ? openStatus(s, now).open : null;
        return (
          <button
            key={sid}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setStore(sid)}
            className={`relative rounded-full text-left transition-transform duration-150 ease-out active:scale-[0.97] ${
              lg ? "min-h-[60px] px-4 py-2.5 sm:px-6" : "min-h-[40px] px-4 py-1.5"
            }`}
          >
            {on && (
              <motion.span
                layoutId={`store-pill-${id}`}
                transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.5, bounce: 0.18 }}
                className={`absolute inset-0 rounded-full ${
                  !lg && !dark
                    ? "bg-ink shadow-[0_8px_18px_-10px_rgba(29,20,17,0.7)]"
                    : dark
                    ? "bg-gradient-to-b from-white to-[#ece9df] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.8)]"
                    : "bg-gradient-to-b from-white to-[#f6f6f2] shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgba(29,20,17,0.06),0_10px_22px_-12px_rgba(29,20,17,0.5)]"
                }`}
              />
            )}
            <span className="relative flex items-center gap-2.5">
              {lg && (
                <span
                  aria-hidden
                  className={`h-2 w-2 shrink-0 rounded-full transition-colors duration-300 ${
                    open === null ? "bg-ink/20" : open ? "bg-leaf" : "bg-ink/30"
                  } ${!on && dark ? "opacity-70" : ""}`}
                />
              )}
              <span className="flex flex-col leading-tight">
                <span
                  className={`whitespace-nowrap font-semibold transition-colors duration-200 ${lg ? "text-[1rem]" : "text-sm"} ${
                    on ? (!lg && !dark ? "text-white" : "text-ink") : dark ? "text-white/80" : "text-ink-soft"
                  }`}
                >
                  {lg ? s.name : sid === "amstel" ? "Amstel" : "Elkton"}
                </span>
                {lg && (
                  <span
                    className={`text-[0.8rem] transition-colors duration-200 ${
                      on ? "text-ink-faint" : dark ? "text-white/55" : "text-ink-faint"
                    }`}
                  >
                    {s.town}
                  </span>
                )}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
