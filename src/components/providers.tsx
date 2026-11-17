"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DEFAULT_STORE, STORES, isStoreId, type Store, type StoreId } from "@/lib/site";
import { menuPhoto } from "@/lib/menu-photos";

/* ----------------------------- which shop ----------------------------- */

type StoreCtx = {
  id: StoreId;
  store: Store;
  setStore: (id: StoreId) => void;
  /** True once the visitor has picked a shop (now or on an earlier visit), not just the default. */
  chosen: boolean;
  /** True after the first-load choice (link, page, remembered shop) has been applied. */
  ready: boolean;
};
const StoreContext = createContext<StoreCtx | null>(null);

const STORE_KEY = "bings.store";

/** The shop named by a store page's address, e.g. /menu/elkton/. */
export function storeFromPath(pathname: string | null): StoreId | null {
  const m = pathname?.match(/^\/menu\/(amstel|elkton)(\/|$)/);
  return m ? (m[1] as StoreId) : null;
}

function writeUrl(id: StoreId) {
  // Store pages carry the shop in the path; no ?store= needed there.
  if (storeFromPath(window.location.pathname)) return;
  const url = new URL(window.location.href);
  if (url.searchParams.get("store") === id) return;
  url.searchParams.set("store", id);
  window.history.replaceState(window.history.state, "", url);
}

const PhotoContext = createContext<Set<string>>(new Set());

/** `localPhotos` lists the item ids that have a real photo in public/menu. */
export function Providers({ children, localPhotos }: { children: React.ReactNode; localPhotos: string[] }) {
  const [id, setId] = useState<StoreId>(DEFAULT_STORE);
  const [ready, setReady] = useState(false);
  const [chosen, setChosen] = useState(false);
  const photoSet = useMemo(() => new Set(localPhotos), [localPhotos]);
  const pathname = usePathname();
  const router = useRouter();

  // First load: a store page's address wins, then ?store=, then the remembered shop, then the default.
  useEffect(() => {
    const fromPath = storeFromPath(window.location.pathname);
    const fromUrl = new URLSearchParams(window.location.search).get("store");
    let pick: StoreId = DEFAULT_STORE;
    let picked = false;
    try {
      const saved = window.localStorage.getItem(STORE_KEY);
      if (isStoreId(saved)) [pick, picked] = [saved, true];
    } catch {}
    if (isStoreId(fromUrl)) [pick, picked] = [fromUrl, true];
    if (fromPath) [pick, picked] = [fromPath, true];
    setChosen(picked);
    setId(pick);
    setReady(true);
  }, []);

  // Keep ?store= on the address as the visitor moves between pages.
  useEffect(() => {
    if (ready) writeUrl(id);
  }, [pathname, id, ready]);

  // Moving to another store page (link, back button) makes that shop the selected one.
  useEffect(() => {
    const fromPath = storeFromPath(pathname);
    if (ready && fromPath) {
      setId(fromPath);
      setChosen(true);
      try {
        window.localStorage.setItem(STORE_KEY, fromPath);
      } catch {}
    }
  }, [pathname, ready]);

  const setStore = useCallback(
    (next: StoreId) => {
      setId(next);
      setChosen(true);
      try {
        window.localStorage.setItem(STORE_KEY, next);
      } catch {}
      // On a store's menu page, switching shop opens the other shop's menu.
      const onStorePage = storeFromPath(window.location.pathname);
      if (onStorePage && onStorePage !== next) router.push(`/menu/${next}/`);
    },
    [router],
  );

  const storeValue = useMemo(() => ({ id, store: STORES[id], setStore, chosen, ready }), [id, setStore, chosen, ready]);

  return (
    <StoreContext.Provider value={storeValue}>
      <PhotoContext.Provider value={photoSet}>{children}</PhotoContext.Provider>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <Providers>");
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
  return useCallback((id: string) => menuPhoto(id, local.has(id)), [local]);
}
