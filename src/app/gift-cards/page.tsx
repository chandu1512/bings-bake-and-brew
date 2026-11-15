import type { Metadata } from "next";
import Image from "next/image";
import GiftCard from "@/components/GiftCard";
import { ArrowUpRight, Lock } from "@/components/icons";
import { GIFT_CARD_URL, STORES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gift cards",
  description: "Buy a Bing's Bake & Brew gift card online through Toast.",
};

export default function GiftCardsPage() {
  return (
    <>
      <section className="shell grid items-center gap-12 pb-20 pt-[120px] md:pt-[150px] lg:grid-cols-2 lg:gap-16 lg:pb-28">
        <div>
          <h1 className="display-xl max-w-[11ch]">A gift card for the coffee run.</h1>
          <p className="lede mt-6">
            Good for a round of lattes, a box from the bakery case, or a regular who never says no to crumb cake.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={GIFT_CARD_URL} target="_blank" rel="noopener noreferrer" className="btn btn-cherry">
              Buy a gift card <ArrowUpRight className="nudge" />
            </a>
          </div>
          <p className="mt-4 flex max-w-[46ch] gap-2 text-[0.95rem] text-ink-soft">
            <Lock className="mt-0.5 shrink-0" />
            <span>Gift cards are sold and paid for on Toast. You choose the amount there.</span>
          </p>
        </div>
        <GiftCard className="mx-auto w-full max-w-[560px]" />
      </section>

      <section aria-labelledby="how-h" className="bg-porcelain-deep">
        <div className="shell grid gap-12 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="zoom-frame gloss relative aspect-[4/3] overflow-hidden rounded-[28px]">
            <Image
              src={STORES.amstel.photoAlt2.src}
              alt={STORES.amstel.photoAlt2.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="zoom object-cover"
            />
          </div>
          <div>
            <h2 id="how-h" className="display-lg">How it works</h2>
            <ol className="mt-8">
              {[
                ["Open the Toast gift card page", "The button above takes you there."],
                ["Choose an amount and who it’s for", "Toast walks you through it."],
                ["Pay on Toast", "Toast handles the payment and the delivery of the card."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-5 border-t border-ink/15 py-5 last:border-b">
                  <span className="tnum font-display text-[2rem] leading-none text-cherry">{i + 1}</span>
                  <div>
                    <h3 className="text-[1.1rem]">{t}</h3>
                    <p className="mt-1 text-ink-soft">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-ink-soft">
              Questions about a card or a balance? Ask at the counter{STORES.amstel.phone ? `, or call Amstel Square on ${STORES.amstel.phone}` : ""}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
