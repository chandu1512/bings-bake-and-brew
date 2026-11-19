"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { DEFAULT_STORE, STORE_IDS, STORES, heroGlowX, heroShift, heroVideoFiles, type StoreId } from "@/lib/site";
import { useStore } from "./providers";
import { prepareInlineVideo } from "@/lib/media-support";

/** Soft radial feather so the clip's rectangle edge never shows. */
const FEATHER = "radial-gradient(ellipse 50% 50% at 50% 50%, #000 62%, transparent 100%)";
const feather = { WebkitMaskImage: FEATHER, maskImage: FEATHER } as const;
/** 480p on phones and portrait tablets, 720p otherwise (also used as <source media> before any script runs). */
const SMALL = "(max-width: 1023px), (orientation: portrait)";

/**
 * The <video> tag is written as raw HTML so the server-rendered page carries real
 * `autoplay muted playsinline loop preload poster` attributes: iOS decides on autoplay
 * from those attributes, and React does not reliably render `muted`. It starts on the
 * default shop's clip; the client switches it if another shop is selected.
 */
function videoHtml() {
  const s = heroVideoFiles(STORES[DEFAULT_STORE].video, "480");
  const l = heroVideoFiles(STORES[DEFAULT_STORE].video, "720");
  const style = `opacity:0;-webkit-mask-image:${FEATHER};mask-image:${FEATHER}`;
  return (
    `<video class="hero-video absolute inset-0 h-full w-full object-cover transition-opacity duration-500" ` +
    `autoplay muted playsinline webkit-playsinline loop preload="auto" poster="${l.poster}" ` +
    `disablepictureinpicture disableremoteplayback tabindex="-1" aria-hidden="true" style="${style}">` +
    `<source src="${s.h264}" type="video/mp4" media="${SMALL}">` +
    `<source src="${l.h264}" type="video/mp4">` +
    `</video>`
  );
}

/**
 * One constant object: React 19 rewrites dangerouslySetInnerHTML whenever the object
 * changes identity (even with the same HTML), which would swap in a new <video> on every
 * render. Created once, it is written once.
 */
const VIDEO_HTML = { __html: videoHtml() };

/**
 * The selected shop's looping clip (Amstel: espresso, Elkton: croissant).
 *
 * - One <video> element (H.264 only), present in the server HTML with autoplay,
 *   muted, playsinline, loop, preload and poster attributes.
 * - On mount it calls play(). If the browser refuses (NotAllowedError, e.g. iOS Low
 *   Power Mode, which blocks every video autoplay), it switches at once to an animated
 *   WebP of the same loop. Animated images always play, so the hero is never still and
 *   never shows a play icon.
 * - iPhone and iPad: native `loop`. Desktop: at the end the last frame is held on a
 *   canvas, the clip restarts, and the canvas fades out over 0.5s (unchanged).
 * - Switching shop holds the current frame on the canvas, loads the other clip, and
 *   fades over 0.6s. Pauses off screen and in hidden tabs. Reduced motion: poster only.
 */
export default function HeroVideo({ className = "" }: { className?: string }) {
  const { id, ready } = useStore();
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const shot = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement | null>(null);
  const loadedStore = useRef<StoreId>(DEFAULT_STORE);
  const onScreen = useRef(true);
  const fadeMs = useRef(500);
  const showing = useRef(false);
  // Video autoplay refused: show the animated WebP of the clip instead (it always plays).
  const [blocked, setBlocked] = useState(false);

  /** Play, treating only a real refusal as blocked; a load interrupting play() (AbortError) is fine. */
  const play = useCallback(() => {
    const v = video.current;
    if (!v || !onScreen.current || document.hidden || blocked) return;
    prepareInlineVideo(v);
    v.play().catch((err: DOMException) => {
      // A load interrupting play() (AbortError) is harmless; only a refusal switches to the animation.
      if (err?.name === "NotAllowedError") setBlocked(true);
    });
  }, [blocked]);

  /** Freeze the current frame on the canvas above the video (opacity 1, no transition). */
  const hold = useCallback(() => {
    const v = video.current;
    const c = shot.current;
    if (!v || !c || !v.videoWidth) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    c.style.transition = "none";
    c.style.opacity = "1";
  }, []);

  /** Fade the held frame out once the video is showing again. */
  const release = useCallback(() => {
    const c = shot.current;
    if (!c || c.style.opacity !== "1") return;
    requestAnimationFrame(() => {
      c.style.transition = `opacity ${fadeMs.current}ms ease-out`;
      c.style.opacity = "0";
    });
  }, []);

  // Wire up the server-rendered <video>: events and loop mode.
  useEffect(() => {
    const v = holder.current?.querySelector("video") ?? null;
    video.current = v;
    if (!v) return;
    prepareInlineVideo(v);
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    // iPhone/iPad: native loop. Desktop: the held-frame hand-over at the end (as before).
    v.loop = touch;
    const onPlaying = () => {
      showing.current = true;
      v.style.opacity = "1";
      release();
    };
    // Autoplay can start from the server HTML before this runs, so also reveal on the first frame update.
    const onTime = () => {
      if (v.currentTime > 0 && v.style.opacity !== "1") onPlaying();
    };
    const onEnded = () => {
      if (v.loop) return;
      fadeMs.current = 500;
      hold();
      v.currentTime = 0;
      play();
    };
    v.addEventListener("playing", onPlaying);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnded);
    if (!v.paused && v.currentTime > 0) onPlaying(); // autoplay already running
    return () => {
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnded);
    };
  }, [hold, release, play]);

  // Centre this shop's subject on phones and tablets: the shift lives on the .hero-video-fit
  // box (Hero.tsx), so the warm glow and contact shadow move with the clip.
  useEffect(() => {
    const fit = wrap.current?.parentElement;
    if (!fit) return;
    const v = STORES[id].video;
    fit.style.setProperty("--hero-shift", heroShift(v));
    fit.style.setProperty("--hero-focus", `${v.heroFocusX}%`);
    fit.style.setProperty("--hero-glow-x", heroGlowX(v, 12));
  }, [id]);

  // Reduced motion: never play; the poster stays.
  useEffect(() => {
    if (reduce) video.current?.pause();
  }, [reduce]);

  // Play the selected shop's clip (switching the source if another shop is chosen).
  useEffect(() => {
    const v = video.current;
    if (!v || !ready || reduce || blocked) return;
    if (loadedStore.current !== id) {
      if (showing.current) {
        fadeMs.current = 600;
        hold();
      }
      const size = window.matchMedia(SMALL).matches ? "480" : "720";
      const f = heroVideoFiles(STORES[id].video, size);
      v.poster = f.poster;
      v.src = f.h264; // an explicit src overrides the server-rendered <source> list
      loadedStore.current = id;
      v.load();
    }
    play();
  }, [id, ready, reduce, blocked, hold, play]);

  // Pause off screen and when the tab is hidden; resume when back.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const sync = () => {
      const v = video.current;
      if (!v) return;
      if (onScreen.current && !document.hidden) play();
      else v.pause();
    };
    const io = new IntersectionObserver(([e]) => {
      onScreen.current = e.isIntersecting;
      sync();
    }, { threshold: 0.05 });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [play]);

  return (
    <div ref={wrap} className={`relative ${className}`}>
      {/* The clip's own corner colour glowing softly behind it. */}
      {STORE_IDS.map((sid) => (
        <div
          key={`bg-${sid}`}
          aria-hidden
          className="hero-clip-glow absolute inset-[-8%] transition-opacity duration-[600ms] ease-out"
          style={{
            opacity: sid === id ? 1 : 0,
            ["--gx-sm" as string]: heroGlowX(STORES[sid].video, 8),
            background: `radial-gradient(ellipse 55% 55% at var(--gx, 50%) 50%, ${STORES[sid].video.bg} 40%, transparent 100%)`,
          }}
        />
      ))}
      {/* Posters: the first frame of each shop's clip, crossfading with the shop. */}
      {STORE_IDS.map((sid) => {
        const on = sid === id;
        return (
          <picture key={sid}>
            <source media={SMALL} srcSet={heroVideoFiles(STORES[sid].video, "480").poster} />
            {/* eslint-disable-next-line @next/next/no-img-element -- a poster that must paint before any script runs */}
            <img
              src={heroVideoFiles(STORES[sid].video, "720").poster}
              alt={on ? STORES[sid].video.label : ""}
              aria-hidden={!on}
              fetchPriority={on ? "high" : "low"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[600ms] ease-out"
              style={{ ...feather, opacity: on ? 1 : 0 }}
            />
          </picture>
        );
      })}
      {/* The single video, server-rendered with real attributes. */}
      {!blocked && <div ref={holder} className="absolute inset-0" suppressHydrationWarning dangerouslySetInnerHTML={VIDEO_HTML} />}
      {/* Video refused (Low Power Mode): the same loop as an animated image, which always plays. */}
      {blocked && !reduce && (
        // eslint-disable-next-line @next/next/no-img-element -- animated fallback, plays without autoplay permission
        <img
          key={id}
          src={heroVideoFiles(STORES[id].video, "480").anim}
          alt=""
          aria-hidden
          decoding="async"
          className="hero-video absolute inset-0 h-full w-full object-cover"
          style={feather}
        />
      )}
      {/* The held frame during a loop hand-over or a shop switch. Only its opacity changes. */}
      <canvas ref={shot} aria-hidden className="hero-video-hold pointer-events-none absolute inset-0 h-full w-full" style={{ ...feather, opacity: 0 }} />
    </div>
  );
}
