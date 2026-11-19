/**
 * Browser checks for the site's videos. Client-side only (call after mount).
 */

/**
 * True for Apple's WebKit engine: Safari on Mac, and every browser on iPhone and
 * iPad (Chrome, Firefox and Edge on iOS all use WebKit). WebKit can play VP9 WebM
 * but ignores its transparency, so it must never be handed the WebM chef.
 */
export function isWebKit() {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  const macSafari = /Safari\//.test(ua) && !/(Chrome|Chromium|Edg|OPR|Firefox)\//.test(ua);
  return iOS || macSafari;
}

/**
 * Which transparent chef format this browser should get:
 *   webm  VP9 with alpha (Chrome, Firefox, Edge on desktop and Android)
 *   hevc  HEVC with alpha in .mov (Safari / WebKit that can decode it)
 *   webp  animated WebP with alpha (WebKit that can't, e.g. older iPads)
 */
export type ChefFormat = "webm" | "hevc" | "webp";
export function chefFormat(): ChefFormat {
  if (!isWebKit()) return "webm";
  const probe = document.createElement("video");
  return probe.canPlayType('video/mp4; codecs="hvc1"') || probe.canPlayType('video/quicktime; codecs="hvc1"') ? "hevc" : "webp";
}

/**
 * Make a muted inline autoplay that iOS will allow. React does not reliably
 * render the `muted` attribute, and Safari decides on the attributes, so set
 * them on the element itself before calling play().
 */
export function prepareInlineVideo(v: HTMLVideoElement) {
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.setAttribute("muted", "");
  v.setAttribute("playsinline", "");
  v.setAttribute("webkit-playsinline", "");
}
