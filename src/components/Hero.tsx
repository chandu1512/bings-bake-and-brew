import Image from "next/image";
import Link from "next/link";
import HeroVideo from "./HeroVideo";
import HeroDepth from "./HeroDepth";
import HeroScrollCue from "./HeroScrollCue";
import { ArrowRight } from "./icons";

/**
 * Home page hero: logo, "Since 1871", the selected shop's looping video in the
 * middle (where the 3D scene used to sit), one line, and Order pickup.
 * Normal scrolling: nothing here is pinned or scroll-driven.
 */
export default function Hero() {
  return (
    // isolate + a cream base so the beans layer's multiply blend only sees the hero.
    <section data-hero data-keep-type className="hero-screen relative isolate overflow-hidden bg-porcelain pb-14 pt-[92px] md:pt-[108px]">
      <HeroDepth layer="back" />
      <div className="shell flex flex-col items-center text-center">
        <h1 className="relative z-10 m-0">
          <Image
            src="/brand/logo-color.png"
            alt="Bing's Bake & Brew"
            width={282}
            height={143}
            priority
            className="h-auto w-[210px] sm:w-[250px] lg:w-[282px]"
          />
        </h1>

        {/* TODO(owner): confirm "Since 1871" with Carla (Fader's Bakery, the founding year per bingsbakery.com). */}
        <p className="ornament relative z-10 mt-1 w-full max-w-[420px] !text-gold">
          <span className="script foil-text px-1 text-[1.7rem] lg:text-[2.1rem]">Since 1871</span>
        </p>

        <div className="hero-video-fit relative z-[1] -mx-5 -mt-2 w-[calc(100%+40px)] max-w-[820px]">
          {/* Soft warm light behind the clip. */}
          <div aria-hidden className="absolute inset-[-12%]" style={{ background: "radial-gradient(ellipse 42% 44% at 50% 50%, rgba(255, 236, 200, 0.7), rgba(255, 236, 200, 0) 72%)" }} />
          <HeroVideo className="aspect-video w-full" />
          {/* Soft contact shadow under the cup or croissant. */}
          <div aria-hidden className="absolute bottom-[9%] left-1/2 h-[9%] w-[44%] -translate-x-1/2" style={{ background: "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(74, 46, 28, 0.16), rgba(74, 46, 28, 0) 100%)" }} />
        </div>

        <p className="font-display relative z-10 -mt-3 max-w-[20ch] text-[clamp(1.6rem,2.9vw,2.5rem)] leading-[1.04]">
          Coffee and Bing&rsquo;s pastries, <em className="font-normal italic text-gold-deep">on two Main Streets.</em>
        </p>

        <div className="relative z-10 mt-7 flex justify-center">
          <Link href="/order" className="btn btn-cherry !px-6">
            Order pickup <ArrowRight className="nudge" />
          </Link>
        </div>
      </div>
      <HeroDepth layer="front" />
      <HeroScrollCue />
    </section>
  );
}
