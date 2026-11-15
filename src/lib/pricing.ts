/**
 * Order pricing. Runs in the browser for the live total and again on the
 * server before charging, so the amount charged always comes from the menu
 * data and never from what the browser says.
 */
import { itemById, type MenuItem, type OptionGroup } from "./menu";
import type { CartLineInput, PricedLine } from "./order-types";
import type { StoreId } from "./site";

/**
 * Sales tax per shop, as a fraction.
 * Elkton: Maryland charges 6% on prepared food and drink; the shop's Seamless
 * listing applies 6%. Amstel: Delaware has no sales tax.
 * Have the owner's accountant confirm both before going live.
 */
export const TAX_RATE: Record<StoreId, number> = { amstel: 0, elkton: 0.06 };

const cents = (dollars: number) => Math.round(dollars * 100);

/** The option ids a new line starts with: each required group's first option. */
export function defaultChoices(item: MenuItem): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const g of item.groups ?? []) if (g.min > 0 && g.options[0]) out[g.id] = [g.options[0].id];
  return out;
}

/** Problem with a line's choices, or null when the line is valid. */
export function choiceError(item: MenuItem, choices: Record<string, string[]>): string | null {
  for (const g of item.groups ?? []) {
    const picked = (choices[g.id] ?? []).filter((id) => g.options.some((o) => o.id === id));
    if (picked.length < g.min) return `Choose ${g.name.toLowerCase()} for ${item.name}`;
    if (picked.length > g.max) return `Too many choices in ${g.name.toLowerCase()} for ${item.name}`;
  }
  return null;
}

function chosen(group: OptionGroup, choices: Record<string, string[]>) {
  const ids = new Set(choices[group.id] ?? []);
  return group.options.filter((o) => ids.has(o.id));
}

/** Price one line in cents. Throws when the item is unknown or choices are invalid. */
export function priceLine(store: StoreId, line: CartLineInput): PricedLine {
  const item = itemById(line.id);
  if (!item || !line.id.startsWith(`${store}-`)) throw new Error("That item isn't on this shop's menu.");
  const base = item.base ?? item.price;
  if (base === null || base === undefined) throw new Error(`${item.name} is priced at the counter, so it can't be ordered online.`);
  const qty = Math.floor(line.qty);
  if (!(qty >= 1 && qty <= 50)) throw new Error("Quantity must be between 1 and 50.");
  const err = choiceError(item, line.choices ?? {});
  if (err) throw new Error(err);

  let unit = cents(base);
  const labels: string[] = [];
  for (const g of item.groups ?? []) {
    for (const o of chosen(g, line.choices ?? {})) {
      unit += cents(o.price);
      labels.push(o.name);
    }
  }
  const note = line.note?.trim().slice(0, 140) || undefined;
  return { id: item.id, name: item.name, qty, options: labels, note, unitCents: unit, totalCents: unit * qty };
}

export function priceCart(store: StoreId, lines: CartLineInput[], tipCents = 0) {
  if (!lines.length) throw new Error("Your bag is empty.");
  const priced = lines.map((l) => priceLine(store, l));
  const subtotalCents = priced.reduce((n, l) => n + l.totalCents, 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE[store]);
  const tip = Math.max(0, Math.min(Math.floor(tipCents || 0), 10_000));
  return { lines: priced, subtotalCents, taxCents, tipCents: tip, totalCents: subtotalCents + taxCents + tip };
}
