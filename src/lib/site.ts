/**
 * Single source of truth for both shops.
 *
 * Bing's Bake & Brew has two shops on this site: Amstel Square (Newark, DE)
 * and Elkton (MD). Edit a shop here and every page, the footer, the maps,
 * the open-now badge and the Toast checkout link follow.
 */

export const SHOP_NAME = "Bing's Bake & Brew";
export const BAKERY_NAME = "Bing's Bakery";
export const FOUNDED = 1871;

/**
 * Public address of the site, used for canonical URLs, Open Graph, the sitemap
 * and structured data. Set NEXT_PUBLIC_SITE_URL in .env.local to override.
 * TODO(owner): confirm the new site will live at bingsbakeandbrew.com (the
 * domain the current site uses) before launch.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://bingsbakeandbrew.com").replace(/\/$/, "");

/** Bing's Bake & Brew's Facebook page, as linked from the previous site. */
export const SOCIAL = ["https://www.facebook.com/bingsbakeandbrew/"];

/** Both shops sit in US Eastern time. Open/closed is always worked out in it. */
export const TIME_ZONE = "America/New_York";

export type StoreId = "amstel" | "elkton";

/** Minutes after midnight, or null when the shop is closed that day. Index 0 = Sunday. */
export type DayHours = { open: number; close: number } | null;

export type Store = {
  id: StoreId;
  /** Short name used on the switch. */
  name: string;
  town: string;
  street: string;
  suite?: string;
  city: string;
  state: string;
  zip: string;
  /** Leave "" when there is no number: every phone link and label hides itself. */
  phone: string;
  /** Sunday first. */
  hours: DayHours[];
  /** Toast online ordering for this shop. Checkout hands off here. */
  toastUrl: string;
  /** One plain line about the shop. Facts only. */
  blurb: string;
  /**
   * STAND-IN photos (Unsplash), not the real shop. Replace `src` with a file
   * in /public (for example "/shops/amstel.jpg") when real photos exist.
   */
  photo: { src: string; alt: string };
  photoAlt2: { src: string; alt: string };
};

const h = (hh: number, mm = 0) => hh * 60 + mm;
const monSat = (open: number, close: number): DayHours[] => [
  null,
  { open, close },
  { open, close },
  { open, close },
  { open, close },
  { open, close },
  { open, close },
];

const unsplash = (id: string, w = 1400, hgt = 1750) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${hgt}&q=72`;

export const STORES: Record<StoreId, Store> = {
  amstel: {
    id: "amstel",
    name: "Amstel Square",
    town: "Newark, DE",
    street: "57 S Main St",
    suite: "Suite 101",
    city: "Newark",
    state: "DE",
    zip: "19711",
    phone: "(302) 751-3177",
    hours: monSat(h(7, 30), h(15)),
    toastUrl: "https://www.toasttab.com/bingsbakeandbrew",
    blurb: "On South Main by the University of Delaware. Bagels as well as the bakery case.",
    photo: {
      src: unsplash("1509042239860-f550ce710b93"),
      alt: "Lattes with poured hearts on a cafe table",
    },
    photoAlt2: {
      src: unsplash("1495474472287-4d71bcdd2085", 1200, 900),
      alt: "Three coffees held together over a table",
    },
  },
  elkton: {
    id: "elkton",
    name: "Elkton",
    town: "Elkton, MD",
    street: "124 W Main St",
    city: "Elkton",
    state: "MD",
    zip: "21921",
    // OWNER TO CONFIRM: this number comes from a public place listing, not from
    // the shop itself. Set it to "" to hide every phone link for Elkton.
    phone: "(667) 215-0237",
    hours: monSat(h(7, 30), h(16)),
    toastUrl: "https://toast.app/r/bings-bakery-3-124-w-main-street",
    blurb: "Opened in 2025 on West Main, across from Sonny's Deli. Open an hour later.",
    photo: {
      src: unsplash("1453614512568-c4024d13c247"),
      alt: "A bright coffee bar with an espresso machine and shelves",
    },
    photoAlt2: {
      src: unsplash("1554118811-1e0d58224f24", 1200, 900),
      alt: "Cafe tables and chairs in a sunlit room",
    },
  },
};

export const STORE_IDS: StoreId[] = ["amstel", "elkton"];
export const DEFAULT_STORE: StoreId = "amstel";

export const isStoreId = (v: unknown): v is StoreId => v === "amstel" || v === "elkton";

/** Gift cards are sold through Toast. */
export const GIFT_CARD_URL = "https://www.toasttab.com/bingsbakeandbrew/giftcards";

/** Other stand-in photos used for atmosphere. Listed in the README. */
export const STAND_INS = {
  macarons: {
    src: unsplash("1569864358642-9d1684040f43", 1200, 900),
    alt: "French macarons in soft colours",
  },
  bakeryCase: {
    src: unsplash("1517433670267-08bbd4be890f", 1400, 1000),
    alt: "A bakery counter stacked with bread and pastries",
  },
  croissants: {
    src: unsplash("1555507036-ab1f4038808a", 1200, 900),
    alt: "Croissants dusted with flour",
  },
};

export function addressLines(s: Store): [string, string] {
  return [s.suite ? `${s.street}, ${s.suite}` : s.street, `${s.city}, ${s.state} ${s.zip}`];
}

export function fullAddress(s: Store) {
  return addressLines(s).join(", ");
}

export function directionsUrl(s: Store) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${SHOP_NAME}, ${fullAddress(s)}`,
  )}`;
}

export function mapEmbedUrl(s: Store) {
  return `https://maps.google.com/maps?q=${encodeURIComponent(
    `${SHOP_NAME}, ${fullAddress(s)}`,
  )}&z=16&ie=UTF8&output=embed`;
}

export function telHref(phone: string) {
  return `tel:+1${phone.replace(/\D/g, "")}`;
}

export const NAV = [
  { href: "/menu", label: "Menu" },
  { href: "/order", label: "Order pickup" },
  { href: "/gift-cards", label: "Gift cards" },
  { href: "/visit", label: "Visit" },
];
