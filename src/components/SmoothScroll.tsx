"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Lock or unlock page scrolling while a sheet (bag, menu, drink builder) is open.
 * The page uses the browser's own native scrolling everywhere; nothing hijacks it.
 */
export function lockScroll(lock: boolean) {
  document.documentElement.style.overflow = lock ? "hidden" : "";
}

/** On a new page, start at the top. */
export default function ScrollToTop() {
  const pathname = usePathname();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
