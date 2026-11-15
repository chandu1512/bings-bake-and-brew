import type { Metadata } from "next";
import MenuBoard from "@/components/MenuBoard";

export const metadata: Metadata = {
  title: "Menu and prices",
  description:
    "The full Bing's Bake & Brew menu with photos and prices for Amstel Square and Elkton: espresso, iced and frozen drinks, teas, the bakery case and bagels.",
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
