"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.23, 1, 0.32, 1] as const;

/** Badges as shown on the previous bingsbakeandbrew.com (Bing's Bake & Brew's own awards). */
const BADGES = [
  {
    src: "/awards/dsbc-2021-judges-choice.png",
    w: 250,
    h: 224,
    title: "Blue Ribbon Award",
    detail: "Judge’s Choice · 2021",
    by: "Delaware Small Business Chamber",
  },
  {
    src: "/awards/dsbc-2022-voters-choice.png",
    w: 520,
    h: 467,
    title: "Blue Ribbon Award",
    detail: "Voter’s Choice · 2022",
    by: "Delaware Small Business Chamber",
  },
  {
    src: "/awards/newark-post-2021-reader-approved.png",
    w: 520,
    h: 487,
    title: "Reader Approved",
    detail: "New Castle County · 2021",
    by: "Newark Post",
  },
];

/** Recognition for the parent bakery, Bing's Bakery (bingsbakery.com and press coverage). */
const PRESS = [
  { quote: "No. 1 bakery in Delaware", source: "Mashed" },
  { quote: "Best chocolate cake in Delaware", source: "Eat This, Not That!" },
  { quote: "One of the 75 best bakeries in America", source: "Bing’s Bakery press" },
  { quote: "A visit from the Cake Boss", source: "2014" },
];

export default function Awards() {
  const reduce = useReducedMotion();
  const rise = (i: number) => ({
    // Opacity and movement only: animating blur is expensive and can stutter while scrolling.
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.7, ease: EASE, delay: i * 0.1 },
  });

  return (
    <section aria-labelledby="awards-h" className="hero-band relative overflow-hidden py-20 text-white md:py-28">
      <div className="shell relative">
        <motion.div {...rise(0)} className="mx-auto max-w-2xl text-center">
          <p className="script foil-text text-[1.8rem] md:text-[2.2rem]">Award winning</p>
          <h2 id="awards-h" className="mt-2 font-display text-[clamp(2.1rem,4.4vw,3.6rem)] leading-[1.05]">
            Delaware keeps <em className="text-gold">voting for us.</em>
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-white/70">
            Ribbons for the coffee bar, and a century and a half of recognition for the bakery behind it.
          </p>
        </motion.div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-3 md:mt-16 md:gap-8">
          {BADGES.map((b, i) => (
            <motion.li key={b.src} {...rise(i + 1)} className="flex flex-col items-center text-center">
              <div className={reduce ? "" : "floaty"} style={{ animationDelay: `${-i * 1.7}s` }}>
                <div className="relative grid h-44 w-44 place-items-center rounded-full bg-porcelain-light shadow-[0_0_0_1px_rgba(201,161,90,0.7),0_0_0_7px_rgba(201,161,90,0.12),0_30px_60px_-24px_rgba(0,0,0,0.85)] md:h-52 md:w-52">
                  <Image src={b.src} alt={`${b.title}, ${b.detail}, ${b.by}`} width={b.w} height={b.h} className="h-auto w-[78%]" sizes="200px" />
                </div>
              </div>
              <h3 className="mt-6 font-display text-[1.45rem]">{b.title}</h3>
              <p className="text-gold">{b.detail}</p>
              <p className="mt-0.5 text-[0.9rem] text-white/60">{b.by}</p>
            </motion.li>
          ))}
        </ul>

        <motion.div {...rise(4)} className="mt-16 border-t border-gold/25 pt-10 md:mt-20">
          <p className="text-center text-[0.8rem] font-semibold uppercase tracking-[0.22em] text-gold/80">
            And for Bing’s Bakery, since 1871
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PRESS.map((p) => (
              <li key={p.quote} className="rounded-2xl border border-gold/25 bg-white/[0.03] px-5 py-4 text-center">
                <p className="font-display text-[1.15rem] leading-snug">“{p.quote}”</p>
                <p className="mt-1 text-[0.85rem] text-white/55">{p.source}</p>
              </li>
            ))}
          </ul>
          <p className="mt-10 flex items-center justify-center gap-3 text-[0.9rem] text-white/60">
            <Image src="/awards/crimson-cup.jpg" alt="Crimson Cup" width={126} height={168} className="h-9 w-auto rounded" />
            Proudly brewing award-winning Crimson Cup coffee
          </p>
        </motion.div>
      </div>
    </section>
  );
}
