import Image from "next/image";
import ChefWalk from "./ChefWalk";

/** Facts from bingsbakery.com. Keep these to what the bakery itself states. */
const CHAPTERS = [
  {
    year: "1871",
    title: "Fader’s Bakery",
    // TODO(owner): confirm the spelling "Gotleib" with Carla (could be "Gottlieb"). Left as the bakery's site has it.
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

const HEADING = "The bakery behind the coffee bar.";

/**
 * The 150-year story as a plain timeline: a vertical list on phones, four
 * columns on wide screens. It scrolls with the page; nothing is pinned.
 */
export default function Heritage() {
  return (
    <section aria-labelledby="story-h" data-keep-type className="hero-band relative overflow-hidden text-white">
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[52%] [mask-image:linear-gradient(90deg,transparent,#000_60%)] lg:block">
        <Image src="/photos/elkton/baked-goods--crumb-cake.jpg" alt="A square of Bing's crumb cake" fill sizes="52vw" className="film-grade object-cover opacity-30" />
      </div>

      <div className="shell relative py-20 lg:py-28">
        <h2 id="story-h" className="display-lg max-w-[16ch]">{HEADING}</h2>

        {/* The wrapper's top edge is the timeline line on wide screens; the baker stands on it. */}
        <div className="relative mt-12 lg:mt-[200px]">
        <ChefWalk placement="line" />
        <ol className="space-y-12 border-l border-white/15 pl-6 lg:grid lg:grid-cols-4 lg:gap-10 lg:space-y-0 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-10">
          {CHAPTERS.map((c) => (
            <li key={c.year} data-stop className="relative">
              <span aria-hidden data-dot className="timeline-dot absolute -left-[31px] top-4 h-3 w-3 rounded-full bg-butter lg:-top-[46px] lg:left-0" />
              <p className="timeline-year tnum font-display text-[4.2rem] leading-none text-butter lg:text-[4.6rem]">{c.year}</p>
              <h3 className="mt-3 font-display text-[1.7rem] font-normal">{c.title}</h3>
              <p className="mt-2 max-w-[38ch] text-[1.05rem] leading-relaxed text-white/75">{c.text}</p>
            </li>
          ))}
        </ol>
        </div>
        <ChefWalk placement="after" />

        <p className="mt-14 max-w-[58ch] text-[1.15rem] leading-relaxed text-white/80 lg:text-[1.3rem]">{ACCOLADES}</p>
      </div>
    </section>
  );
}
