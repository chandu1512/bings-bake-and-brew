import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Order } from "../order-types";
import type { StoreId } from "../site";

/**
 * Order storage: one JSON file per order under data/orders/.
 *
 * Fine for a single server (a VPS, `next start` on a box in the shop). On
 * serverless hosts like Vercel the disk is not kept between requests, so
 * swap these four functions for a database (Vercel Postgres, Supabase, Upstash)
 * before deploying there. Nothing else in the app touches storage directly.
 */
const DIR = path.join(process.cwd(), "data", "orders");

async function ensureDir() {
  await fs.mkdir(DIR, { recursive: true });
}

const file = (id: string) => {
  if (!/^[a-z0-9-]+$/i.test(id)) throw new Error("bad order id");
  return path.join(DIR, `${id}.json`);
};

export async function saveOrder(order: Order) {
  await ensureDir();
  const tmp = `${file(order.id)}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(order, null, 2));
  await fs.rename(tmp, file(order.id));
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    return JSON.parse(await fs.readFile(file(id), "utf8")) as Order;
  } catch {
    return null;
  }
}

export async function listOrders(store?: StoreId, sinceHours = 36): Promise<Order[]> {
  await ensureDir();
  const since = Date.now() - sinceHours * 3600_000;
  const names = (await fs.readdir(DIR)).filter((f) => f.endsWith(".json"));
  const orders = await Promise.all(names.map((n) => getOrder(n.replace(/\.json$/, ""))));
  return orders
    .filter((o): o is Order => !!o && Date.parse(o.createdAt) >= since && (!store || o.store === store))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function newOrderIds(store: StoreId) {
  const id = randomUUID();
  const n = 1000 + (parseInt(id.replace(/-/g, "").slice(0, 6), 16) % 9000);
  return { id, code: `${store === "amstel" ? "A" : "E"}-${n}` };
}
