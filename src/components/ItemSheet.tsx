"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { itemById, money, type MenuItem, type Option, type OptionGroup } from "@/lib/menu";
import { choiceError, defaultChoices } from "@/lib/pricing";
import { useBag, useMenuPhoto, useStore } from "./providers";
import { Stepper } from "./BagDrawer";
import { Check, Close } from "./icons";
import { lockScroll } from "./SmoothScroll";
import type { DrinkLook } from "./three/DrinkCup";

const BuilderCup = dynamic(() => import("./three/BuilderCup"), { ssr: false });

const EASE = [0.32, 0.72, 0, 1] as const;

/* ---------- What each choice looks like in the cup ---------- */

type Kind = "size" | "milk" | "flavor" | "shot" | "other";
const kindOf = (g: OptionGroup): Kind =>
  /size/i.test(g.name) ? "size" : /milk|dairy/i.test(g.name) ? "milk" : /flavou?r|syrup/i.test(g.name) ? "flavor" : /shot|espresso/i.test(g.name) ? "shot" : "other";

const pick = (table: [RegExp, string][], name: string, fallback: string) => table.find(([re]) => re.test(name))?.[1] ?? fallback;

const MILKS: [RegExp, string][] = [
  [/oat/i, "#c9a06c"],
  [/almond/i, "#e6d5ba"],
  [/soy/i, "#dcc59c"],
  [/coconut/i, "#eee0c8"],
  [/whole|2%|skim|non-?fat|half|cream|milk/i, "#dab58a"],
];
const milkColor = (name: string) => pick(MILKS, name, "#dab58a");

const SYRUPS: [RegExp, string][] = [
  [/salted brown|brown sugar/i, "#a5642a"],
  [/salted caramel/i, "#c17a24"],
  [/caramel/i, "#dd9226"],
  [/raspberry/i, "#e0457a"],
  [/lavender/i, "#a98bd6"],
  [/white (mocha|choc)/i, "#f3e6cf"],
  [/mocha|chocolate/i, "#4a2a1a"],
  [/french vanilla/i, "#f2d992"],
  [/vanilla/i, "#f4e3b2"],
  [/hazelnut/i, "#9a6a3c"],
  [/coconut/i, "#f3ecdf"],
  [/marsh/i, "#f7dfe6"],
  [/almond/i, "#d9b98c"],
  [/banana/i, "#ecd35b"],
  [/apple/i, "#9bc53d"],
  [/pepper|mint/i, "#86d6b1"],
  [/cherry/i, "#b3203a"],
  [/strawberry/i, "#ef6b80"],
  [/maple/i, "#b5672a"],
  [/toffee|butter/i, "#c98b3c"],
  [/pumpkin/i, "#e07f2e"],
  [/cinnamon/i, "#b5651d"],
  [/blackberry/i, "#5b2a5e"],
  [/blueberry/i, "#5a67c9"],
  [/peach/i, "#f5a56b"],
  [/honey/i, "#e3a72f"],
  [/irish/i, "#8ba870"],
];
const syrupColor = (name: string) => pick(SYRUPS, name, "#c9a15a");

const BASES: [RegExp, string][] = [
  [/matcha|green tea/i, "#8fae5a"],
  [/chai/i, "#b98350"],
  [/white mocha/i, "#c9a47c"],
  [/mocha|chocolate/i, "#5a3220"],
  [/tea/i, "#a85d24"],
  [/cold brew|americano|drip|coffee/i, "#4a2a18"],
];

function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

function lookFor(item: MenuItem, choices: Record<string, string[]>): DrinkLook {
  const picked = (k: Kind) =>
    (item.groups ?? []).filter((g) => kindOf(g) === k).flatMap((g) => g.options.filter((o) => choices[g.id]?.includes(o.id)));
  const sizeGroup = (item.groups ?? []).find((g) => kindOf(g) === "size");
  const sizeIdx = sizeGroup ? sizeGroup.options.findIndex((o) => choices[sizeGroup.id]?.includes(o.id)) : -1;
  const size = sizeGroup && sizeGroup.options.length > 1 && sizeIdx >= 0 ? sizeIdx / (sizeGroup.options.length - 1) : 0.5;
  const milk = picked("milk")[0];
  const base = pick(BASES, item.name, "#8a5a36");
  const shots = picked("shot").reduce((n, o) => n + (/triple|3/i.test(o.name) ? 3 : /double|2/i.test(o.name) ? 2 : 1), 0);
  return {
    kind: item.id.includes("-frozen-") ? "frozen" : item.id.includes("-ice-") ? "iced" : "hot",
    liquid: mix(base, milk ? milkColor(milk.name) : "#dab58a", milk ? 0.72 : 0.5),
    flavors: picked("flavor").map((o) => syrupColor(o.name)),
    shots,
    size,
  };
}

function unitPrice(item: MenuItem, choices: Record<string, string[]>) {
  let p = item.base ?? item.price ?? 0;
  for (const g of item.groups ?? []) for (const o of g.options) if (choices[g.id]?.includes(o.id)) p += o.price;
  return p;
}

function canRender3D() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/* ---------- Tiles ---------- */

/** A little takeaway cup, taller for each size up. */
function CupGlyph({ step, of, on }: { step: number; of: number; on: boolean }) {
  const h = 20 + (of > 1 ? (step / (of - 1)) * 18 : 9);
  const w = 17 + (of > 1 ? (step / (of - 1)) * 7 : 3);
  return (
    <svg width="40" height="46" viewBox="0 0 40 46" aria-hidden className="mx-auto">
      <g transform={`translate(20 ${44 - h})`} fill="none" strokeLinejoin="round" strokeWidth="1.6" stroke={on ? "#ECD59C" : "#7A1F2B"}>
        <path d={`M${-w / 2} 3 L${-w / 2 + 3} ${h} H${w / 2 - 3} L${w / 2} 3 Z`} fill={on ? "rgba(236,213,156,0.18)" : "rgba(122,31,43,0.08)"} />
        <path d={`M${-w / 2 - 1.5} 3 H${w / 2 + 1.5} M${-w / 2 + 2} 0.6 H${w / 2 - 2}`} strokeLinecap="round" />
        <path d={`M${-w / 2 + 1.2} ${h * 0.42} H${w / 2 - 1.2} M${-w / 2 + 2} ${h * 0.72} H${w / 2 - 2}`} opacity="0.55" />
      </g>
    </svg>
  );
}

function Tile({ o, kind, index, count, on, onClick, single }: { o: Option; kind: Kind; index: number; count: number; on: boolean; onClick: () => void; single: boolean }) {
  const tall = kind === "size" || kind === "milk";
  const swatch = kind === "milk" ? milkColor(o.name) : kind === "flavor" ? syrupColor(o.name) : kind === "shot" ? "#2a1408" : null;
  return (
    <button
      type="button"
      role={single ? "radio" : "checkbox"}
      aria-checked={on}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[18px] border text-[0.95rem] transition-[border-color,background-color,transform,box-shadow] duration-200 ease-out active:scale-[0.96] ${
        on
          ? "border-gold bg-espresso text-white shadow-[inset_0_0_0_1px_rgba(201,161,90,0.6),0_14px_26px_-16px_rgba(26,16,12,0.8)]"
          : "border-ink/15 bg-porcelain-light text-ink hover:border-gold-deep"
      } ${tall ? "flex min-h-[104px] flex-col items-center justify-end gap-1 px-2 pb-3 pt-3 text-center" : "flex min-h-[52px] items-center gap-2.5 px-3 py-2 text-left"}`}
    >
      {kind === "size" && <CupGlyph step={index} of={count} on={on} />}
      {swatch && (
        <span
          aria-hidden
          className={`shrink-0 rounded-full shadow-[inset_0_2px_3px_rgba(255,255,255,0.55),inset_0_-3px_5px_rgba(0,0,0,0.22),0_0_0_1px_rgba(26,16,12,0.18)] ${
            kind === "milk" ? "h-9 w-9" : "h-[18px] w-[18px]"
          } ${on ? "ring-2 ring-gold ring-offset-2 ring-offset-espresso" : ""}`}
          style={{ background: swatch }}
        />
      )}
      {kind === "other" && (
        <span aria-hidden className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border ${on ? "border-gold bg-gold text-espresso" : "border-ink/30"}`}>
          {on && <Check size={12} />}
        </span>
      )}
      <span className={tall ? "" : "min-w-0 flex-1"}>
        <span className="block font-semibold leading-tight">{o.name}</span>
        {o.price > 0 && (
          <span className={`tnum block text-[0.82rem] ${on ? "text-gold-light" : "text-ink-faint"}`}>
            {kind === "size" ? money(o.price) : `+${money(o.price)}`}
          </span>
        )}
      </span>
    </button>
  );
}

function Group({ group, picked, onPick, food }: { group: OptionGroup; picked: string[]; onPick: (ids: string[]) => void; food: boolean }) {
  // Food choices (bagel, bread, cookie) are plain tiles; only drinks get cup, milk and syrup tiles.
  const kind = food ? "other" : kindOf(group);
  const single = group.max === 1;
  const required = group.min > 0;
  const grid =
    kind === "size" ? "grid grid-cols-3 gap-2.5" : kind === "milk" ? "grid grid-cols-3 gap-2.5 sm:grid-cols-4" : "grid grid-cols-2 gap-2 sm:grid-cols-3";
  return (
    <fieldset className="border-t border-gold-deep/25 py-5 first:border-t-0">
      <legend className="flex w-full items-baseline justify-between gap-3">
        <span className="font-display text-[1.3rem]">{group.name}</span>
        <span className={`text-[0.82rem] font-semibold ${required ? "text-cherry" : "text-ink-faint"}`}>
          {required ? "Required" : single ? "Optional" : `Up to ${group.max}`}
        </span>
      </legend>
      <div className={`mt-1 ${grid}`}>
        {group.options.map((o, i) => {
          const on = picked.includes(o.id);
          return (
            <Tile
              key={o.id}
              o={o}
              kind={kind}
              index={i}
              count={group.options.length}
              on={on}
              single={single}
              onClick={() => {
                if (single) onPick(on && !required ? [] : [o.id]);
                else onPick(on ? picked.filter((x) => x !== o.id) : picked.length < group.max ? [...picked, o.id] : picked);
              }}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

/** The price rolls to its new value whenever a choice changes it. */
function Ticker({ value, className = "" }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={`tnum relative inline-flex overflow-hidden ${className}`} aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={reduce ? false : { y: "70%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: "-70%", opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        >
          {money(value)}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** The drink builder: a live 3D cup that changes as you choose. Bottom sheet on phones, wide modal on desktop. */
export default function ItemSheet() {
  const { customizing, customize, add, editing, replace, open: openBag } = useBag();
  const { store } = useStore();
  const photo = useMenuPhoto();
  const reduce = useReducedMotion();
  const item = customizing ? itemById(customizing) : undefined;
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [env, setEnv] = useState({ three: false, desktop: false });
  const closeRef = useRef<HTMLButtonElement>(null);

  // Fresh defaults for a new item; the line's own choices when editing one from the bag.
  const editKey = editing?.key ?? null;
  useEffect(() => {
    if (!item) return;
    setChoices(editing ? structuredClone(editing.choices) : defaultChoices(item));
    setQty(editing?.qty ?? 1);
    setNote(editing?.note ?? "");
    setTried(false);
    setEnv({ three: canRender3D(), desktop: window.matchMedia("(min-width: 1024px)").matches });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the item or the edited line changes
  }, [item, editKey]);

  useEffect(() => {
    lockScroll(!!item);
    if (!item) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && customize(null);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [item, customize]);

  const error = useMemo(() => (item ? choiceError(item, choices) : null), [item, choices]);
  const each = item ? unitPrice(item, choices) : 0;
  const food = !!item && /-(savory|bakery)-/.test(item.id);
  const isDrink = !food && !!item?.groups?.some((g) => ["size", "milk", "flavor", "shot"].includes(kindOf(g)));
  const look = useMemo(() => (item && isDrink ? lookFor(item, choices) : null), [item, isDrink, choices]);
  const summary = item
    ? (item.groups ?? []).flatMap((g) => g.options.filter((o) => choices[g.id]?.includes(o.id)).map((o) => o.name)).join(" · ")
    : "";
  const live = !!look && env.three && !reduce;

  const submit = () => {
    if (!item) return;
    setTried(true);
    if (error) return;
    if (editing) {
      replace(editing.key, choices, note.trim() || undefined, qty);
      customize(null);
      openBag();
      return;
    }
    add(item.id, choices, note.trim() || undefined, qty);
    customize(null);
  };

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center lg:items-center lg:p-6" role="dialog" aria-modal="true" aria-label={`Choose options for ${item.name}`}>
          <motion.button
            type="button"
            tabIndex={-1}
            aria-label="Close"
            onClick={() => customize(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 h-full w-full cursor-default bg-espresso/70 backdrop-blur-[3px]"
          />
          <motion.div
            initial={reduce ? { opacity: 0 } : { y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: "100%", opacity: 0.6, transition: { duration: 0.22, ease: EASE } }}
            transition={{ duration: 0.45, ease: EASE }}
            className="relative flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-porcelain shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(201,161,90,0.45)] lg:h-[min(740px,92dvh)] lg:max-w-[1040px] lg:flex-row lg:rounded-[30px]"
          >
            {/* The stage: the cup, the name, the running price */}
            <div className="hero-band relative h-[178px] shrink-0 overflow-hidden text-white lg:h-auto lg:w-[42%] lg:border-b-0">
              <div className={`absolute inset-y-0 right-0 w-[46%] lg:inset-x-0 lg:w-auto ${live ? "lg:bottom-16 lg:top-24" : "lg:bottom-[110px] lg:top-[270px]"}`}>
                {live ? (
                  <BuilderCup look={look!} filmic={env.desktop} />
                ) : (
                  <div className="gloss absolute inset-3 overflow-hidden rounded-[20px] shadow-[0_24px_50px_-20px_rgba(0,0,0,0.9)] lg:inset-x-8 lg:inset-y-2 lg:rounded-[24px]">
                    <Image src={photo(item.id)} alt={item.name} fill sizes="(min-width: 1024px) 440px, 50vw" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-espresso/55 via-transparent to-gold/10" />
                  </div>
                )}
              </div>
              <div className="relative z-[1] flex h-full flex-col justify-center p-5 pr-[46%] lg:justify-between lg:p-8 lg:pr-8">
                <div>
                  <p className="script foil-text text-[1.5rem] lg:text-[1.9rem]">{isDrink ? "Made your way" : "Your pick"}</p>
                  <h2 className="mt-1 text-[1.7rem] leading-[1.02] lg:text-[2.5rem]">{item.name}</h2>
                  {item.description && <p className="mt-2 hidden max-w-[32ch] text-[0.95rem] text-white/70 lg:block">{item.description}</p>}
                </div>
                <div className="mt-2 lg:mt-0">
                  <Ticker value={each} className="text-[#E3C27F] font-display text-[1.9rem] leading-none lg:text-[2.6rem]" />
                  {summary && <p className="mt-1 line-clamp-2 text-[0.82rem] leading-snug text-white/70 lg:text-[0.95rem]">{summary}</p>}
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 lg:px-8 lg:pt-16">
                {(item.groups ?? []).map((g) => (
                  <Group key={g.id} group={g} food={!isDrink} picked={choices[g.id] ?? []} onPick={(ids) => setChoices((c) => ({ ...c, [g.id]: ids }))} />
                ))}
                <label className="block border-t border-gold-deep/25 py-5">
                  <span className="font-display text-[1.3rem]">Anything else?</span>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 140))}
                    rows={2}
                    placeholder={isDrink ? "Extra hot, light ice, no whip…" : "Toasted, cut in half, warmed up…"}
                    className="mt-3 w-full resize-none rounded-2xl border border-ink/15 bg-porcelain-light px-4 py-3 text-[16px] outline-none focus:border-gold-deep"
                  />
                </label>
              </div>

              {tried && error && (
                <p role="alert" className="bg-cherry px-6 py-2 text-center text-[0.9rem] font-semibold text-white">
                  {error}
                </p>
              )}
              <footer className="flex items-center gap-3 border-t border-gold-deep/30 bg-porcelain-light px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 lg:px-8">
                <Stepper qty={qty} onChange={(n) => setQty(Math.max(1, Math.min(20, n)))} label={item.name} />
                <button type="button" onClick={submit} className="btn btn-gold flex-1 justify-between">
                  <span className="inline-flex items-center gap-2">
                    <Check /> {editing ? "Update bag" : "Add to bag"}
                  </span>
                  <Ticker value={each * qty} />
                </button>
              </footer>
            </div>

            <button
              ref={closeRef}
              type="button"
              onClick={() => customize(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-[2] grid h-10 w-10 place-items-center rounded-full bg-porcelain-light text-ink shadow-[0_0_0_1px_rgba(201,161,90,0.6),0_8px_18px_-8px_rgba(0,0,0,0.6)] transition-transform duration-150 active:scale-90 lg:right-4 lg:top-4"
            >
              <Close />
            </button>
            <span className="sr-only">Pickup at {store.name}</span>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
