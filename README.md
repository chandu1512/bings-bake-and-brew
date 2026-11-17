# Bing's Bake & Brew

Website for Bing's Bake & Brew, the coffee bar of Bing's Bakery (est. 1871).
Two shops: **Amstel Square** (Newark, DE) and **Elkton** (MD).

Next.js 15 App Router, TypeScript, Tailwind 3, Framer Motion (component
motion), GSAP ScrollTrigger + Lenis (scroll).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Pages

| Route | What it is |
| --- | --- |
| `/` | Hero with the shop switch, new items, the chosen shop's menu, the 1871 story, review themes, both shops, gift cards |
| `/menu` | The chosen shop's full menu, every category, with photos and prices |
| `/order` | How pickup works, plus the menu with add-to-bag |
| `/gift-cards` | The gift card and the link to buy one on Toast |
| `/visit` | Both shops: address, full hours, map, directions, tap-to-call |
| `/location` | Redirects to `/visit` |

## The shop switch

The Amstel / Elkton switch appears in the nav, the hero and on every menu. It
swaps the menu, prices, hours, open-now badge, photos, address and Toast link.

- The choice is remembered in `localStorage` (`bings.store`).
- It is mirrored in the address as `?store=amstel` or `?store=elkton`, so a
  link opens on the right shop. A link wins over the remembered choice.

## Editing the shops: `src/lib/site.ts`

Everything about a shop lives in the `STORES` object: name, address, phone,
hours, Toast link, one-line description and photos. Change it there and the
whole site follows.

```ts
elkton: {
  street: "124 W Main St",
  phone: "(667) 215-0237",   // "" hides every phone link for this shop
  hours: monSat(h(7, 30), h(16)),   // 7:30am to 4pm, Monday to Saturday
  toastUrl: "https://toast.app/r/bings-bakery-3-124-w-main-street",
  ...
}
```

- **Hours** are minutes after midnight per day, Sunday first; `null` is closed.
  The "Open now / closes 3pm" badge is worked out from this table in US Eastern
  time, whatever time zone the visitor is in.
- **Phone**: leave `phone: ""` and tap-to-call disappears for that shop.
- Only these two shops exist on the site. Do not add others here unless they
  should be public.

## Editing the menu: `src/lib/menu.ts`

- `DRINKS` holds the drinks, shared by both shops. `BAKED` holds everything in
  the bakery case and the savory shelf.
- `STORE_MENU` says which pastries and savory items each shop sells. Edit the
  lists of ids to add, remove or reorder. An empty list hides that section.
- **Elkton's pastry list still needs the owner's confirmation** (marked in the
  file).
- `price: null` shows "Ask at counter". No price on the site is invented: they
  are the published ones (hot drinks at medium, cold drinks at large).
- `tag: "New"` or `"Gluten-free"` puts a badge on the photo.

## Photos

Every photo on the site right now is a **stand-in from Unsplash** (free
licence, hotlinked from `images.unsplash.com`). They are close matches, not
pictures of Bing's own shops, drinks or pastries.

**Menu items.** Save your photo as `public/menu/<item id>.jpg` (ids are in
`src/lib/menu.ts`, for example `public/menu/crumb-cake.jpg`), then rebuild.
The local file replaces the stand-in automatically; no code change. About
1200 x 900 (4:3) works best. The cream placeholder files already in
`public/menu` are ignored until they are replaced (`src/lib/photos.ts` tells
them apart by content).

**Stand-in sources** (all `https://images.unsplash.com/photo-<id>`):

| Where | Unsplash photo id |
| --- | --- |
| Menu items (46) | listed one per item in `src/lib/menu-photos.ts` |
| Hero, Amstel Square | `1509042239860-f550ce710b93` |
| Hero, Elkton | `1453614512568-c4024d13c247` |
| Shop card, Amstel Square | `1495474472287-4d71bcdd2085` |
| Shop card, Elkton | `1554118811-1e0d58224f24` |
| Blackberry Mocha feature | `1515442261605-65987783cb6a` |
| Macaron feature | `1569864358642-9d1684040f43` |
| Bakery case band on `/visit` | `1517433670267-08bbd4be890f` |

Shop and atmosphere photos are set in `src/lib/site.ts` (`photo`, `photoAlt2`,
`STAND_INS`). Point `src` at a file in `public/` (for example
`/shops/amstel.jpg`) to use your own. Two honest caveats: no stand-in shows an
actual hamantaschen (a cherry pastry stands in), and the Blackberry Mocha photo
is a plain mocha.

All stand-in photos are local files in `public/photos`; nothing loads from Unsplash.

## Ordering: Toast (static site)

This branch (`static-toast`) is a fully static site for SiteGround. There is no
cart, checkout or server. Every Order button opens the shop's Toast online
ordering page, set as `toastOrderUrl` for each shop in `src/lib/site.ts`. The
menu pages keep prices for browsing. Gift cards are sold on Toast too.

The earlier version with on-site Stripe checkout, the live `/staff` orders page
and email/text alerts is saved on the `main` branch.

## Building and hosting

`npm run build` writes the whole site to `out/` (`output: "export"`,
`trailingSlash: true`, unoptimized images in `next.config.ts`). Upload the
contents of `out/` to the site root on SiteGround. `out/.htaccess` comes from
`public/.htaccess`: HTTPS and one host, 301s from the old WordPress URLs, 410s
for old theme demo content, the 404 page, MIME types for the videos, and caching.

## Maps

"Get directions" opens Google Maps directions to the shop's address. `/visit`
embeds a Google map per shop, with an address card behind it in case the map
is blocked.

## Where things are

```
src/lib/site.ts          shops, hours, Toast links, stand-in photos
src/lib/menu.ts          items, prices, per-shop lists
src/lib/menu-photos.ts   stand-in photo per menu item
src/lib/hours.ts         open-now logic
src/lib/photos.ts        detects real photos in public/menu at build time
src/components/providers.tsx   chosen shop, bag, clock
src/components/StoreToggle.tsx the shop switch
src/components/MenuBoard.tsx   menu grid, tabs, add-to-bag
src/components/BagDrawer.tsx   the bag and the Toast handoff
src/components/Heritage.tsx    the scroll-driven 1871 story
src/components/GiftCard.tsx    the tilting gift card
src/components/SmoothScroll.tsx Lenis + GSAP ticker
```

## Motion

Framer Motion handles component motion (the switch pill, crossfades, the bag,
steppers, the gift card tilt). GSAP ScrollTrigger handles scroll motion (the
pinned story, the hero photo drift, the review phrases), with Lenis smooth
scroll driven from the GSAP ticker. Everything respects
`prefers-reduced-motion`: the story becomes a plain timeline and smooth scroll
is switched off.

## Still needed from the owner

- Confirm the Elkton phone number, (667) 215-0237 (taken from a public listing).
- Confirm Elkton's pastry list and whether Elkton sells anything savory.
- Prices for Blackberry Mocha, bagels, raspberry strip and plain croissant.
- Confirm Amstel's size, flavor and milk prices (copied from Elkton).
- The exact Toast ordering URL for each shop (both use the brand page for now).
- Real photos of both shops, the drinks and the bakery case.

## Real menus and photos (scraped 2026-11-15)

Each shop now has its own menu, prices and photos, taken from its live delivery menu:

- Amstel Square: DoorDash, `data/scraped/amstel-doordash.json`
- Elkton: Seamless, `data/scraped/elkton-seamless.json`

The shops' own product photos are saved in `public/photos/<shop>/`. The site builds
`src/lib/menu-data.ts` from those files. After editing them or scraping again, run:

```bash
python3 scripts/build-menu-data.py
```

Notes:
- Prices are what each shop charges on delivery apps. In-store prices may be a little lower.
- **Elkton options** (sizes, 19 flavors, milks, extra shot) were captured from each Seamless item page into `data/scraped/elkton-seamless-options.json`. Every Elkton drink has them. Elkton's food has none on Seamless, because each bagel or sandwich is its own item there.
- **Amstel options**: DoorDash hides them from automated browsers, so they are built in `scripts/build-menu-data.py`:
  - Drinks Elkton also sells use Elkton's flavors, milks and extra shot. Sizes are named in ounces as on Amstel's DoorDash page (12/16/20 oz hot, 16/24 oz cold) and priced from Amstel's own starting price plus Elkton's step-up between sizes.
  - Americano, Cold Brew and Iced Tea, which Elkton doesn't sell, copy the size step-ups from Elkton's closest drink.
  - Food choices (bagel type, cream cheese, bacon or sausage, bread, muffin flavor, cookie) come from Amstel's DoorDash descriptions and have no extra charge.
  - Any item whose prices were copied is marked `optionsAssumed: true`. **The owner should confirm those.**
- An item with no photo of its own uses the same drink's photo from the other shop, or an Unsplash stand-in if neither shop has one.

## Hero footage

The home hero plays one background clip per shop, stored in `public/media/` with a poster JPG each. Both are from Mixkit and used under the Mixkit Stock Video Free License (free for commercial use, no attribution required): https://mixkit.co/license/#videoFree

| File | Shop | Source |
| --- | --- | --- |
| `hero-amstel.mp4` (720p) | Amstel Square | "A barista preparing coffee with milk and ice": https://mixkit.co/free-stock-video/a-barista-preparing-coffee-with-milk-and-ice-796/ |
| `hero-elkton.mp4` (720p) | Elkton | "Steaming mug": https://mixkit.co/free-stock-video/steaming-mug-808/ |

The floating film prints over the footage are the shops' own photos from `public/photos/`.

## Hero cutouts

The floating objects in the hero (`public/hero/*.webp`) are Unsplash photos (free licence, unsplash.com/license) with the background removed by `rembg`:

| File | Unsplash photo id |
| --- | --- |
| amstel-iced-latte.webp | 1578314675249-a6910f80cc4e |
| amstel-muffins.webp | 1607958996333-41aef7caefaa |
| elkton-latte.webp | 1534778101976-62847782c213 |
| elkton-crumb-cake.webp | 1773399159452-0b9b205c751f |
| elkton-muffin.webp | 1558303420-f814d8a590f5 |

To swap one, for example for an AI-generated render, save a transparent PNG or WebP at the same path and update its `w`/`h` in `PRINTS` in `src/components/Hero.tsx`.
