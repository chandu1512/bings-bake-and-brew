import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import MenuBoard from "@/components/MenuBoard";
import { SHOP_NAME, STORE_IDS, STORES, isStoreId } from "@/lib/site";

type Params = { params: Promise<{ store: string }> };

export function generateStaticParams() {
  return STORE_IDS.map((store) => ({ store }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { store } = await params;
  if (!isStoreId(store)) return {};
  const s = STORES[store];
  // "Amstel Square, Newark, DE" / "Elkton, MD" (the town already says Elkton).
  const where = s.name === s.city ? s.town : `${s.name}, ${s.town}`;
  const title = `Menu | ${SHOP_NAME} ${where}`;
  const description = `Espresso, iced and frozen drinks, Bing's Bakery pastries and breakfast with prices at Bing's Bake & Brew ${s.name}, ${s.town}.`;
  return pageMeta({ title, description, path: `/menu/${store}`, absolute: true });
}

export default async function StoreMenuPage({ params }: Params) {
  const { store } = await params;
  if (!isStoreId(store)) notFound();
  return (
    <div className="shell pb-24 pt-[120px] md:pt-[150px]">
      <MenuBoard mode="all" heading="h1" storeId={store} />
      <p className="subtitle mx-auto mt-14 max-w-[62ch] text-center">
        Drinks are priced at the smallest size; larger sizes and add-ons are priced when you choose them.
        &ldquo;Ask at counter&rdquo; means the price isn&rsquo;t posted yet. The bakery case changes with the day&rsquo;s bake.
      </p>
    </div>
  );
}
