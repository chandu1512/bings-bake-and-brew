"use client";

import { useEffect, useRef } from "react";

/**
 * Phones only: a thin chevron at the bottom of the hero that fades out once the
 * visitor scrolls. The scroll listener changes a class on the element directly
 * (no React state), and removes itself after the first scroll.
 */
export default function HeroScrollCue() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const check = () => {
      if (window.scrollY > 24) {
        el.current?.classList.replace("opacity-100", "opacity-0");
        window.removeEventListener("scroll", check);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);
  return (
    <div ref={el} aria-hidden className="hero-cue pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center opacity-100 md:hidden">
      <svg width="28" height="16" viewBox="0 0 28 16" fill="none" className="hero-cue-chevron text-ink/45">
        <path d="M2 3l12 10L26 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
