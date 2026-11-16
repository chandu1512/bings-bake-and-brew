"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { DEFAULT_STORE, STORES, isStoreId, type Store, type StoreId } from "@/lib/site";
import { itemById } from "@/lib/menu";
import { defaultChoices, priceLine } from "@/lib/pricing";
import { menuPhoto } from "@/lib/menu-photos";

/* ----------------------------- which shop ----------------------------- */

type StoreCtx = { id: StoreId; store: Store; setStore: (id: StoreId) => void };
const StoreContext = createContext<StoreCtx | null>(null);

const STORE_KEY = "bings.store";
const BAG_KEY = "bings.bags.v2";

function writeUrl(id: StoreId) {
  const url = new URL(window.location.href);
  if (url.searchParams.get("store") === id) return;
  url.searchParams.set("store", id);
  window.history.replaceState(window.history.state, "", url);
}

/* ------------------------------- the bag ------------------------------ */

export type BagLine = { key: string; id: string; qty: number; choices: Record<string, string[]>; note?: string };
type Bags = Record<StoreId, BagLine[]>;

type BagCtx = {
  lines: BagLine[];
  count: number;
  /** Sum of every line that can be priced, in dollars (before tax). */
  total: number;
  /** True when a line can't be priced online (counter-only item). */
  hasUnpriced: boolean;
  /** The item whose options sheet is open, or null. */
  customizing: string | null;
  customize: (id: string | null) => void;
  /** The bag line being edited in the options sheet, or null when adding a new one. */
  editing: BagLine | null;
  /** Reopen a bag line in the options sheet with its current choices. */
  editLine: (key: string) => void;
  /** Replace a bag line with new choices; merges into an identical line if one exists. */
  replace: (key: string, choices: Record<string, string[]>, note: string | undefined, qty: number) => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  /** Add one. Without choices, required groups take their first option. */
  add: (id: string, choices?: Record<string, string[]>, note?: string, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  qtyOf: (id: string) => number;
  clear: () => void;
};
const BagContext = createContext<BagCtx | null>(null);

const lineKey = (id: string, choices: Record<string, string[]>, note?: string) =>
  `${id}|${Object.keys(choices)
    .sort()
    .map((g) => `${g}:${[...choices[g]].sort().join(",")}`)
    .join(";")}|${note ?? ""}`;

const PhotoContext = createContext<Set<string>>(new Set());

/** `localPhotos` lists the item ids that have a real photo in public/menu. */
export function Providers({ children, localPhotos }: { children: React.ReactNode; localPhotos: string[] }) {
  const [id, setId] = useState<StoreId>(DEFAULT_STORE);
  const [bags, setBags] = useState<Bags>({ amstel: [], elkton: [] });
  const [isOpen, setOpen] = useState(false);
  const [customizing, setCustomizing] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const customize = useCallback((itemId: string | null) => {
    setCustomizing(itemId);
    setEditingKey(null);
  }, []);
  const [ready, setReady] = useState(false);
  const photoSet = useMemo(() => new Set(localPhotos), [localPhotos]);
  const pathname = usePathname();

  // First load: the link wins, then the remembered shop, then the default.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("store");
    let chosen: StoreId = DEFAULT_STORE;
    if (isStoreId(fromUrl)) chosen = fromUrl;
    else {
      try {
        const saved = window.localStorage.getItem(STORE_KEY);
        if (isStoreId(saved)) chosen = saved;
      } catch {}
    }
    try {
      const raw = window.localStorage.getItem(BAG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Bags>;
        const clean = (l: unknown): BagLine[] =>
          Array.isArray(l) ? l.filter((x) => x && itemById(x.id) && x.qty > 0 && x.choices) : [];
        setBags({ amstel: clean(parsed.amstel), elkton: clean(parsed.elkton) });
      }
    } catch {}
    setId(chosen);
    setReady(true);
  }, []);

  // Keep ?store= on the address as the visitor moves between pages.
  useEffect(() => {
    if (ready) writeUrl(id);
  }, [pathname, id, ready]);

  // html[data-store] picks the hero still in CSS (see the head script in layout.tsx).
  useEffect(() => {
    if (ready) document.documentElement.dataset.store = id;
  }, [id, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(BAG_KEY, JSON.stringify(bags));
    } catch {}
  }, [bags, ready]);

  const setStore = useCallback((next: StoreId) => {
    setId(next);
    try {
      window.localStorage.setItem(STORE_KEY, next);
    } catch {}
  }, []);

  const edit = useCallback(
    (fn: (lines: BagLine[]) => BagLine[]) => setBags((b) => ({ ...b, [id]: fn(b[id]) })),
    [id],
  );

  const bag = useMemo<BagCtx>(() => {
    const lines = bags[id];
    let total = 0;
    let hasUnpriced = false;
    for (const l of lines) {
      try {
        total += priceLine(id, l).totalCents / 100;
      } catch {
        hasUnpriced = true;
      }
    }
    return {
      lines,
      total,
      hasUnpriced,
      count: lines.reduce((n, l) => n + l.qty, 0),
      isOpen,
      customizing,
      customize,
      editing: (editingKey && lines.find((l) => l.key === editingKey)) || null,
      editLine: (key) => {
        const line = lines.find((l) => l.key === key);
        if (!line) return;
        setCustomizing(line.id);
        setEditingKey(key);
      },
      replace: (oldKey, choices, note, qty) => {
        const at = bags[id].findIndex((l) => l.key === oldKey);
        if (at < 0) return;
        const itemId = bags[id][at].id;
        const key = lineKey(itemId, choices, note);
        edit((ls) => {
          const rest = ls.filter((l) => l.key !== oldKey);
          const same = rest.findIndex((l) => l.key === key);
          if (same >= 0) return rest.map((l, i) => (i === same ? { ...l, qty: l.qty + qty } : l));
          const next = [...rest];
          next.splice(Math.min(at, next.length), 0, { key, id: itemId, qty, choices, note });
          return next;
        });
      },
      open: () => setOpen(true),
      close: () => setOpen(false),
      add: (itemId, choices, note, qty = 1) => {
        const item = itemById(itemId);
        if (!item) return;
        const ch = choices ?? defaultChoices(item);
        const key = lineKey(itemId, ch, note);
        edit((ls) =>
          ls.some((l) => l.key === key)
            ? ls.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
            : [...ls, { key, id: itemId, qty, choices: ch, note }],
        );
      },
      setQty: (key, qty) =>
        edit((ls) => (qty <= 0 ? ls.filter((l) => l.key !== key) : ls.map((l) => (l.key === key ? { ...l, qty } : l)))),
      qtyOf: (itemId) => lines.filter((l) => l.id === itemId).reduce((n, l) => n + l.qty, 0),
      clear: () => edit(() => []),
    };
  }, [bags, id, isOpen, customizing, customize, editingKey, edit]);

  const storeValue = useMemo(() => ({ id, store: STORES[id], setStore }), [id, setStore]);

  return (
    <StoreContext.Provider value={storeValue}>
      <BagContext.Provider value={bag}>
        <PhotoContext.Provider value={photoSet}>{children}</PhotoContext.Provider>
      </BagContext.Provider>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <Providers>");
  return ctx;
}

export function useBag() {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error("useBag must be used inside <Providers>");
  return ctx;
}

/** The current time, refreshed every 30 seconds. null until the page has mounted. */
export function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** Photo URL for a menu item: the owner's local file if there is one, else the stand-in. */
export function useMenuPhoto() {
  const local = useContext(PhotoContext);
  return useCallback((id: string, w?: number, h?: number) => menuPhoto(id, local.has(id), w, h), [local]);
}
