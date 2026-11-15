"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import FilmCard from "./FilmCard";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Themes that come up again and again in public reviews. Not quotes. */
const THEMES = ["Friendly staff.", "Fast service.", "Good music.", "The crumb cake.", "The espresso drinks."];

export default function Regulars() {
  const root = useRef<HTMLDivElement>(null);

  // The phrases light up one after another as the section scrolls through.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const words = gsap.utils.toArray<HTMLElement>("[data-word]", el);
      gsap.fromTo(
        words,
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.5,
          scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 62%", scrub: 0.4 },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <section aria-labelledby="regulars-h" className="shell grid items-center gap-12 py-20 md:py-28 lg:grid-cols-12">
      <div className="lg:col-span-7">
      <h2 id="regulars-h" className="max-w-[30ch] text-[1.15rem] font-sans font-semibold leading-snug tracking-normal text-ink-soft">
        What people mention most in reviews of the two shops
      </h2>
      <div ref={root} className="mt-6 flex flex-wrap gap-x-[0.4em] gap-y-1 font-display text-[clamp(2.3rem,5.2vw,4.6rem)] leading-[1.02]">
        {THEMES.map((t, i) => (
          <span key={t} data-word className={i === 3 ? "text-cherry" : ""}>
            {t}
          </span>
        ))}
      </div>
      <p className="tnum mt-8 max-w-[62ch] text-ink-soft">
        Amstel Square holds 4.7 on DoorDash across 500+ ratings and 4.6 on Restaurant Guru from 222. Elkton, open since
        2025, sits at 5.0 on Toast from its first 11.
      </p>
      </div>
      <div className="relative mx-auto h-[340px] w-full max-w-[420px] lg:col-span-5 lg:h-[460px]">
        <FilmCard src="/photos/elkton/baked-goods--crumb-cake.jpg" alt="A square of Bing's crumb cake" caption="The crumb cake" sizes="280px" className="absolute left-0 top-0 w-[58%] -rotate-[5deg]" />
        <FilmCard src="/photos/amstel/hot-drinks--bing-s-mocha.jpg" alt="A Bing's Mocha from Amstel Square" caption="Bing’s Mocha" sizes="240px" ratio="aspect-square" className="absolute bottom-0 right-0 w-[52%] rotate-[4deg]" />
        <FilmCard src="/photos/elkton/savory--bacon-egg-cheese-on-everything-bagel.jpg" alt="Bacon, egg and cheese on an everything bagel" sizes="180px" ratio="aspect-square" className="absolute right-[6%] top-[4%] w-[36%] rotate-[8deg]" />
      </div>
    </section>
  );
}
