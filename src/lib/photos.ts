import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import placeholders from "./placeholder-hashes.json";

/**
 * Works out, at build time, which menu items have a real photo.
 *
 * public/menu/<item id>.jpg ships as a cream placeholder. The moment a file is
 * replaced (its contents no longer match a known placeholder) or a new
 * <item id>.jpg is added, that item shows the photo instead of its drawn tile.
 * Nothing in the code needs to change: drop the file in and rebuild.
 */
export function realMenuPhotos(): string[] {
  const dir = path.join(process.cwd(), "public", "menu");
  if (!existsSync(dir)) return [];
  const known = new Set(placeholders as string[]);
  return readdirSync(dir)
    .filter((f) => /\.jpe?g$/i.test(f))
    .filter((f) => !known.has(createHash("md5").update(readFileSync(path.join(dir, f))).digest("hex")))
    .map((f) => f.replace(/\.jpe?g$/i, ""));
}
