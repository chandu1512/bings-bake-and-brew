"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { FilmStrip } from "./FilmCard";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Facts from bingsbakery.com. Keep these to what the bakery itself states. */
const CHAPTERS = [
  {
    year: "1871",
    title: "Fader’s Bakery",
    text: "Gotleib Fader opens Fader’s Bakery and takes the bread round by horse-drawn wagon.",
  },
  {
    year: "1946",
    title: "The Bings",
    text: "Russell and Selena Bing buy the bakery and put their own name over the door.",
  },
  {
    year: "2005",
    title: "The Guzzis",
    text: "Head baker Tom Guzzi and his wife Carla buy Bing’s and keep the ovens going.",
  },
  {
    year: "Today",
    title: "Bake & Brew",
    text: "Since 2019–20 the bakery has had a coffee bar. The pastry case is filled from Bing’s Bakery, now Delaware’s longest-running.",
  },
];

const ACCOLADES =
  "Along the way, Mashed ranked Bing’s the No. 1 bakery in Delaware, Eat This named its chocolate cake the best in the state, and the Cake Boss came by in 2014. The carrot cake has a following of its own.";

/** The pastry case today: the shops' own photographs. */
const CASE = [
  { src: "/photos/elkton/baked-goods--crumb-cake.jpg", alt: "Bing's crumb cake", caption: "Crumb cake" },
  { src: "/photos/elkton/baked-goods--carrot-squares.jpg", alt: "Carrot squares", caption: "Carrot squares" },
  { src: "/photos/amstel/handmade-desserts--croissants.jpg", alt: "Croissants", caption: "Croissants" },
  { src: "/photos/elkton/baked-goods--raspberry-strip.jpg", alt: "Raspberry strip", caption: "Raspberry strip" },
  { src: "/photos/elkton/baked-goods--iced-cinnamon-buns.jpg", alt: "Iced cinnamon buns", caption: "Cinnamon buns" },
  { src: "/photos/amstel/handmade-desserts--gourmet-cookies.jpg", alt: "Gourmet cookies", caption: "Gourmet cookies" },
  { src: "/photos/elkton/baked-goods--tiramisu.jpg", alt: "Tiramisu", caption: "Tiramisu" },
  { src: "/photos/elkton/baked-goods--brownies.jpg", alt: "Brownies", caption: "Brownies" },
];

// Rounded so the server and the browser print the same numbers.
const r = (n: number) => Math.round(n * 100) / 100;

function Wheel({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none" stroke="currentColor">
      <circle cx="32" cy="32" r="28" strokeWidth="4" />
      <circle cx="32" cy="32" r="5" strokeWidth="4" />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5;
        return (
          <line
            key={i}
            x1={r(32 + Math.cos(a) * 6)}
            y1={r(32 + Math.sin(a) * 6)}
            x2={r(32 + Math.cos(a) * 27)}
            y2={r(32 + Math.sin(a) * 27)}
            strokeWidth="2.4"
          />
        );
      })}
    </svg>
  );
}

/**
 * The 150-year story. On a wide screen the section pins and the scroll drives
 * it: the year changes, the wagon wheel rolls along the rail. On phones and
 * with reduced motion it is a plain stacked timeline.
 */
export default function Heritage() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const pin = el.querySelector<HTMLElement>("[data-pin]")!;
      const years = gsap.utils.toArray<HTMLElement>("[data-year]", el);
      const texts = gsap.utils.toArray<HTMLElement>("[data-text]", el);
      const ticks = gsap.utils.toArray<HTMLElement>("[data-tick]", el);
      const rail = el.querySelector<HTMLElement>("[data-rail]")!;
      const wheel = el.querySelector<HTMLElement>("[data-wheel]")!;
      const fill = el.querySelector<HTMLElement>("[data-fill]")!;

      gsap.set([...years.slice(1), ...texts.slice(1)], { autoAlpha: 0 });
      gsap.set(years.slice(1), { yPercent: 40 });
      gsap.set(texts.slice(1), { y: 30 });
      gsap.set(ticks.slice(1), { opacity: 0.4 });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut", duration: 0.5 },
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: "+=2600",
          pin: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });

      tl.to(wheel, { x: () => rail.offsetWidth - wheel.offsetWidth, rotation: 900, ease: "none", duration: 3 }, 0)
        .to(fill, { scaleX: 1, ease: "none", duration: 3 }, 0);

      for (let i = 1; i < CHAPTERS.length; i++) {
        const at = i - 0.5;
        // The old chapter leaves before the new one arrives, so the two never overlap.
        tl.to([years[i - 1], texts[i - 1]], { autoAlpha: 0, duration: 0.22, ease: "power2.in" }, at)
          .to(years[i - 1], { yPercent: -25, duration: 0.22, ease: "power2.in" }, at)
          .to(years[i], { autoAlpha: 1, yPercent: 0, duration: 0.34, ease: "power3.out" }, at + 0.22)
          .to(texts[i], { autoAlpha: 1, y: 0, duration: 0.34, ease: "power3.out" }, at + 0.27)
          .to(ticks[i], { opacity: 1, duration: 0.2 }, at + 0.3);
      }
      tl.to({}, { duration: 0.35 });
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={root} aria-labelledby="story-h" className="hero-band relative overflow-hidden text-white">
      {/* Wide screens: pinned, scroll-driven */}
      <div data-pin className="relative hidden h-[100svh] min-h-[640px] flex-col overflow-hidden pt-[104px] lg:motion-safe:flex">
        <div aria-hidden className="absolute inset-y-0 right-0 w-[58%] [mask-image:linear-gradient(90deg,transparent,#000_55%)]">
          <Image src="/photos/elkton/baked-goods--crumb-cake.jpg" alt="" fill sizes="60vw" className="film-grade object-cover opacity-40" />
        </div>
        <div className="shell relative flex flex-1 flex-col">
          <h2 id="story-h" className="display-md max-w-[22ch] text-white/90">
            The bakery behind the coffee bar.
          </h2>

          <div className="grid flex-1 grid-cols-12 items-center gap-10">
            <div className="relative col-span-7 h-[clamp(11rem,26vw,22rem)]">
              {CHAPTERS.map((c) => (
                <p
                  key={c.year}
                  data-year
                  aria-hidden
                  className="tnum absolute inset-0 flex items-center font-display text-[clamp(9rem,21vw,19rem)] leading-none text-butter"
                >
                  {c.year}
                </p>
              ))}
            </div>
            <div className="relative col-span-5 h-56">
              {CHAPTERS.map((c) => (
                <div key={c.year} data-text className="absolute inset-0 flex flex-col justify-center">
                  <h3 className="font-display text-[2.3rem] font-normal leading-none">{c.title}</h3>
                  <p className="mt-4 max-w-[34ch] text-[1.2rem] leading-relaxed text-white/75">{c.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pb-12">
            <div data-rail className="relative h-11">
              <div className="absolute inset-x-0 bottom-0 h-px bg-white/20" />
              <div data-fill className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-butter" />
              <div data-wheel className="absolute bottom-0 left-0 h-11 w-11 text-butter">
                <Wheel className="h-full w-full" />
              </div>
            </div>
            <ol className="mt-3 grid grid-cols-4 text-sm font-semibold text-white/80">
              {CHAPTERS.map((c, i) => (
                <li
                  key={c.year}
                  data-tick
                  className={i === 0 ? "text-left" : i === CHAPTERS.length - 1 ? "text-right" : i === 1 ? "pl-[16%]" : "pr-[16%] text-right"}
                >
                  {c.year}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Phones, tablets and reduced motion: a plain timeline */}
      <div className="shell py-20 lg:motion-safe:hidden">
        <h2 className="display-lg max-w-[14ch]">The bakery behind the coffee bar.</h2>
        <ol className="mt-12 space-y-12 border-l border-white/15 pl-6">
          {CHAPTERS.map((c) => (
            <li key={c.year} className="relative">
              <span aria-hidden className="absolute -left-[31px] top-4 h-3 w-3 rounded-full bg-butter" />
              <p className="tnum font-display text-[4.2rem] leading-none text-butter">{c.year}</p>
              <h3 className="mt-3 font-display text-[1.7rem] font-normal">{c.title}</h3>
              <p className="mt-2 max-w-[38ch] text-[1.05rem] leading-relaxed text-white/75">{c.text}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="shell relative pb-6 lg:pt-4">
        <p className="max-w-[58ch] text-[1.15rem] leading-relaxed text-white/80 lg:text-[1.3rem]">{ACCOLADES}</p>
        <p className="ornament mt-12 !text-gold">
          <span className="script foil-text px-1 text-[1.9rem]">From Bing&rsquo;s ovens</span>
        </p>
      </div>
      <FilmStrip items={CASE} className="relative pb-16 lg:pb-20" />
    </section>
  );
}
