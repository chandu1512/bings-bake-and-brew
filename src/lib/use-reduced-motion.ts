"use client";

import { useEffect, useState } from "react";

/**
 * The visitor's "reduce motion" setting, safe for server rendering.
 *
 * Framer Motion's useReducedMotion() reads the setting during the very first
 * render in the browser, but the server can't know it. On phones with Reduce
 * Motion switched on, that made the server HTML and the first client render
 * disagree (different classes and styles), which is a hydration error. This
 * returns false on the server and on the first client render, then the real
 * value right after mount, and follows changes to the setting.
 * Movement itself is already toned down from the first frame by
 * <MotionConfig reducedMotion="user"> in providers.tsx.
 */
export function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}
