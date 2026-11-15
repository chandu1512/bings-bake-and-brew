import * as THREE from "three";

/** Small procedural textures (canvas-drawn once, cached) that give the baked goods and paper real surface detail. */
const cache = new Map<string, THREE.CanvasTexture>();

function make(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, color: boolean) {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  draw(c.getContext("2d")!, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

/** A crumb: a base colour broken up by specks. `specks` are [colour, count, radius, alpha]. */
export function speckle(key: string, base: string, specks: [string, number, number, number][], size = 512) {
  return make(key, size, (g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    for (const [col, count, rad, alpha] of specks) {
      g.fillStyle = col;
      for (let i = 0; i < count; i++) {
        g.globalAlpha = alpha * (0.4 + Math.random() * 0.6);
        g.beginPath();
        g.ellipse(Math.random() * s, Math.random() * s, rad * (0.4 + Math.random()), rad * (0.4 + Math.random()), Math.random() * 3, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }, true);
}

/** Height noise for bump maps: open crumb, pores and lumps. */
export function crumbBump(key = "crumb", size = 512) {
  return make(`bump-${key}`, size, (g, s) => {
    g.fillStyle = "#808080";
    g.fillRect(0, 0, s, s);
    for (let i = 0; i < 2600; i++) {
      const dark = Math.random() > 0.45;
      g.fillStyle = dark ? "#000" : "#fff";
      g.globalAlpha = dark ? 0.1 + Math.random() * 0.25 : 0.08 + Math.random() * 0.2;
      const r = dark ? 1 + Math.random() * 5 : 2 + Math.random() * 9;
      g.beginPath();
      g.arc(Math.random() * s, Math.random() * s, r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }, false);
}

/** Vertical ribs: corrugated sleeve card and pleated paper. */
export function ribBump(ribs = 48, size = 256) {
  return make(`ribs-${ribs}`, size, (g, s) => {
    const grad = g.createLinearGradient(0, 0, s / ribs, 0);
    grad.addColorStop(0, "#555");
    grad.addColorStop(0.5, "#bbb");
    grad.addColorStop(1, "#555");
    for (let i = 0; i < ribs; i++) {
      g.save();
      g.translate((i * s) / ribs, 0);
      g.fillStyle = grad;
      g.fillRect(0, 0, s / ribs + 1, s);
      g.restore();
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
      g.globalAlpha = 0.06;
      g.fillRect(Math.random() * s, Math.random() * s, 1 + Math.random() * 2, 1 + Math.random() * 6);
    }
    g.globalAlpha = 1;
  }, false);
}
