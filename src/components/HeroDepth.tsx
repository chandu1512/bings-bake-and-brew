"use client";

import { useEffect, useRef, useState } from "react";
import { STORE_IDS, STORES, type StoreId } from "@/lib/site";
import { useStore } from "./providers";

/**
 * Layered depth behind and in front of the hero video, from one still per shop
 * (`layers` in src/lib/site.ts). CSS transforms only.
 *
 *   back:  the hero background colour plus the image at normal size (far layer)
 *   front: the same image at 1.7x, blurred, only at the far left and right edges
 *
 * Desktop: the pointer writes --hx/--hy on the hero inside requestAnimationFrame,
 * and CSS moves the layers (far up to 8px, near up to 24px the other way) with
 * a 0.4s ease. Touch: a slow CSS drift instead. Reduced motion: still.
 * Styles live in globals.css under "Hero depth".
 */
export default function HeroDepth({ layer }: { layer: "back" | "front" }) {
  const { id } = useStore();
  const root = useRef<HTMLDivElement>(null);
  // Only download a shop's image once it has been selected.
  const [seen, setSeen] = useState<StoreId[]>([id]);
  useEffect(() => setSeen((s) => (s.includes(id) ? s : [...s, id])), [id]);

  // Pointer parallax, set up once by the back layer. No React state per frame.
  useEffect(() => {
    if (layer !== "back") return;
    const hero = root.current?.closest<HTMLElement>("[data-hero]");
    if (!hero) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!fine.matches || still.matches) return;
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
    };
  }, [layer]);

  return (
    <div ref={root} aria-hidden className={`depth depth-${layer} pointer-events-none absolute inset-0 ${layer === "back" ? "z-0" : "z-[2]"}`}>
      {STORE_IDS.filter((sid) => seen.includes(sid)).map((sid) => {
        const L = STORES[sid].layers;
        const on = sid === id;
        return (
          // Only the far layer blends (multiply); the near layer is a pre-keyed image with normal blending.
          <div key={sid} className={`depth-set ${layer === "back" ? `depth-${L.blend}` : ""}`} style={{ opacity: on ? 1 : 0 }}>
            {layer === "back" ? (
              <>
                {/* "match" images: the hero takes the image's own backdrop colour. */}
                {L.blend === "match" && <div className="absolute inset-0" style={{ background: L.bg }} />}
                <div className="depth-far-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element -- decorative, CSS-transformed layer */}
                  <img src={L.src} alt="" decoding="async" fetchPriority={on ? "high" : "low"} className="depth-far" />
                  {/* Phones: the left cluster at the top, the right cluster at the bottom, nothing mid-screen. */}
                  <div className="depth-far-phone" style={{ backgroundImage: `url(${L.src}), url(${L.src})` }} />
                </div>
              </>
            ) : (
              <div className="depth-near-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element -- decorative, CSS-transformed layer */}
                <img src={L.near} alt="" decoding="async" loading="lazy" className="depth-near" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
