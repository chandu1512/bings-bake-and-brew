/**
 * Single source of truth for both shops.
 *
 * Bing's Bake & Brew has two shops on this site: Amstel Square (Newark, DE)
 * and Elkton (MD). Edit a shop here and every page, the footer, the maps,
 * the open-now badge and the Toast ordering links follow.
 */

export const SHOP_NAME = "Bing's Bake & Brew";
export const BAKERY_NAME = "Bing's Bakery";
export const FOUNDED = 1871;

/**
 * Public address of the site, used for canonical URLs, Open Graph, the sitemap
 * and structured data. Set NEXT_PUBLIC_SITE_URL in .env.local to override.
 * TODO(owner): change this to the real domain (for example
 * https://bingsbakeandbrew.com) when it is pointed at this site.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://bings-bake-and-brew.vercel.app").replace(/\/$/, "");

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
  /** This shop's Toast online ordering page. Every Order button for the shop opens it. */
  toastOrderUrl: string;
  /** One plain line about the shop. Facts only. */
  blurb: string;
  /**
   * STAND-IN photo (Unsplash), not the real shop. To replace it, save the real
   * photo over the same file in public/photos (keep the name). 4:3 works best.
   */
  photo: { src: string; alt: string };
  /** The looping hero video shown while this shop is selected. Swap the clip here. */
  video: HeroVideo;
  /** The still image layered in front of and behind the hero video. Swap it here. */
  layers: HeroLayers;
};

/**
 * Hero depth image. `blend: "multiply"` drops the cream background (for dark
 * subjects like beans). `"match"` keeps normal blending and sets the hero
 * background to `bg`, the image's own backdrop (for white subjects like flour,
 * which multiply would erase).
 */
export type HeroLayers = { src: string; blend: "multiply" | "match"; bg: string };

export const HERO_LAYER_IMAGES = {
  beans: { src: "/story/beans.webp", blend: "multiply", bg: "#f8efde" },
  flour: { src: "/story/flour.webp", blend: "match", bg: "#f9eddd" },
} satisfies Record<string, HeroLayers>;

/**
 * A hero clip, built by scripts/build-hero-videos.sh from source-media/story.
 * `bg` is the clip's corner colour, used behind the video so it melts into the page.
 */
export type HeroVideo = { mp4: string; webm: string; poster: string; bg: string; label: string };

export const HERO_VIDEOS = {
  brew: { mp4: "/story/brew.mp4", webm: "/story/brew.webm", poster: "/story/brew-poster.webp", bg: "#f0e6d2", label: "Espresso pouring into a white cup" },
  bake: { mp4: "/story/bake.mp4", webm: "/story/bake.webm", poster: "/story/bake-poster.webp", bg: "#f4f2e5", label: "A croissant splitting open, flakes flying" },
} satisfies Record<string, HeroVideo>;

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
    // TODO(owner): confirm Amstel Square's exact Toast ordering URL. The brand page is used for now.
    toastOrderUrl: "https://www.toasttab.com/bingsbakeandbrew",
    blurb: "On South Main by the University of Delaware. Bagels as well as the bakery case.",
    photo: { src: "/photos/shop-amstel.jpg", alt: "Three cups of coffee held together over a cafe table" },
    video: HERO_VIDEOS.brew,
    layers: HERO_LAYER_IMAGES.beans,
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
    // TODO(owner): confirm Elkton's exact Toast ordering URL. The brand page is used for now
    // (an earlier search also turned up https://toast.app/r/bings-bakery-3-124-w-main-street).
    toastOrderUrl: "https://www.toasttab.com/bingsbakeandbrew",
    blurb: "Opened in 2025 on West Main, across from Sonny's Deli. Open an hour later.",
    photo: { src: "/photos/shop-elkton.jpg", alt: "Cafe tables and chairs in a sunlit room" },
    video: HERO_VIDEOS.bake,
    layers: HERO_LAYER_IMAGES.flour,
  },
};

export const STORE_IDS: StoreId[] = ["amstel", "elkton"];
export const DEFAULT_STORE: StoreId = "amstel";

export const isStoreId = (v: unknown): v is StoreId => v === "amstel" || v === "elkton";

/** Gift cards are sold through Toast. */
export const GIFT_CARD_URL = "https://www.toasttab.com/bingsbakeandbrew/giftcards";

/**
 * Stand-in photos (from Unsplash) all live in public/photos with plain names:
 * shop-amstel.jpg, shop-elkton.jpg, visit-bakery-case.jpg and menu-<item>.jpg.
 * Save a real photo over a file, same name, and it replaces the stand-in.
 */
export const STAND_INS = {
  bakeryCase: { src: "/photos/visit-bakery-case.jpg", alt: "A bakery counter stacked with bread and pastries" },
};

/** Footer note saying the photos are stand-ins. Set to false once the real photos are in. */
export const SHOW_STAND_IN_NOTE = true;

/*
 * TODO(owner): Blackberry Mocha. The old home page showed it with a "New" badge,
 * but it is on neither shop's menu (DoorDash, Seamless), so there is no price.
 * It was taken off the site. Once Carla confirms the price, add it to the menu
 * data (scripts/build-menu-data.py) rather than to a page.
 */

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
  { href: "/menu/", label: "Menu" },
  { href: "/order/", label: "Order pickup" },
  { href: "/gift-cards/", label: "Gift cards" },
  { href: "/visit/", label: "Visit" },
];
