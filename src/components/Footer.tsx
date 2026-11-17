import Image from "next/image";
import Link from "next/link";
import { GIFT_CARD_URL, NAV, SHOP_NAME, SHOW_STAND_IN_NOTE, STORE_IDS, STORES, addressLines, directionsUrl, telHref } from "@/lib/site";
import { hoursSummary } from "@/lib/hours";

export default function Footer() {
  return (
    <footer className="grain-dark relative bg-espresso text-white">
      <div className="ornament shell pt-12 !text-gold">
        <span className="script foil-text text-[2rem]">Since 1871</span>
      </div>
      <div className="shell grid gap-12 pb-10 pt-10 md:grid-cols-12 md:pt-12">
        <div className="md:col-span-4">
          <Image
            src="/brand/bings-bake-n-brew-coffee-logo-306-269.png"
            alt={SHOP_NAME}
            width={306}
            height={269}
            className="h-auto w-[170px]"
          />
          <p className="mt-4 max-w-[34ch] text-white/70">
            The coffee bar of Bing&rsquo;s Bakery, Delaware&rsquo;s longest-running bakery. Baking since 1871.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem]">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="link-draw py-2 text-white/85">{n.label}</Link>
              </li>
            ))}
            <li>
              <a href={GIFT_CARD_URL} target="_blank" rel="noopener noreferrer" className="link-draw py-2 text-white/85">
                Buy a gift card
              </a>
            </li>
          </ul>
        </div>

        {STORE_IDS.map((id) => {
          const s = STORES[id];
          const [l1, l2] = addressLines(s);
          return (
            <div key={id} className="md:col-span-4">
              <h2 className="font-display text-[1.5rem] text-butter">{s.name}</h2>
              <address className="mt-3 not-italic leading-relaxed text-white/80">
                {l1}
                <br />
                {l2}
              </address>
              <p className="mt-2 text-white/70">{hoursSummary(s)}</p>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem]">
                <li>
                  <a href={directionsUrl(s)} target="_blank" rel="noopener noreferrer" className="link-under py-2">
                    Get directions
                  </a>
                </li>
                {s.phone && (
                  <li>
                    <a href={telHref(s.phone)} className="link-under tnum py-2">{s.phone}</a>
                  </li>
                )}
                <li>
                  <a href={s.toastOrderUrl} target="_blank" rel="noopener noreferrer" className="link-under py-2">
                    Order pickup
                  </a>
                </li>
              </ul>
            </div>
          );
        })}
      </div>
      <div className="shell flex flex-col gap-2 border-t border-white/10 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 text-sm text-white/55 md:flex-row md:justify-between">
        <p>
          &copy; {new Date().getFullYear()} {SHOP_NAME}. Gift cards run on Toast.
        </p>
        {SHOW_STAND_IN_NOTE && <p>Some photographs are stand-ins from Unsplash until the shops&rsquo; own are added.</p>}
      </div>
    </footer>
  );
}
