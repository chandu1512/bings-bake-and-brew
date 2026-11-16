import type { Metadata } from "next";
import { TOWNS } from "@/lib/seo";
import MenuBoard from "@/components/MenuBoard";

export const metadata: Metadata = {
  title: "Menu | Coffee, Pastries and Cakes",
  description: `Espresso, iced and frozen drinks, Bing's Bakery pastries and breakfast bagels with prices for both shops in ${TOWNS}.`,
  alternates: { canonical: "/menu" },
  openGraph: { title: "Menu | Coffee, Pastries and Cakes", description: `Espresso, iced and frozen drinks, Bing's Bakery pastries and breakfast bagels with prices for both shops in ${TOWNS}.`, url: "/menu" },
  twitter: { title: "Menu | Coffee, Pastries and Cakes", description: `Espresso, iced and frozen drinks, Bing's Bakery pastries and breakfast bagels with prices for both shops in ${TOWNS}.` },
};

export default function MenuPage() {
  return (
    <div className="shell pb-24 pt-[120px] md:pt-[150px]">
      <MenuBoard mode="all" heading="h1" />
      <p className="mt-14 max-w-[62ch] text-ink-soft">
        Hot drinks are priced at the medium size and cold drinks at the large. &ldquo;Ask at counter&rdquo; means the
        price isn&rsquo;t posted yet. The bakery case changes with the day&rsquo;s bake.
      </p>
    </div>
  );
}
