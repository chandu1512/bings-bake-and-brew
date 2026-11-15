"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { addressLines, directionsUrl } from "@/lib/site";
import { useStore } from "./providers";
import StoreToggle from "./StoreToggle";
import OpenBadge from "./OpenBadge";
import FilmCard from "./FilmCard";
import { ArrowRight, Pin } from "./icons";
import type { HeroMotion } from "./three/HeroScene";

const HeroScene = dynamic(() => import("./three/HeroScene"), { ssr: false });

const EASE = [0.23, 1, 0.32, 1] as const;

/** Real-time 3D only where it will run well; everyone else gets the still prints. */
function canRender3D() {
  try {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) return false;
    if ((nav.hardwareConcurrency ?? 8) <= 2) return false;
    if ((nav.deviceMemory ?? 8) <= 2) return false;
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Still fallback (reduced motion, low-power devices): the shops' own photos as film prints. */
const STILLS = {
  amstel: [
    { src: "/photos/amstel/iced-drinks--bing-s-mocha-iced.jpg", caption: "Bing’s Mocha, iced" },
    { src: "/photos/amstel/handmade-desserts--muffins.jpg", caption: "Muffins" },
  ],
  elkton: [
    { src: "/photos/elkton/espresso--cafe-latte.jpg", caption: "Café latte" },
    { src: "/photos/elkton/baked-goods--crumb-cake.jpg", caption: "Crumb cake" },
  ],
} as const;

function StillPair({ wide, shop }: { wide: boolean; shop: "amstel" | "elkton" }) {
  const [a, b] = STILLS[shop];
  return (
    <div className="absolute inset-0">
      <FilmCard src={a.src} alt="" caption={a.caption} className={`absolute -rotate-[5deg] ${wide ? "left-[4.5%] top-[25%] w-[clamp(200px,20.5vw,310px)]" : "left-[6%] top-[4%] w-[37%]"}`} />
      <FilmCard src={b.src} alt="" caption={b.caption} className={`absolute rotate-[4deg] ${wide ? "right-[4.5%] top-[21%] w-[clamp(190px,19.5vw,296px)]" : "right-[6%] top-[0%] w-[35%]"}`} />
    </div>
  );
}

export default function Hero() {
  const { id, store } = useStore();
  const reduce = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HeroMotion>({ px: 0, py: 0, scroll: 0 });
  const [wide, setWide] = useState<boolean | null>(null);
  const [three, setThree] = useState(false);
  const [l1, l2] = addressLines(store);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => setThree(!reduce && canRender3D()), [reduce]);

  // Pointer tilt and scroll drift feed the 3D scene; the copy moves a touch slower than the page.
  useEffect(() => {
    if (reduce || !section.current) return;
    gsap.registerPlugin(ScrollTrigger);
    const m = motionRef.current;
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      m.px = (e.clientX / window.innerWidth) * 2 - 1;
      m.py = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", move, { passive: true });
    const ctx = gsap.context(() => {
      const st = { trigger: section.current, start: "top top", end: "bottom top", scrub: true };
      ScrollTrigger.create({ ...st, onUpdate: (self) => { m.scroll = self.progress; } });
      gsap.to(content.current, { yPercent: 7, ease: "none", scrollTrigger: st });
    });
    return () => {
      window.removeEventListener("pointermove", move);
      ctx.revert();
    };
  }, [reduce]);

  const visual = (isWide: boolean) =>
    wide === isWide ? (
      three ? <HeroScene motion={motionRef} mode={isWide ? "wide" : "strip"} shop={id} /> : <StillPair wide={isWide} shop={id} />
    ) : null;

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE, delay },
        };

  return (
    <section
      ref={section}
      data-hero
      className="hero-band relative isolate mb-8 overflow-hidden rounded-b-[32px] bg-espresso text-white md:mb-12 md:rounded-b-[52px]"
    >
      <div aria-hidden className="light-leak pointer-events-none absolute inset-0 -z-10" />

      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        {visual(true)}
      </div>

      <div
        ref={content}
        className="shell relative flex flex-col items-center pb-12 pt-[92px] text-center md:pt-[112px] lg:min-h-[max(100svh,800px)] lg:justify-center lg:pb-20"
      >
        <motion.h1 {...rise(0)} className="m-0">
          <Image
            src="/brand/bings-bake-n-brew-coffee-logo-306-269.png"
            alt="Bing's Bake & Brew"
            width={306}
            height={269}
            priority
            className="h-auto w-[176px] drop-shadow-[0_18px_40px_rgba(0,0,0,0.7)] sm:w-[230px] lg:w-[306px]"
          />
        </motion.h1>

        <motion.p {...rise(0.05)} className="ornament mt-1 w-full max-w-[420px] !text-gold lg:mt-2">
          <span className="script foil-text px-1 text-[1.7rem] lg:text-[2.2rem]">Since 1871</span>
        </motion.p>

        <div aria-hidden className="pointer-events-none relative -mx-5 mt-1 h-[220px] w-[calc(100%+40px)] [mask-image:linear-gradient(to_bottom,transparent,#000_16%,#000_84%,transparent)] sm:h-[260px] lg:hidden">
          {visual(false)}
        </div>

        <motion.p {...rise(0.08)} className="font-display mt-2 max-w-[20ch] text-[clamp(1.6rem,2.9vw,2.5rem)] leading-[1.04] [text-shadow:0_2px_24px_rgba(0,0,0,0.6)] lg:mt-5">
          Coffee and Bing&rsquo;s pastries, <em className="font-normal italic text-gold-light">on two Main Streets.</em>
        </motion.p>
        <motion.p {...rise(0.12)} className="mt-3 hidden max-w-[46ch] text-[1.05rem] leading-relaxed text-white/80 sm:block">
          The coffee bar of Bing&rsquo;s Bakery, Delaware&rsquo;s longest-running bakery, est. 1871. Pick your shop for its menu,
          hours and pickup.
        </motion.p>

        <motion.div {...rise(0.16)} className="mt-5 w-full max-w-[440px] rounded-full backdrop-blur-md lg:mt-7">
          <StoreToggle id="hero" tone="dark" />
        </motion.div>

        <motion.div {...rise(0.2)} className="mt-4 flex min-h-[64px] flex-col items-center">
          <OpenBadge store={store} tone="dark" className="text-[1.05rem]" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={id}
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.12 } }}
              transition={{ duration: 0.28, ease: EASE }}
              className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-white/85"
            >
              <Pin size={16} className="shrink-0" />
              <span>
                {l1}, {l2}
              </span>
              <a href={directionsUrl(store)} target="_blank" rel="noopener noreferrer" className="link-under py-1 text-white">
                Get directions
              </a>
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <motion.div {...rise(0.25)} className="mt-5 grid w-full max-w-[440px] grid-cols-2 gap-3 sm:flex sm:w-auto sm:max-w-none">
          <Link href="/order" className="btn btn-cherry !px-4 sm:!px-6">
            Order pickup <ArrowRight className="nudge" />
          </Link>
          <a href="#menu" className="btn btn-glass !px-4 sm:!px-6">
            See the menu
          </a>
        </motion.div>
      </div>
    </section>
  );
}
