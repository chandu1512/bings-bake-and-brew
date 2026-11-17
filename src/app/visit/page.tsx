import type { Metadata } from "next";
import { TOWNS, pageMeta } from "@/lib/seo";
import Image from "next/image";
import ShopCards from "@/components/ShopCards";
import { STAND_INS, STORE_IDS, STORES } from "@/lib/site";
import { hoursSummary } from "@/lib/hours";

export const metadata: Metadata = pageMeta({
  title: `Hours and Directions | ${TOWNS}`,
  description: `Hours, addresses, phone numbers and Google Maps directions for Bing's Bake & Brew in ${TOWNS}.`,
  path: "/visit",
});

export default function VisitPage() {
  return (
    <>
      <section className="shell pb-20 pt-[120px] md:pt-[150px] lg:pb-28">
        <div className="mb-12 grid gap-6 lg:grid-cols-12 lg:items-end">
          <h1 className="display-xl lg:col-span-7">Find us on Main Street. Either one.</h1>
          <ul className="lede space-y-1 lg:col-span-5">
            {STORE_IDS.map((id) => (
              <li key={id}>
                <strong className="font-semibold text-ink">{STORES[id].name}:</strong> {hoursSummary(STORES[id])}
              </li>
            ))}
          </ul>
        </div>
        <ShopCards full />
      </section>

      <section aria-label="The bakery case" className="relative h-[52svh] min-h-[340px] overflow-hidden">
        <Image
          src={STAND_INS.bakeryCase.src}
          alt={STAND_INS.bakeryCase.alt}
          fill
          sizes="100vw"
          className="kenburns object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso/85 via-espresso/20 to-transparent" />
        <p className="shell absolute inset-x-0 bottom-10 font-display text-[clamp(1.9rem,4.4vw,3.4rem)] leading-none text-white">
          The case is filled from Bing&rsquo;s Bakery.
        </p>
      </section>
    </>
  );
}
