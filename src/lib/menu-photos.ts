import { itemById } from "./menu";
/**
 * STAND-IN photos for menu items, from Unsplash (free licence).
 * They are close matches, not photos of Bing's own drinks and pastries.
 *
 * To replace one with the real thing, save your photo as
 * public/menu/<item id>.jpg and rebuild. The local file wins automatically;
 * nothing here needs to change. Roughly 1200 x 900 (4:3) works best.
 */
const ID: Record<string, string> = {
  "blackberry-mocha": "1515442261605-65987783cb6a",
  "bings-mocha": "1557006021-b85faa2bc5e2",
  "white-mocha": "1534778101976-62847782c213",
  "vanilla-latte": "1517256064527-09c73fc73e38",
  "cafe-mocha": "1517578239113-b03992dcdd25",
  "cafe-latte": "1485808191679-5f86510681a2",
  cappuccino: "1541167760496-1628856ab772",
  americano: "1521302080334-4bebac2763a6",
  espresso: "1559496417-e7f25cb247f3",
  "brewed-coffee": "1510591509098-f4fdc6d0ff04",
  "iced-bings-mocha": "1504753793650-d4a2b783c15e",
  "iced-white-mocha": "1592663527359-cf6642f54cff",
  "iced-vanilla-latte": "1517701604599-bb29b565090c",
  "iced-cafe-mocha": "1461023058943-07fcbe16d735",
  "iced-chai-latte": "1761673930163-8d3d6d73cd7a",
  "iced-cafe-latte": "1578314675249-a6910f80cc4e",
  "iced-coffee": "1499961024600-ad094db305cc",
  "frozen-bings-mocha": "1577805947697-89e18249d767",
  "frozen-white-mocha": "1572490122747-3968b75cc699",
  "frozen-vanilla-latte": "1637178035575-b0dcbd28a09b",
  "frozen-coffee-mocha": "1696487773677-c0c8061fe3d2",
  "frozen-chai-latte": "1718267050202-9b1b6bfb8545",
  "green-tea-matcha": "1515823064-d6e0c04616a7",
  "hot-chocolate-freeze": "1553787499-6f9133860278",
  "vanilla-creme": "1568901839119-631418a3910d",
  "fruit-smoothie": "1553530666-ba11a7da3888",
  "chai-latte": "1544787219-7f47ccb76574",
  "hot-chocolate": "1542990253-0d0f5be5f0ed",
  "italian-soda": "1563227812-0ea4c22e6cc8",
  "loose-leaf-hot-tea": "1564890369478-c89ca6d9cde9",
  "organic-black-tea": "1571934811356-5cc061b6821f",
  "organic-green-tea": "1558160074-4d7d8bdf4256",
  "french-macaron": "1558326567-98ae2405596b",
  "crumb-cake": "1773399159452-0b9b205c751f",
  "iced-cinnamon-buns": "1509365465985-25d11c17e812",
  muffins: "1558303420-f814d8a590f5",
  "cherry-hammentachen": "1635348965813-fa7d0dfb99d2",
  brownies: "1564355808539-22fda35bed7e",
  "pound-cake-slice": "1514435390218-898a0e01517a",
  tiramisu: "1571877227200-a0d98ea607e9",
  "raspberry-strip": "1671759545288-2d7fa26d6b9e",
  "fruit-tart": "1620980776848-84ac10194945",
  "gourmet-cupcakes": "1519869325930-281384150729",
  "croissant-plain": "1623334044303-241021148842",
  "bagel-butter": "1687175452217-e4f8e523b5b5",
  "bagel-cream-cheese": "1707079266703-b67f36a881f1",
};

/**
 * Photo for a menu item, best first: a file the owner dropped in public/menu,
 * then the shop's own photo from its delivery menu, then an Unsplash stand-in.
 */
export function menuPhoto(id: string, hasLocal: boolean, w = 900, h = 675) {
  if (hasLocal) return `/menu/${id}.jpg`;
  const item = itemById(id);
  if (item?.photo) return item.photo;
  const stock = ID[item?.stockId ?? id] ?? ID[(item?.stockId ?? "").replace(/^(iced|frozen)-/, "")];
  if (!stock) return "/menu/brewed-coffee.jpg";
  return `https://images.unsplash.com/photo-${stock}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;
}
