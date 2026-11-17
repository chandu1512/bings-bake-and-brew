"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { STORE_IDS, STORES, addressLines, directionsUrl, mapEmbedUrl, telHref, type StoreId } from "@/lib/site";
import { DAY_NAMES, clock, hoursSummary, shopTime } from "@/lib/hours";
import { useNow, useStore } from "./providers";
import OpenBadge from "./OpenBadge";
import { ArrowRight, ArrowUpRight, Phone, Pin } from "./icons";

/** Both shops side by side. `full` adds the map and the whole week of hours. */
export default function ShopCards({ full = false }: { full?: boolean }) {
  const { id: active, setStore } = useStore();
  const router = useRouter();
  const now = useNow();
  const today = now ? shopTime(now).day : -1;

  const orderFrom = (id: StoreId) => {
    setStore(id);
    router.push("/order");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {STORE_IDS.map((id) => {
        const s = STORES[id];
        const [l1, l2] = addressLines(s);
        return (
          <article
            key={id}
            id={id}
            className={`card zoom-frame flex flex-col overflow-hidden transition-shadow duration-300 ${
              active === id ? "shadow-[inset_0_0_0_2px_#bf1e2e,0_24px_50px_-30px_rgba(29,20,17,0.5)]" : ""
            }`}
          >
            <div className="gloss relative aspect-[16/9] overflow-hidden bg-porcelain-deep">
              <Image
                src={s.photo.src}
                alt={s.photo.alt}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="zoom object-cover"
              />
            </div>

            <div className="flex flex-1 flex-col p-6 md:p-8">
              <h3 className="font-display text-[2rem] font-normal leading-none md:text-[2.4rem]">{s.name}</h3>
              <OpenBadge store={s} className="mt-3 text-[1rem]" />
              <address className="mt-4 text-[1.08rem] not-italic leading-relaxed">
                {l1}
                <br />
                {l2}
              </address>

              {full ? (
                <table className="tnum mt-5 w-full max-w-[340px] text-[0.98rem]">
                  <caption className="sr-only">Opening hours at {s.name}</caption>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                      const hrs = s.hours[d];
                      return (
                        <tr key={d} className={d === today ? "font-bold text-ink" : "text-ink-soft"}>
                          <th scope="row" className="py-1 text-left font-[inherit]">
                            {DAY_NAMES[d]}
                          </th>
                          <td className="py-1 text-right">{hrs ? `${clock(hrs.open)} to ${clock(hrs.close)}` : "Closed"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="tnum mt-2 text-ink-soft">{hoursSummary(s)}</p>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a href={directionsUrl(s)} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
                  Get directions <ArrowUpRight className="nudge" />
                </a>
                {s.phone && (
                  <a href={telHref(s.phone)} className="btn btn-glass tnum">
                    <Phone /> {s.phone}
                  </a>
                )}
                <button type="button" onClick={() => orderFrom(id)} className="btn btn-glass">
                  Order from {id === "amstel" ? "Amstel" : "Elkton"} <ArrowRight className="nudge" />
                </button>
              </div>
            </div>

            {full && (
              <div className="relative aspect-[16/10] border-t border-ink/10 bg-porcelain-deep sm:aspect-[16/8]">
                {/* Shown until the map loads, and if it is blocked */}
                <a
                  href={directionsUrl(s)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 grid place-items-center text-center"
                >
                  <span>
                    <Pin size={28} className="mx-auto text-cherry" />
                    <span className="mt-2 block font-semibold">{l1}</span>
                    <span className="link-under mt-1 inline-block text-ink-soft">Open in Google Maps</span>
                  </span>
                </a>
                <iframe
                  title={`Map of ${s.name}, ${l1}`}
                  src={mapEmbedUrl(s)}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0 [filter:saturate(0.85)]"
                />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
