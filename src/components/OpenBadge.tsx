"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Store } from "@/lib/site";
import { clock, openStatus } from "@/lib/hours";
import { useNow } from "./providers";

/**
 * "Open now · closes 3pm", worked out live in the shops' own time zone.
 * Before the page has mounted it reserves the space with the (hidden) opening
 * hours, so nothing is guessed on the server and nothing jumps.
 */
export default function OpenBadge({
  store,
  tone = "light",
  className = "",
}: {
  store: Store;
  tone?: "light" | "dark";
  className?: string;
}) {
  const now = useNow();
  const status = now ? openStatus(store, now) : null;
  const first = store.hours.find(Boolean);
  const dark = tone === "dark";
  const key = status ? `${store.id}-${status.state}-${status.detail}` : `${store.id}-hours`;

  return (
    <span className={`inline-flex min-h-[1.5em] items-center ${className}`} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={key}
          initial={{ opacity: 0, filter: "blur(3px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(3px)" }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          // Until the visitor's clock is known, hold the space but show nothing, so the
          // line fades in once as "Open now" or "Closed" instead of visibly swapping text.
          className={`inline-flex items-center gap-2 whitespace-nowrap ${status ? "" : "invisible"}`}
        >
          <span
            aria-hidden
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              status?.open ? "dot-live bg-leaf text-leaf" : dark ? "bg-white/40" : "bg-ink/30"
            }`}
          />
          {status ? (
            <>
              <span className={`font-semibold ${status.open ? (dark ? "text-[#7fd6a4]" : "text-leaf") : ""}`}>
                {status.state}
              </span>
              <span aria-hidden className={dark ? "text-white/40" : "text-ink/30"}>
                /
              </span>
              <span className={dark ? "text-white/70" : "text-ink-soft"}>
                {status.closingSoon ? `closing soon, ${clock(first!.close)}` : status.detail}
              </span>
            </>
          ) : (
            <span className={dark ? "text-white/70" : "text-ink-soft"}>
              Mon to Sat, {first ? `${clock(first.open)} to ${clock(first.close)}` : ""}
            </span>
          )}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
