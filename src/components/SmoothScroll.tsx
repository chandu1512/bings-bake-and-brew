"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** The live Lenis instance, so the bag and the menu can pause page scroll. */
export const scroller: { lenis: Lenis | null } = { lenis: null };

export function lockScroll(lock: boolean) {
  if (lock) scroller.lenis?.stop();
  else scroller.lenis?.start();
  document.documentElement.style.overflow = lock ? "hidden" : "";
}

/**
 * Lenis drives the scroll and GSAP ScrollTrigger reads from it. Both run off
 * the one GSAP ticker so pinned sections never drift from the scroll position.
 */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: true });
    scroller.lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      scroller.lenis = null;
    };
  }, []);

  // New page: start at the top and re-measure every trigger.
  useEffect(() => {
    scroller.lenis?.scrollTo(0, { immediate: true });
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
