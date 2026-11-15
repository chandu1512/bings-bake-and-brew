/**
 * The menu, per shop.
 *
 * Each shop has its own items and prices, generated into ./menu-data.ts from
 * the shop's live delivery menu (DoorDash for Amstel, Seamless for Elkton).
 * Drink prices are for the regular (smallest) size; larger sizes cost more and
 * are priced in the options sheet. In-store prices may be a little lower than delivery.
 *
 * To edit:
 *  - re-scrape, or edit data/scraped/*.json, then run
 *    `python3 scripts/build-menu-data.py`
 *  - drop a photo at public/menu/<item id>.jpg and it replaces the item's photo
 */
import type { StoreId } from "./site";
import { RAW_MENU } from "./menu-data";

export type Size = "Regular" | "Large";

/** One choice inside an option group. `price` is what it adds, in dollars. */
export type Option = { id: string; name: string; price: number };
/** "Choose a size" (min 1, max 1), "Add a flavor" (min 0, max 1) and so on. */
export type OptionGroup = { id: string; name: string; min: number; max: number; options: Option[] };

export type CategoryId = "feature" | "espresso" | "ice" | "frozen" | "tea" | "bakery" | "savory";

/** Shape of one generated item in menu-data.ts. */
export type RawItem = {
  id: string;
  section: CategoryId;
  name: string;
  description: string;
  price: number | null;
  /** true when the price is a starting price ("$5.10+"). */
  from: boolean;
  /** The shop's own photo, saved under public/photos. */
  photo: string | null;
  /** Fallback stand-in key for src/lib/menu-photos.ts. */
  stockId: string;
  /** Price before options. 0 when the size choice carries the whole price. */
  base: number | null;
  /** Sizes, milks, flavors, extra shots... as the shop lists them. */
  groups?: OptionGroup[];
  /** true when the options were copied from the other shop and need the owner to confirm. */
  optionsAssumed?: boolean;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  /** null = not published. Shows "Ask at counter". */
  price: number | null;
  /** The size the published price is for. Drinks only. */
  listedSize?: Size;
  tag?: "New" | "Gluten-free";
  photo?: string | null;
  stockId?: string;
  /** Price before options; what the server charges from. */
  base?: number | null;
  groups?: OptionGroup[];
};

export const CATEGORY_META: Record<CategoryId, { name: string; blurb: string }> = {
  espresso: {
    name: "Espresso",
    blurb: "A five-bean house blend, pulled to order. Prices are for a regular.",
  },
  feature: {
    name: "Featured Drink",
    blurb: "The drink of the moment, hot, iced or frozen. Ask what's on the board.",
  },
  ice: {
    name: "Over Ice",
    blurb: "The espresso bar, poured cold. Prices are for a regular.",
  },
  frozen: {
    name: "Frozen & Blended",
    blurb: "Blended thick. Prices are for a regular.",
  },
  tea: {
    name: "Teas & Alternatives",
    blurb: "Loose leaf tea, chai and cocoa for the non-coffee order.",
  },
  bakery: {
    name: "Bakery Case",
    blurb: "Baked at Bing's Bakery in Newark, which has been at it since 1871.",
  },
  savory: {
    name: "Savory",
    blurb: "Bagels, croissants and breakfast sandwiches, made to order.",
  },
};

const ORDER: CategoryId[] = ["espresso", "feature", "ice", "frozen", "tea", "bakery", "savory"];
const DRINK: CategoryId[] = ["espresso", "feature", "ice", "frozen", "tea"];

const toItem = (r: RawItem): MenuItem => ({
  id: r.id,
  name: r.name,
  description: r.description,
  price: r.price,
  listedSize: DRINK.includes(r.section) && !(r.groups ?? []).some((g) => /size/i.test(g.name)) ? "Regular" : undefined,
  tag: r.section === "feature" ? "New" : undefined,
  photo: r.photo,
  stockId: r.stockId,
  base: r.base,
  groups: r.groups?.length ? r.groups : undefined,
});

export type MenuCategory = { id: CategoryId; name: string; blurb: string; items: MenuItem[] };

const BY_STORE: Record<StoreId, MenuCategory[]> = Object.fromEntries(
  (Object.keys(RAW_MENU) as StoreId[]).map((store) => [
    store,
    ORDER.map((id) => ({ id, ...CATEGORY_META[id], items: RAW_MENU[store].filter((r) => r.section === id).map(toItem) })).filter(
      (c) => c.items.length > 0,
    ),
  ]),
) as Record<StoreId, MenuCategory[]>;

/** The full menu for one shop. Empty categories are left out. */
export function menuFor(store: StoreId): MenuCategory[] {
  return BY_STORE[store];
}

export const ALL_ITEMS: MenuItem[] = Object.values(BY_STORE).flatMap((cats) => cats.flatMap((c) => c.items));
const allById = new Map(ALL_ITEMS.map((i) => [i.id, i]));
export const itemById = (id: string) => allById.get(id);

export const SIZES: Size[] = ["Regular", "Large"];

/** Price of an item at a size, or null when that size has no published price. */
export function priceAt(item: MenuItem, size?: Size): number | null {
  if (item.price === null) return null;
  if (!item.listedSize) return item.price;
  return size === undefined || size === item.listedSize ? item.price : null;
}

export function itemPhoto(id: string) {
  return `/menu/${id}.jpg`;
}

export function money(n: number) {
  return `$${n.toFixed(2)}`;
}
