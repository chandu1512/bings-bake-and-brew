/**
 * Local SEO: schema.org structured data built only from src/lib/site.ts.
 * One CafeOrCoffeeShop per shop, both part of the Bing's Bake & Brew brand.
 */
import type { Metadata } from "next";
import { SHOP_NAME, SITE_URL, SOCIAL, STORE_IDS, STORES, directionsUrl, type Store } from "./site";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const hhmm = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

/** Groups days with identical hours into one OpeningHoursSpecification each. */
function openingHours(store: Store) {
  const groups = new Map<string, string[]>();
  store.hours.forEach((h, day) => {
    if (!h) return;
    const key = `${h.open}-${h.close}`;
    groups.set(key, [...(groups.get(key) ?? []), DAYS[day]]);
  });
  return [...groups.entries()].map(([key, days]) => {
    const [open, close] = key.split("-").map(Number);
    return { "@type": "OpeningHoursSpecification", dayOfWeek: days, opens: hhmm(open), closes: hhmm(close) };
  });
}

function shopNode(store: Store) {
  return {
    "@type": "CafeOrCoffeeShop",
    "@id": `${SITE_URL}/#shop-${store.id}`,
    name: `${SHOP_NAME} ${store.name}`,
    url: `${SITE_URL}/?store=${store.id}`,
    image: `${SITE_URL}/photos/elkton/baked-goods--crumb-cake.jpg`,
    logo: `${SITE_URL}/brand/Bings_Bake_Brew_Logo_Color.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: store.suite ? `${store.street}, ${store.suite}` : store.street,
      addressLocality: store.city,
      addressRegion: store.state,
      postalCode: store.zip,
      addressCountry: "US",
    },
    // TODO(owner): add "geo" (latitude/longitude) once confirmed from Google Business Profile.
    ...(store.phone ? { telephone: `+1-${store.phone.replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}` } : {}),
    openingHoursSpecification: openingHours(store),
    servesCuisine: ["Coffee", "Bakery"],
    priceRange: "$",
    menu: `${SITE_URL}/menu/${store.id}/`,
    acceptsReservations: false,
    hasMap: directionsUrl(store),
    parentOrganization: { "@id": `${SITE_URL}/#brand` },
  };
}

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#brand`,
        name: SHOP_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/brand/Bings_Bake_Brew_Logo_Color.png`,
        sameAs: SOCIAL,
        subOrganization: STORE_IDS.map((id) => ({ "@id": `${SITE_URL}/#shop-${id}` })),
      },
      ...STORE_IDS.map((id) => shopNode(STORES[id])),
    ],
  };
}

/** "Newark, DE and Elkton, MD", built from the shop list. */
export const TOWNS = STORE_IDS.map((id) => STORES[id].town).join(" and ");

/** The image shown when a page is shared (Open Graph and Twitter). */
export const OG_IMAGE = { url: "/photos/elkton/baked-goods--crumb-cake.jpg", width: 1200, height: 900, alt: `Crumb cake from ${SHOP_NAME}` };

/**
 * Title, description, canonical URL, Open Graph and Twitter card for one page.
 * A page's openGraph replaces the site-wide one entirely in Next.js, so every
 * page goes through here to keep the share image and large card.
 * `absolute` skips the " | Bing's Bake & Brew" suffix for titles that already name the shop.
 */
export function pageMeta({ title, description, path, absolute = false }: { title: string; description: string; path: string; absolute?: boolean }): Metadata {
  const full = absolute ? title : `${title} | ${SHOP_NAME}`;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SHOP_NAME, locale: "en_US", title: full, description, url: path, images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", title: full, description, images: [OG_IMAGE.url] },
  };
}
