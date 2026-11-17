import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TOWNS, pageMeta } from "@/lib/seo";
import { STORE_IDS, STORES, addressLines } from "@/lib/site";
import { hoursSummary } from "@/lib/hours";
import OrderLink from "@/components/OrderLink";
import OpenBadge from "@/components/OpenBadge";

export const metadata: Metadata = pageMeta({
  title: "Order Online for Pickup",
  description: `Order coffee and Bing's Bakery pastries ahead on Toast and pick up at our shop in ${TOWNS}.`,
  path: "/order/",
});

/** Ordering happens on Toast. This page picks the shop and hands off to its Toast page. */
export default function OrderPage() {
  return (
    <div className="shell pb-24 pt-[120px] md:pt-[150px]">
      <h1 className="display-xl max-w-[14ch]">Order ahead, pick it up.</h1>
      <p className="lede mt-5 max-w-[52ch]">
        Online orders are taken on Toast. Pick your shop, order and pay there, and we&rsquo;ll have it ready.
      </p>
      <ul className="mt-12 grid gap-6 lg:grid-cols-2">
        {STORE_IDS.map((id) => {
          const s = STORES[id];
          const [l1, l2] = addressLines(s);
          return (
            <li key={id} className="card flex flex-col overflow-hidden">
              <div className="gloss relative aspect-[16/9] overflow-hidden bg-porcelain-deep">
                <Image src={s.photo.src} alt={s.photo.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col p-6 md:p-8">
                <h2 className="font-display text-[2rem] font-normal leading-none md:text-[2.4rem]">{s.name}</h2>
                <OpenBadge store={s} className="mt-3 text-[1rem]" />
                <p className="mt-3 text-[1.05rem]">
                  {l1}, {l2}
                </p>
                <p className="mt-1 text-ink-soft">{hoursSummary(s)}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <OrderLink store={id} className="btn btn-cherry">{`Order from ${s.name}`}</OrderLink>
                  <Link href={`/menu/${id}/`} className="btn btn-glass">
                    See the menu
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
