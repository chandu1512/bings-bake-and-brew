"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "./icons";
import { chefFormat, prepareInlineVideo, type ChefFormat } from "@/lib/media-support";

/**
 * The baker mascot on the history timeline. Desktop (horizontal timeline): when
 * the section comes into view he walks from the 1871 dot to the Today dot, each
 * dot glows as he reaches it, then he turns, waves, holds the last pose with a
 * gentle breath, and a "Fresh today!" bubble offers Order pickup. Phones
 * (vertical timeline): he stands at Today and waves once. Reduced motion: the
 * still at Today, no video.
 *
 * Files: public/chef, made by scripts/key-chef.sh. Position moves with a
 * compositor-driven transform animation (Web Animations API); no per-frame state.
 */

/** Size of the keyed clips (scripts/key-chef.sh). */
const CLIP_W = 248;
const CLIP_H = 360;
/** How far his planted foot moves back per second in walk.mp4, in clip pixels (measured: 93px per 32-frame step at 30fps). */
const FOOT_SPEED = 87;
/** Where his feet centre sits inside the clip, in clip pixels from the left. */
const FEET_X = 97;
/** Wanted trip length. The walk speeds up to MAX_RATE at most to get close; beyond that the trip simply takes longer, so the feet never slide. */
const TARGET_SECONDS = 9;
const MAX_RATE = 1.8;
/** The animated WebP fallback (scripts: see public/chef) runs every walk frame at 20ms, i.e. 1.67x, and the wave in real time. */
const WEBP_WALK_RATE = 1000 / 30 / 20;
const WAVE_MS = (156 / 30) * 1000;
/**
 * Touch devices: CSS sprite sheets (public/chef/walk-sprite.webp, wave-sprite.webp, made by
 * scripts/build-chef-sprites.py), 24 frames each. The walk steps at 24fps, so one full stride
 * (two steps, 2 x 93 clip px) takes 1s and he travels at 186 clip px/s, matched to his feet.
 * The wave steps at 12fps. Keep SPRITE_WALK_FPS in step with `.chef-sprite-walk` in globals.css.
 */
const SPRITE_FRAMES = 24;
const SPRITE_WALK_FPS = 24;
const SPRITE_WAVE_FPS = 12;
const SPRITE_WALK_RATE = (2 * 93) / (SPRITE_FRAMES / SPRITE_WALK_FPS) / FOOT_SPEED;
const SPRITE_WAVE_MS = ((SPRITE_FRAMES - 1) / SPRITE_WAVE_FPS) * 1000;

/** One frame of a sprite sheet, stepped by CSS (see "Chef sprites" in globals.css). */
function Sprite({ kind, height }: { kind: "walk" | "wave"; height: number }) {
  const fw = (height * CLIP_W) / CLIP_H;
  return <div className={`chef-sprite chef-sprite-${kind} absolute inset-0`} style={{ ["--fw" as string]: `${fw}px` }} />;
}

type Phase = "idle" | "walking" | "waving" | "done";

/** Which transparent format this browser gets; null until mounted. See src/lib/media-support.ts. */
function useChefFormat() {
  const [fmt, setFmt] = useState<ChefFormat | null>(null);
  useEffect(() => setFmt(chefFormat()), []);
  // If the browser refuses to play the video (e.g. iOS Low Power Mode), switch to the
  // animated WebP: images are never autoplay-blocked, so he never slides along frozen.
  const blocked = useCallback(() => setFmt("webp"), []);
  return [fmt, blocked] as const;
}

/**
 * HEVC-with-alpha first for Safari (the only alpha video WebKit can show), then
 * VP9 WebM for Chrome and Firefox. WebKit is never offered the WebM, because it
 * would play it with a solid box behind him.
 */
function Sources({ name, fmt }: { name: "walk" | "wave"; fmt: ChefFormat }) {
  return fmt === "hevc" ? (
    <>
      <source src={`/chef/${name}.mov`} type='video/mp4; codecs="hvc1"' />
      <source src={`/chef/${name}.mov`} type='video/quicktime; codecs="hvc1"' />
    </>
  ) : (
    <source src={`/chef/${name}.webm`} type='video/webm; codecs="vp9"' />
  );
}

/** Animated WebP restarts per URL, so each trip gets its own copy of the wave. */
const waveWebp = (trip: number) => `/chef/wave.webp?t=${trip}`;

function Bubble({ onReplay, showReplay }: { onReplay?: () => void; showReplay: boolean }) {
  return (
    <div className="chef-bubble relative rounded-3xl bg-porcelain-light px-5 py-4 text-ink shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]">
      <p className="font-display text-[1.5rem] leading-none">Fresh today!</p>
      <Link href="/order" className="btn btn-cherry mt-3 !min-h-[44px] !px-4 text-[0.95rem]">
        Order pickup <ArrowRight className="nudge" />
      </Link>
      {showReplay && onReplay && (
        <button type="button" onClick={onReplay} className="link-under ml-3 py-2 text-[0.9rem] font-semibold text-ink-soft">
          Walk again
        </button>
      )}
    </div>
  );
}

/** Horizontal timeline (lg and up): the walk. */
function DesktopWalk({ reduce, wide }: { reduce: boolean; wide: boolean }) {
  const [fmt, onBlocked] = useChefFormat();
  const root = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const onScreen = useRef(false);
  const mover = useRef<HTMLDivElement>(null);
  const walk = useRef<HTMLVideoElement>(null);
  const wave = useRef<HTMLVideoElement>(null);
  const timers = useRef<number[]>([]);
  const anim = useRef<Animation | null>(null);
  const [near, setNear] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [waveLoaded, setWaveLoaded] = useState(false);
  const [trip, setTrip] = useState(0);
  // Bubble on his left when the Today dot is too close to the right edge (e.g. iPad landscape).
  const [bubbleLeft, setBubbleLeft] = useState(false);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    anim.current?.cancel();
    anim.current = null;
  };

  // Load while the section is near; start the walk once it is actually on screen; unload when far away.
  // Only on wide screens, where the timeline is horizontal; phones never load the walk.
  useEffect(() => {
    const el = root.current?.closest("section");
    if (!el || reduce || !wide) return;
    const far = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "100% 0px" });
    // Pause the walk while the section is off screen (he keeps his place); resume when it is back.
    const visible = new IntersectionObserver(([e]) => {
      onScreen.current = e.isIntersecting;
      const v = walk.current;
      if (!v) return;
      if (e.isIntersecting && phaseRef.current === "walking") v.play().catch(onBlocked);
      else v.pause();
    });
    visible.observe(el);
    const seen = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setTrip((t) => (t === 0 ? 1 : t));
    }, { threshold: 0.35 });
    far.observe(el);
    seen.observe(el);
    return () => {
      far.disconnect();
      seen.disconnect();
      visible.disconnect();
      setNear(false);
    };
  }, [reduce, wide]);

  // Far off screen: stop everything and drop the videos; coming back starts a fresh trip.
  useEffect(() => {
    if (near) return;
    clear();
    setPhase("idle");
    setWaveLoaded(false);
    setTrip(0);
  }, [near]);

  // One trip along the line.
  useEffect(() => {
    if (!trip || !near || reduce || !fmt) return;
    const box = root.current;
    const m = mover.current;
    const v = walk.current;
    const imageMode = fmt === "webp" || fmt === "sprite";
    if (!box || !m || !m.offsetHeight || (!imageMode && !v)) return;
    const dots = [...box.parentElement!.querySelectorAll<HTMLElement>("[data-dot]")];
    const stops = [...box.parentElement!.querySelectorAll<HTMLElement>("[data-stop]")];
    if (dots.length < 2) return;
    const scaleCheck = m.offsetHeight / CLIP_H;
    if (!(scaleCheck > 0)) return;

    const base = box.getBoundingClientRect().left;
    const xs = dots.map((d) => d.getBoundingClientRect().left + d.offsetWidth / 2 - base);
    const scale = m.offsetHeight / CLIP_H;
    const feet = FEET_X * scale;
    const from = xs[0] - feet;
    const to = xs[xs.length - 1] - feet;
    const distance = to - from;
    // Flip only if a right-hand bubble would run off the screen (it may extend past the timeline itself).
    setBubbleLeft(base + to + m.offsetWidth * 0.85 + 280 > document.documentElement.clientWidth - 12);
    // Travel exactly as fast as the planted foot moves back, so it never slides.
    const rate =
      fmt === "sprite" ? SPRITE_WALK_RATE : fmt === "webp" ? WEBP_WALK_RATE : Math.min(MAX_RATE, Math.max(1, distance / TARGET_SECONDS / (FOOT_SPEED * scale)));
    const seconds = distance / (FOOT_SPEED * scale * rate);

    clear();
    stops.forEach((s) => s.removeAttribute("data-passed"));
    setPhase("walking");
    phaseRef.current = "walking";
    if (v) {
      prepareInlineVideo(v);
      v.currentTime = 0;
      v.playbackRate = rate;
      if (onScreen.current) v.play().catch(onBlocked);
    }

    anim.current = m.animate([{ transform: `translateX(${from}px)` }, { transform: `translateX(${to}px)` }], {
      duration: seconds * 1000,
      easing: "linear",
      fill: "forwards",
    });
    // Each dot glows as his feet reach it.
    xs.forEach((x, i) => {
      const at = ((x - feet - from) / distance) * seconds * 1000;
      timers.current.push(window.setTimeout(() => stops[i]?.setAttribute("data-passed", ""), at));
    });
    // Halfway: start loading the wave.
    timers.current.push(
      window.setTimeout(() => {
        setWaveLoaded(true);
        if (fmt === "webp") new Image().src = waveWebp(trip);
        if (fmt === "sprite") new Image().src = "/chef/wave-sprite.webp";
      }, (seconds * 1000) / 2),
    );
    // Arrived: crossfade into the wave.
    timers.current.push(
      window.setTimeout(() => {
        setPhase("waving");
        phaseRef.current = "waving";
        const w = wave.current;
        if (imageMode) {
          timers.current.push(window.setTimeout(() => setPhase("done"), fmt === "sprite" ? SPRITE_WAVE_MS : WAVE_MS));
        } else if (w) {
          prepareInlineVideo(w);
          w.currentTime = 0;
          w.play().catch(() => {
            setPhase("done");
          });
        } else setPhase("done");
        window.setTimeout(() => v?.pause(), 160);
      }, seconds * 1000),
    );
    return clear;
  }, [trip, near, reduce, fmt, onBlocked]);

  const replay = useCallback(() => setTrip((t) => t + 1), []);

  if (reduce) {
    return (
      <div ref={root} className="pointer-events-none absolute inset-x-0 hidden lg:block" style={{ height: 140, bottom: "calc(100% - 4px)" }}>
        <ReducedAtToday />
      </div>
    );
  }

  const done = phase === "done";
  return (
    <div ref={root} className="pointer-events-none absolute inset-x-0 hidden lg:block" style={{ height: 140, bottom: "calc(100% - 4px)" }}>
      <div ref={mover} className="chef-mover absolute bottom-0 left-0" style={{ height: 140, width: (140 * CLIP_W) / CLIP_H }}>
        <div aria-hidden className="relative h-full w-full">
          {near && fmt === "sprite" && phase === "walking" && <Sprite kind="walk" height={140} />}
          {near && fmt === "sprite" && phase === "waving" && <Sprite key={`wave-${trip}`} kind="wave" height={140} />}
          {near && fmt === "webp" && phase === "walking" && (
            // eslint-disable-next-line @next/next/no-img-element -- transparent animated fallback for WebKit without HEVC alpha
            <img src="/chef/walk.webp" alt="" className="absolute inset-0 h-full w-full" />
          )}
          {near && fmt && fmt !== "webp" && fmt !== "sprite" && (
            <video
              ref={walk}
              muted
              playsInline
              loop
              preload="auto"
              disablePictureInPicture
              className="chef-video absolute inset-0 h-full w-full transition-opacity duration-150"
              style={{ opacity: phase === "walking" || phase === "idle" ? 1 : 0 }}
            >
              <Sources name="walk" fmt={fmt} />
            </video>
          )}
          {near && fmt === "webp" && phase === "waving" && (
            // eslint-disable-next-line @next/next/no-img-element -- transparent animated fallback, plays once
            <img src={waveWebp(trip)} alt="" className="absolute inset-0 h-full w-full" />
          )}
          {near && waveLoaded && fmt && fmt !== "webp" && fmt !== "sprite" && (
            <video
              ref={wave}
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              onEnded={() => setPhase("done")}
              className="chef-video absolute inset-0 h-full w-full transition-opacity duration-150"
              style={{ opacity: phase === "waving" ? 1 : 0 }}
            >
              <Sources name="wave" fmt={fmt} />
            </video>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element -- transparent still, swapped in over the video */}
          {waveLoaded && <img src="/chef/wave-end.png" alt="" className="chef-breathe absolute inset-0 h-full w-full" style={{ opacity: done ? 1 : 0 }} />}
        </div>
        {done && (
          <div className={`pointer-events-auto absolute bottom-[55%] w-max ${bubbleLeft ? "right-[85%]" : "left-[85%]"}`}>
            <Bubble onReplay={replay} showReplay />
          </div>
        )}
      </div>
    </div>
  );
}

/** Reduced motion, desktop: the still standing on the Today dot. */
function ReducedAtToday() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current?.parentElement;
    const dots = box?.parentElement?.querySelectorAll<HTMLElement>("[data-dot]");
    if (!box || !dots?.length || !ref.current) return;
    const last = dots[dots.length - 1].getBoundingClientRect();
    const x = last.left + last.width / 2 - box.getBoundingClientRect().left - FEET_X * (140 / CLIP_H);
    ref.current.style.transform = `translateX(${x}px)`;
  }, []);
  return (
    <div ref={ref} className="absolute bottom-0 left-0" style={{ height: 140, width: (140 * CLIP_W) / CLIP_H }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- transparent still */}
      <img src="/chef/chef.png" alt="" aria-hidden className="h-full w-full" />
      <div className="pointer-events-auto absolute bottom-[55%] left-[85%] w-max">
        <Bubble showReplay={false} />
      </div>
    </div>
  );
}

/** Vertical timeline (phones, tablets): he stands at Today and waves once. */
function MobileWave({ reduce }: { reduce: boolean }) {
  const [fmt, onBlocked] = useChefFormat();
  const root = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "play" | "done">(reduce ? "done" : "idle");
  useEffect(() => {
    const el = root.current;
    // Reduced motion is only known after mount: go straight to the still and the bubble.
    if (reduce) return setState("done");
    if (!el) return;
    // Starts once he is half in view; pauses whenever he scrolls off screen.
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setState((s) => (s === "idle" ? "play" : s));
      const v = video.current;
      if (v && !v.ended) {
        if (e.isIntersecting) v.play().catch(onBlocked);
        else v.pause();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce, onBlocked]);

  // Video: prepare it for inline muted playback, then play. WebP: it plays once by itself.
  useEffect(() => {
    if (state !== "play" || !fmt) return;
    if (fmt === "webp" || fmt === "sprite") {
      const t = window.setTimeout(() => setState("done"), fmt === "sprite" ? SPRITE_WAVE_MS : WAVE_MS);
      return () => window.clearTimeout(t);
    }
    const v = video.current;
    if (!v) return;
    prepareInlineVideo(v);
    v.play().catch(onBlocked);
  }, [state, fmt, onBlocked]);

  return (
    <div ref={root} className="mt-6 flex items-end gap-3 lg:hidden">
      <div aria-hidden className="relative shrink-0" style={{ height: 120, width: (120 * CLIP_W) / CLIP_H }}>
        {state === "play" && fmt === "webp" && (
          // eslint-disable-next-line @next/next/no-img-element -- transparent animated fallback, plays once
          <img src={waveWebp(0)} alt="" className="absolute inset-0 h-full w-full" />
        )}
        {state === "play" && fmt === "sprite" && <Sprite kind="wave" height={120} />}
        {state === "play" && fmt && fmt !== "webp" && fmt !== "sprite" && (
          <video ref={video} muted playsInline autoPlay preload="auto" disablePictureInPicture onEnded={() => setState("done")} className="chef-video absolute inset-0 h-full w-full">
            <Sources name="wave" fmt={fmt} />
          </video>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- transparent still */}
        {state !== "idle" && <img
          src={reduce ? "/chef/chef.png" : "/chef/wave-end.png"}
          alt=""
          className={`absolute inset-0 h-full w-full ${state === "done" && !reduce ? "chef-breathe" : ""}`}
          style={{ opacity: state === "play" ? 0 : 1 }}
        />}
      </div>
      <div className={`mb-6 transition-opacity duration-500 ${state === "done" ? "opacity-100" : "invisible opacity-0"}`}>
        <Bubble showReplay={false} />
      </div>
    </div>
  );
}

export default function ChefWalk({ placement }: { placement: "line" | "after" }) {
  const [reduce, setReduce] = useState(false);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return placement === "line" ? <DesktopWalk reduce={reduce} wide={wide} /> : <MobileWave reduce={reduce} />;
}
