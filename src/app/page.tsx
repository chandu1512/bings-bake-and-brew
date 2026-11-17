import type { Metadata } from "next";
import { SHOP_NAME } from "@/lib/site";
import { TOWNS, pageMeta } from "@/lib/seo";
import Hero from "@/components/Hero";
import Heritage from "@/components/Heritage";
import Awards from "@/components/Awards";
import ShopCards from "@/components/ShopCards";

export const metadata: Metadata = pageMeta({
  title: `${SHOP_NAME} | Coffee Shop and Bakery in ${TOWNS}`,
  description: `Coffee, espresso and Bing's Bakery pastries, baked since 1871, at two shops in ${TOWNS}. See each shop's menu, prices and hours, and order pickup online.`,
  path: "/",
  absolute: true,
});

/** Home: hero with the selected shop's video, then the bakery's history, awards, and both shops. Menu, gift cards and visit details have their own pages. */
export default function HomePage() {
  return (
    <>
      <Hero />

      <Heritage />

      <Awards />

      <section aria-labelledby="shops-h" className="shell py-20 md:py-28">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="shops-h" className="display-lg max-w-[13ch]">Two shops, both on Main Street.</h2>
          <p className="lede">South Main in Newark, West Main in Elkton. Each has its own hours, so check before you set off.</p>
        </div>
        <ShopCards />
      </section>
    </>
  );
}
