import { itemById } from "./menu";
/**
 * Photo for a menu item, best first: a file the owner dropped in public/menu
 * (named by item id), then the shop's own photo from its delivery menu, then
 * the stand-in in public/photos/menu-<stock id>.jpg. Replace a stand-in by
 * saving a real photo over that file with the same name.
 */
export function menuPhoto(id: string, hasLocal: boolean) {
  if (hasLocal) return `/menu/${id}.jpg`;
  const item = itemById(id);
  if (item?.photo) return item.photo;
  return `/photos/menu-${item?.stockId ?? "brewed-coffee"}.jpg`;
}
