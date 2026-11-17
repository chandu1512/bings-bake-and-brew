"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { STORE_IDS, STORES, type StoreId } from "@/lib/site";
import { useStore } from "./providers";

/** Soft radial feather so the clip's rectangle edge never shows. */
// Radii of 50% put full transparency exactly at the box edges, so no side or corner can show.
const FEATHER = "radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)";

/**
 * The selected shop's looping clip (Amstel: espresso, Elkton: croissant; see
 * `video` in src/lib/site.ts). The poster shows at once; the video fades in over
 * it once it plays. Switching shop crossfades the two layers over 0.6s.
 *
 * Only the selected shop's video is downloaded; the other loads the first time
 * the visitor switches to it. Playback pauses while the hero is off screen.
 * The loop is seamless because the files themselves crossfade their end into
 * their start (scripts/build-hero-videos.sh). With reduced motion: poster only.
 */
export default function HeroVideo({ className = "" }: { className?: string }) {
  const { id, ready } = useStore();
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const videos = useRef<Partial<Record<StoreId, HTMLVideoElement | null>>>({});
  const [wanted, setWanted] = useState<StoreId[]>([]);
  const [playing, setPlaying] = useState<Partial<Record<StoreId, boolean>>>({});
  const [onScreen, setOnScreen] = useState(true);

  // Load a shop's video only once it has been selected (after the remembered shop is known).
  useEffect(() => {
    if (ready && !reduce) setWanted((w) => (w.includes(id) ? w : [...w, id]));
  }, [id, ready, reduce]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Play the selected shop's clip while the hero is visible; pause everything else.
  useEffect(() => {
    for (const sid of STORE_IDS) {
      const v = videos.current[sid];
      if (!v) continue;
      if (sid === id && onScreen) v.play().catch(() => {});
      else v.pause();
    }
  }, [id, onScreen, wanted]);

  return (
    <div ref={wrap} className={`relative ${className}`}>
      {STORE_IDS.map((sid) => {
        const clip = STORES[sid].video;
        const on = sid === id;
        return (
          <div
            key={sid}
            aria-hidden={!on}
            className="absolute inset-0 transition-opacity duration-[600ms] ease-out"
            style={{ opacity: on ? 1 : 0 }}
          >
            {/* The clip's own corner colour behind it, fading out into the page cream. */}
            <div className="absolute inset-[-8%]" style={{ background: `radial-gradient(ellipse 55% 55% at 50% 50%, ${clip.bg} 40%, transparent 100%)` }} />
            {/* eslint-disable-next-line @next/next/no-img-element -- a poster that must paint before any script runs */}
            <img
              src={clip.poster}
              alt={on ? clip.label : ""}
              fetchPriority={on ? "high" : "low"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ WebkitMaskImage: FEATHER, maskImage: FEATHER }}
            />
            {wanted.includes(sid) && (
              <video
                ref={(el) => {
                  videos.current[sid] = el;
                  if (el) {
                    // Set as properties too: some mobile browsers only honour muted autoplay this way.
                    el.muted = true;
                    el.defaultMuted = true;
                  }
                }}
                autoPlay={on}
                muted
                loop
                playsInline
                preload="auto"
                disablePictureInPicture
                disableRemotePlayback
                tabIndex={-1}
                aria-hidden
                poster={clip.poster}
                onPlaying={() => setPlaying((p) => ({ ...p, [sid]: true }))}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                style={{ WebkitMaskImage: FEATHER, maskImage: FEATHER, opacity: playing[sid] ? 1 : 0 }}
              >
                <source src={clip.webm} type="video/webm" />
                <source src={clip.mp4} type="video/mp4" />
              </video>
            )}
          </div>
        );
      })}
    </div>
  );
}
