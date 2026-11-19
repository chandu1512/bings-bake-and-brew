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
  /** Toast online ordering for this shop. Checkout hands off here. */
  toastUrl: string;
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
 * A hero clip, built by scripts/build-hero-videos.py from source-media/story.
 * Files: <base>-720.mp4 / <base>-480.mp4 (H.264 Main, the only format: it autoplays
 * everywhere, iOS included) and <base>-720-poster.webp / -480-poster.webp.
 * The rectangle edge is hidden with a CSS radial mask (HeroVideo.tsx).
 */
export type HeroVideo = { base: string; label: string; /** The clip's own backdrop colour, glowed softly behind it. */ bg: string };

export const HERO_VIDEOS = {
  brew: { base: "/story/brew", label: "Espresso pouring into a white cup", bg: "#f0e6d2" },
  bake: { base: "/story/bake", label: "A croissant splitting open, flakes flying", bg: "#f4f2e5" },
} satisfies Record<string, HeroVideo>;

/** URLs for a hero clip at a size ("720" desktop, "480" phones and tablets in portrait). */
export const heroVideoFiles = (v: HeroVideo, size: "720" | "480") => ({
  h264: `${v.base}-${size}.mp4`,
  /** Animated WebP of the same loop (480p, 20fps), used when iOS refuses video autoplay, e.g. in Low Power Mode. */
  anim: `${v.base}-anim.webp`,
  poster: `${v.base}-${size}-poster.webp`,
});

/**
 * Hero depth images. `bgWide` / `bgPhone` are the hero background with the far bean or
 * flour layer already composited in (one static image each, no blend modes); `near` is
 * the front layer, pre-blurred and transparent.
 */
export type HeroLayers = {
  bgWide: string;
  bgPhone: string;
  near: string;
};

export const HERO_LAYER_IMAGES = {
  beans: { bgWide: "/story/hero-bg-amstel-wide.webp", bgPhone: "/story/hero-bg-amstel-phone.webp", near: "/story/beans-near.webp" },
  flour: { bgWide: "/story/hero-bg-elkton-wide.webp", bgPhone: "/story/hero-bg-elkton-phone.webp", near: "/story/flour-near.webp" },
} satisfies Record<string, HeroLayers>;

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
    toastUrl: "https://www.toasttab.com/bingsbakeandbrew",
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
    toastUrl: "https://toast.app/r/bings-bakery-3-124-w-main-street",
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
  { href: "/menu", label: "Menu" },
  { href: "/order", label: "Order pickup" },
  { href: "/gift-cards", label: "Gift cards" },
  { href: "/visit", label: "Visit" },
];
