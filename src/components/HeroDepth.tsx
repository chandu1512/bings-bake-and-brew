"use client";

import { useEffect, useRef, useState } from "react";
import { STORE_IDS, STORES, type StoreId } from "@/lib/site";
import { useStore } from "./providers";

/**
 * Layered depth around the hero video, from per-shop images (`layers` in src/lib/site.ts).
 *
 *   back:  one static WebP: the hero background with the far bean or flour layer
 *          already composited in (no blend modes, no masks)
 *   front: the near layer, pre-blurred and transparent, in two edge strips that
 *          never overlap the video, so nothing moving ever sits on top of it
 *
 * Desktop with a mouse: the pointer writes --hx/--hy on the hero inside
 * requestAnimationFrame and CSS shifts the layers (far 8px, near 24px the other way).
 * Touch devices: nothing moves. Styles: "Hero depth" in globals.css.
 */
export default function HeroDepth({ layer }: { layer: "back" | "front" }) {
  const { id } = useStore();
  const root = useRef<HTMLDivElement>(null);
  // Only download a shop's images once it has been selected.
  const [seen, setSeen] = useState<StoreId[]>([id]);
  useEffect(() => setSeen((s) => (s.includes(id) ? s : [...s, id])), [id]);

  // Pointer parallax, set up once by the back layer, mouse only. No React state per frame.
  useEffect(() => {
    if (layer !== "back") return;
    const hero = root.current?.closest<HTMLElement>("[data-hero]");
    if (!hero) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return;
    hero.dataset.parallax = "";
    let raf = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      raf = 0;
      hero.style.setProperty("--hx", x.toFixed(3));
      hero.style.setProperty("--hy", y.toFixed(3));
    };
    const move = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const leave = () => {
      x = 0;
      y = 0;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", leave);
    return () => {
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
      delete hero.dataset.parallax;
    };
  }, [layer]);

  return (
    <div ref={root} aria-hidden className={`depth depth-${layer} pointer-events-none absolute inset-0 ${layer === "back" ? "z-0" : "z-[2]"}`}>
      {STORE_IDS.filter((sid) => seen.includes(sid)).map((sid) => {
        const L = STORES[sid].layers;
        const on = sid === id;
        return (
          <div key={sid} className="depth-set" style={{ opacity: on ? 1 : 0 }}>
            {layer === "back" ? (
              <picture>
                <source media="(max-width: 639px)" srcSet={L.bgPhone} />
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative static background */}
                <img src={L.bgWide} alt="" decoding="async" fetchPriority={on ? "high" : "low"} className="depth-far" />
              </picture>
            ) : (
              <>
                <div className="depth-near-strip depth-near-left">
                  {/* eslint-disable-next-line @next/next/no-img-element -- decorative, pre-blurred */}
                  <img src={L.near} alt="" decoding="async" loading="lazy" className="depth-near" />
                </div>
                <div className="depth-near-strip depth-near-right">
                  {/* eslint-disable-next-line @next/next/no-img-element -- decorative, pre-blurred */}
                  <img src={L.near} alt="" decoding="async" loading="lazy" className="depth-near" />
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
