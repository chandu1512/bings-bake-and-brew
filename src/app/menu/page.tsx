import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TOWNS, pageMeta } from "@/lib/seo";
import { STORE_IDS, STORES, addressLines } from "@/lib/site";
import { hoursSummary } from "@/lib/hours";
import { ArrowRight } from "@/components/icons";
import MenuChooserRedirect from "@/components/MenuChooserRedirect";

const title = `Menu | ${TOWNS}`;
const description = `Pick your shop to see its menu and prices: Bing's Bake & Brew in ${TOWNS}.`;

export const metadata: Metadata = pageMeta({ title, description, path: "/menu" });

/** Chooser: one big card per shop. A visitor who has already picked a shop goes straight to its menu. */
export default function MenuChooserPage() {
  return (
    <div className="shell pb-24 pt-[120px] md:pt-[150px]">
      <MenuChooserRedirect />
      <h1 className="display-xl max-w-[14ch]">Which shop&rsquo;s menu?</h1>
      <p className="lede mt-5">Each shop has its own menu and prices.</p>
      <ul className="mt-12 grid gap-6 lg:grid-cols-2">
        {STORE_IDS.map((id) => {
          const s = STORES[id];
          const [l1, l2] = addressLines(s);
          return (
            <li key={id}>
              <Link href={`/menu/${id}`} className="card zoom-frame group flex h-full flex-col overflow-hidden">
                <div className="gloss relative aspect-[16/9] overflow-hidden bg-porcelain-deep">
                  <Image src={s.photo.src} alt={s.photo.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="zoom object-cover" />
                </div>
                <div className="flex flex-1 flex-col p-6 md:p-8">
                  <h2 className="font-display text-[2rem] font-normal leading-none md:text-[2.6rem]">{s.name}</h2>
                  <p className="mt-3 text-[1.05rem]">
                    {l1}, {l2}
                  </p>
                  <p className="mt-1 text-ink-soft">{hoursSummary(s)}</p>
                  <span className="btn btn-ink mt-6 self-start">
                    See the {s.name} menu <ArrowRight className="nudge" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
