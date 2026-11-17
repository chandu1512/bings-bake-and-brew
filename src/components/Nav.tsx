"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { NAV, SHOP_NAME } from "@/lib/site";
import { useStore } from "./providers";
import OrderLink from "./OrderLink";
import StoreToggle from "./StoreToggle";
import OpenBadge from "./OpenBadge";
import { Close, MenuIcon } from "./icons";
import { lockScroll } from "./SmoothScroll";

export default function Nav() {
  const pathname = usePathname();
  const { store } = useStore();
  const [menu, setMenu] = useState(false);
  const reduce = useReducedMotion();

  // The header stays light on every page so the color logo always reads clearly.
  const dark = false;

  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    lockScroll(menu);
    return () => lockScroll(false);
  }, [menu]);

  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-2 z-[70] -translate-y-20 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
        <div className={`glass ${dark ? "glass-dark" : ""} mx-auto flex h-[60px] max-w-[1240px] items-center gap-3 rounded-full pl-5 pr-2`}>
          <Link href="/" aria-label="Bing's Bake & Brew, home" className="mr-auto block shrink-0 lg:mr-5">
            <Image
              src="/brand/logo-color.png"
              alt="Bing's Bake & Brew"
              width={282}
              height={143}
              priority
              className="h-[42px] w-auto"
            />
          </Link>

          <nav aria-label="Main" className="mr-auto hidden items-center gap-1 lg:flex">
            {NAV.map((n) => {
              const on = (pathname ?? "").replace(/\/$/, "") === n.href.replace(/\/$/, "");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={`relative rounded-full px-3.5 py-2 text-[0.95rem] font-medium transition-colors duration-200 ${
                    dark ? `hover:text-white ${on ? "text-white" : "text-white/75"}` : `hover:text-ink ${on ? "text-ink" : "text-ink-soft"}`
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="nav-on"
                      transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.45, bounce: 0.15 }}
                      className={`absolute inset-0 rounded-full ${dark ? "bg-white/[0.12]" : "bg-ink/[0.07]"}`}
                    />
                  )}
                  <span className="relative">{n.label}</span>
                </Link>
              );
            })}
          </nav>

          <OpenBadge store={store} tone={dark ? "dark" : "light"} showHours className="hidden text-sm xl:inline-flex" />
          <StoreToggle id="nav" size="sm" tone={dark ? "dark" : "light"} className="hidden md:grid" />

          <OrderLink className="btn btn-cherry !min-h-[42px] !px-4 text-sm">Order</OrderLink>

          <button
            type="button"
            onClick={() => setMenu(true)}
            aria-label="Open the menu"
            aria-expanded={menu}
            className="grid h-[42px] w-[42px] place-items-center rounded-full transition-transform duration-150 ease-out active:scale-95 lg:hidden"
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.16 } }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] flex h-[100dvh] flex-col bg-espresso px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] text-white lg:hidden"
          >
            <div className="flex items-center justify-between">
              <Image src="/brand/bings-bake-n-brew-coffee-logo.png" alt={SHOP_NAME} width={282} height={134} className="h-[52px] w-auto" />
              <button
                type="button"
                onClick={() => setMenu(false)}
                aria-label="Close the menu"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10 active:scale-95"
              >
                <Close />
              </button>
            </div>
            <nav aria-label="Main" className="mt-10 flex flex-col">
              {[{ href: "/", label: "Home" }, ...NAV].map((n, i) => (
                <motion.div
                  key={n.href}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0.04 + i * 0.035 }}
                >
                  <Link
                    href={n.href}
                    onClick={() => setMenu(false)}
                    className="block border-b border-white/10 py-4 font-display text-[2rem] leading-none active:text-butter"
                  >
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-auto space-y-4">
              <StoreToggle id="sheet" tone="dark" />
              <OpenBadge store={store} tone="dark" showHours />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
