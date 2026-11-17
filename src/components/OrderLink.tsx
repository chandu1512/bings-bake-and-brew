"use client";

import { STORES, type StoreId } from "@/lib/site";
import { useStore } from "./providers";
import { ArrowUpRight } from "./icons";

/**
 * Every Order button on the site. Opens a shop's Toast online ordering page
 * (`toastOrderUrl` in src/lib/site.ts) in a new tab. Without `store` it follows
 * the shop selected in the header.
 */
export default function OrderLink({
  store,
  children = "Order pickup",
  className = "btn btn-cherry",
  icon = true,
}: {
  store?: StoreId;
  children?: React.ReactNode;
  className?: string;
  icon?: boolean;
}) {
  const selected = useStore();
  const s = STORES[store ?? selected.id];
  return (
    <a
      href={s.toastOrderUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={`${typeof children === "string" ? children : "Order"} from ${s.name} on Toast (opens in a new tab)`}
    >
      {children}
      {icon && <ArrowUpRight className="nudge" />}
    </a>
  );
}
