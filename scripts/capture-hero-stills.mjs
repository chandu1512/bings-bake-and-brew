/**
 * Captures the hero's first 3D frame as stills, so the page can show them
 * instantly and swap to the live scene without a visible jump.
 *
 * Run whenever the 3D hero changes:
 *   npm run build && npx next start -p 3000      (in one terminal)
 *   node scripts/capture-hero-stills.mjs          (in another)
 *
 * Writes public/hero/poster/{amstel,elkton}-{wide,strip}.webp.
 * Needs Playwright (installed) and Python with Pillow for WebP encoding.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.SITE ?? "http://localhost:3000";
const OUT = new URL("../public/hero/poster/", import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), "hero-stills-"));

const LAYOUTS = [
  // Desktop: post-processing removes transparency, so capture with the hero's own background.
  // Sizes must match REF_ASPECT in src/components/three/HeroScene.tsx (wide 1.6, strip 390/220).
  { kind: "wide", w: 1600, h: 1000, dsf: 1.35, sel: ".hidden.lg\\:block .hero-canvas", opaque: true },
  // Phone strip: transparent, so it sits on the animated background like the live canvas.
  { kind: "strip", w: 390, h: 844, dsf: 3, sel: ".lg\\:hidden .hero-canvas", opaque: false },
];

const browser = await chromium.launch({ args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
for (const shop of ["amstel", "elkton"]) {
  for (const L of LAYOUTS) {
    const page = await browser.newPage({ viewport: { width: L.w, height: L.h }, deviceScaleFactor: L.dsf });
    await page.addInitScript(() => { window.__HERO_FREEZE__ = true; });
    await page.goto(`${BASE}/?store=${shop}`);
    await page.waitForFunction((s) => { const e = document.querySelector(s); return e && getComputedStyle(e).opacity === "1"; }, L.sel, { timeout: 30000 });
    await page.waitForTimeout(600);
    const png = join(tmp, `${shop}-${L.kind}.png`);
    const box = await page.locator(L.sel).boundingBox();
    const want = L.kind === "wide" ? 1.6 : 390 / 220;
    if (!box || Math.abs(box.width / box.height - want) > 0.01) throw new Error(`${L.kind} canvas is ${box?.width}x${box?.height}, expected aspect ${want}`);
    if (L.opaque) {
      await page.addStyleTag({ content: "header, nav, [data-hero] .shell, [data-hero] .light-leak, [class^='hero-poster-'] { visibility: hidden !important }" });
      await page.waitForTimeout(100);
      await page.screenshot({ path: png, clip: box });
    } else {
      await page.addStyleTag({
        content: `html, body, body * { background: transparent !important; background-image: none !important; box-shadow: none !important; mask-image: none !important; -webkit-mask-image: none !important; filter: none !important; visibility: hidden !important }
          ${L.sel}, ${L.sel} * { visibility: visible !important }
          body::before, body::after, [data-hero]::before, [data-hero]::after { display: none !important }`,
      });
      await page.waitForTimeout(100);
      await page.locator(L.sel).screenshot({ path: png, omitBackground: true });
    }
    await page.close();
    console.log("captured", shop, L.kind);
  }
}
await browser.close();

const py = join(tmp, "encode.py");
writeFileSync(py, `import sys, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
for f in sorted(os.listdir(src)):
    if not f.endswith(".png"): continue
    im = Image.open(os.path.join(src, f))
    im = im.convert("RGB") if f.endswith("wide.png") else im.convert("RGBA")
    out = os.path.join(dst, f[:-4] + ".webp")
    im.save(out, "WEBP", quality=72, method=6)
    print(out, os.path.getsize(out) // 1024, "KB")
`);
console.log(execFileSync(process.env.PYTHON ?? "python3", ["-I", py, tmp, OUT]).toString());
