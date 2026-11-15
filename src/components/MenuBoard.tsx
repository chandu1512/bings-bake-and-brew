"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { menuFor, money, type CategoryId, type MenuCategory, type MenuItem } from "@/lib/menu";
import { useBag, useMenuPhoto, useStore } from "./providers";
import StoreToggle from "./StoreToggle";
import OpenBadge from "./OpenBadge";
import { Stepper } from "./BagDrawer";
import { Plus } from "./icons";

const EASE = [0.23, 1, 0.32, 1] as const;

function AddControl({ item }: { item: MenuItem }) {
  const { add, qtyOf, lines, setQty, customize } = useBag();
  // Items with sizes, milks or flavors open the options sheet instead of adding straight away.
  const addOne = () => (item.groups?.length ? customize(item.id) : add(item.id));
  const qty = qtyOf(item.id);
  // The stepper edits the most recent line for this item.
  const line = [...lines].reverse().find((l) => l.id === item.id);

  return (
    <div className="relative flex h-11 items-center justify-end">
      <AnimatePresence mode="popLayout" initial={false}>
        {qty > 0 && line ? (
          <motion.div
            key="step"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
            transition={{ duration: 0.2, ease: EASE }}
          >
            <Stepper qty={qty} label={item.name} onChange={(n) => (n > qty ? addOne() : setQty(line.key, line.qty - 1))} />
          </motion.div>
        ) : (
          <motion.button
            key="add"
            type="button"
            onClick={addOne}
            aria-label={item.groups?.length ? `Choose options for ${item.name}` : `Add ${item.name} to your bag`}
            initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="btn btn-glass !min-h-[44px] !gap-1.5 !px-4 text-[0.95rem]"
          >
            <Plus size={16} /> Add
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function ItemCard({ item, index }: { item: MenuItem; index: number }) {
  const photo = useMenuPhoto();
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      // Only the first row or two cascade. Everything after arrives with them.
      transition={{ duration: 0.42, ease: EASE, delay: Math.min(index, 7) * 0.035 }}
      className="card zoom-frame flex gap-4 overflow-hidden p-3 sm:flex-col sm:gap-0 sm:p-0"
    >
      <div className="gloss relative h-[104px] w-[104px] shrink-0 overflow-hidden rounded-2xl bg-porcelain-deep sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none">
        <Image
          src={photo(item.id)}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 104px"
          className="zoom object-cover"
        />
        {item.tag && (
          <span
            className={`absolute left-2 top-2 z-10 rounded-full px-2.5 py-1 text-[0.72rem] font-bold tracking-wide sm:left-3 sm:top-3 ${
              item.tag === "New" ? "bg-cherry text-white" : "bg-white text-ink"
            }`}
          >
            {item.tag}
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col sm:p-4 sm:pt-3.5">
        <h3 className="text-[1.06rem]">{item.name}</h3>
        <p className="mt-1 line-clamp-2 text-[0.92rem] leading-snug text-ink-soft">{item.description}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="leading-tight">
            {item.price !== null ? (
              <>
                {item.groups?.some((g) => /size/i.test(g.name)) && <span className="mr-1 text-[0.82rem] text-ink-faint">from</span>}
                <span className="tnum text-[1.12rem] font-bold">{money(item.price)}</span>
                {item.listedSize && <span className="ml-1.5 text-[0.82rem] text-ink-faint">{item.listedSize.toLowerCase()}</span>}
              </>
            ) : (
              <span className="text-[0.92rem] font-semibold text-ink-soft">Ask at counter</span>
            )}
          </p>
          <AddControl item={item} />
        </div>
      </div>
    </motion.li>
  );
}

function Grid({ items }: { items: MenuItem[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, i) => (
        <ItemCard key={item.id} item={item} index={i} />
      ))}
    </ul>
  );
}

/**
 * One shop's menu with photos, prices and add-to-bag.
 * `tabs` shows one category at a time. `all` lists every category in full.
 */
export default function MenuBoard({ mode = "tabs", heading = "h2" }: { mode?: "tabs" | "all"; heading?: "h1" | "h2" }) {
  const { id, store } = useStore();
  const reduce = useReducedMotion();
  const cats = useMemo<MenuCategory[]>(() => menuFor(id), [id]);
  const [picked, setPicked] = useState<CategoryId>("espresso");
  const cat = cats.find((c) => c.id === picked) ?? cats[0];
  const H = heading;

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <H className="display-lg">
            The{" "}
            <span className="relative inline-block">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={id}
                  className="inline-block text-cherry"
                  initial={{ opacity: 0, y: reduce ? 0 : 14, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: reduce ? 0 : -10, filter: "blur(6px)", transition: { duration: 0.14 } }}
                  transition={{ duration: 0.32, ease: EASE }}
                >
                  {store.name}
                </motion.span>
              </AnimatePresence>
            </span>{" "}
            menu
          </H>
          <p className="lede mt-4">
            Choose your size, milk and flavor, pay right here, and pick it up.
          </p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <StoreToggle id={`board-${mode}`} className="w-full sm:w-[400px]" />
          <OpenBadge store={store} className="text-[0.95rem]" />
        </div>
      </div>

      {mode === "tabs" ? (
        <>
          <div className="-mx-5 mt-8 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
            <div role="tablist" aria-label="Menu sections" className="inline-flex gap-1 rounded-full bg-ink/[0.06] p-1">
              {cats.map((c) => {
                const on = c.id === cat.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setPicked(c.id)}
                    className={`relative min-h-[44px] whitespace-nowrap rounded-full px-4 text-[0.95rem] font-semibold transition-colors duration-200 ${
                      on ? "text-white" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId="menu-tab"
                        transition={reduce ? { duration: 0 } : { type: "spring", duration: 0.45, bounce: 0.16 }}
                        className="absolute inset-0 rounded-full bg-gradient-to-b from-[#3a2a24] to-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                      />
                    )}
                    <span className="relative">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${id}-${cat.id}`}
              role="tabpanel"
              aria-label={cat.name}
              exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.14 } }}
              className="mt-6"
            >
              <p className="mb-5 text-ink-soft">{cat.blurb}</p>
              <Grid items={cat.items} />
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        <>
          <nav
            aria-label="Menu sections"
            className="sticky top-[76px] z-30 -mx-5 mt-8 overflow-x-auto px-5 py-2 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden"
          >
            <div className="glass inline-flex gap-1 rounded-full p-1">
              {cats.map((c) => (
                <a
                  key={c.id}
                  href={`#${c.id}`}
                  className="grid min-h-[44px] place-items-center whitespace-nowrap rounded-full px-4 text-[0.95rem] font-semibold text-ink-soft transition-colors duration-200 hover:bg-ink/[0.06] hover:text-ink active:bg-ink/10"
                >
                  {c.name}
                </a>
              ))}
            </div>
          </nav>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={id} exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.14 } }}>
              {cats.map((c) => (
                <section key={c.id} id={c.id} aria-labelledby={`${c.id}-h`} className="pt-12 md:pt-16">
                  <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between md:gap-8">
                    <h2 id={`${c.id}-h`} className="display-md">{c.name}</h2>
                    <p className="text-ink-soft">{c.blurb}</p>
                  </div>
                  <Grid items={c.items} />
                </section>
              ))}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
