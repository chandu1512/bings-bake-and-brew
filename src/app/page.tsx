import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import MenuBoard from "@/components/MenuBoard";
import Heritage from "@/components/Heritage";
import Regulars from "@/components/Regulars";
import ShopCards from "@/components/ShopCards";
import GiftCard from "@/components/GiftCard";
import { ArrowRight, ArrowUpRight } from "@/components/icons";
import { GIFT_CARD_URL, STAND_INS } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <Hero />

      {/* New on the bar and in the case */}
      <section aria-labelledby="new-h" className="shell pb-6 pt-6 md:pt-10">
        <h2 id="new-h" className="sr-only">New this season</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <article className="zoom-frame gloss relative flex min-h-[340px] items-end overflow-hidden rounded-[28px] bg-espresso p-7 text-white md:min-h-[420px] md:p-9">
            <Image
              src="https://images.unsplash.com/photo-1515442261605-65987783cb6a?auto=format&fit=crop&w=1200&h=900&q=72"
              alt="A mocha being dusted with chocolate"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="zoom object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/45 to-transparent" />
            <div className="relative">
              <span className="rounded-full bg-cherry px-3 py-1 text-[0.78rem] font-bold">New</span>
              <h3 className="mt-3 font-display text-[2.3rem] font-normal leading-none md:text-[3rem]">Blackberry Mocha</h3>
              <p className="mt-3 max-w-[34ch] text-white/85">
                The newest drink on the espresso bar. Ask for it at either shop.
              </p>
            </div>
          </article>
          <article className="zoom-frame gloss relative flex min-h-[340px] items-end overflow-hidden rounded-[28px] bg-espresso p-7 text-white md:min-h-[420px] md:p-9">
            <Image
              src="/photos/elkton/baked-goods--crumb-cake.jpg"
              alt="A square of Bing's crumb cake"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="zoom object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/40 to-transparent" />
            <div className="relative">
              <span className="rounded-full bg-white px-3 py-1 text-[0.78rem] font-bold text-ink">Most loved</span>
              <h3 className="mt-3 font-display text-[2.3rem] font-normal leading-none md:text-[3rem]">Crumb cake</h3>
              <p className="mt-3 max-w-[34ch] text-white/85">Moist cake under a thick homemade crumb. $4.95 at both shops.</p>
            </div>
          </article>
        </div>
      </section>

      <div className="ornament shell pt-12 md:pt-16" aria-hidden>
        <span className="ornament-mark" />
      </div>

      <section id="menu" className="shell scroll-mt-24 py-16 md:py-24">
        <MenuBoard mode="tabs" />
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/menu" className="btn btn-ink">
            See the full menu <ArrowRight className="nudge" />
          </Link>
        </div>
      </section>

      <Heritage />

      <Regulars />

      <div className="ornament shell pt-12 md:pt-16" aria-hidden>
        <span className="ornament-mark" />
      </div>

      <section aria-labelledby="shops-h" className="shell pb-20 md:pb-28">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="shops-h" className="display-lg max-w-[13ch]">Two shops, both on Main Street.</h2>
          <p className="lede">South Main in Newark, West Main in Elkton. Each has its own hours, so check before you set off.</p>
        </div>
        <ShopCards />
      </section>

      <section aria-labelledby="gift-h" className="bg-porcelain-deep">
        <div className="shell grid items-center gap-12 py-20 md:grid-cols-2 md:py-28">
          <div>
            <h2 id="gift-h" className="display-lg max-w-[12ch]">Give someone their morning coffee.</h2>
            <p className="lede mt-5">
              Bing&rsquo;s Bake &amp; Brew gift cards are sold through Toast. Pick an amount, pay there, and it&rsquo;s
              sent.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={GIFT_CARD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-cherry">
                Buy a gift card <ArrowUpRight className="nudge" />
              </a>
              <Link href="/gift-cards" className="btn btn-glass">
                How gift cards work
              </Link>
            </div>
          </div>
          <GiftCard className="mx-auto w-full max-w-[480px]" />
        </div>
      </section>
    </>
  );
}
