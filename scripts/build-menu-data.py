"""Turn data/scraped/*.json into src/lib/menu-data.ts.

Run from the project root:  python3 scripts/build-menu-data.py
Re-run after re-scraping. Edit RULES below to change which section an item lands in.
"""
import json, re

slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def section(store_cat, name):
    c, n = store_cat.lower(), name.lower()
    if "feature" in c or "featured" in n: return "feature"
    if c in ("savory", "breakfast / lunch"): return "savory"
    if c in ("baked goods", "handmade desserts"): return "bakery"
    if "frozen" in c: return "frozen"
    if "ice" in c: return "ice"
    if c.strip() in ("tea", "alternatives") or any(k in n for k in ("chai", "hot chocolate", "tea")): return "tea"
    return "espresso"

# Map to the old item ids so Unsplash stand-ins still cover items with no photo of their own.
def stock_id(sec, name):
    n = slug(name.replace("Signature", "Bing's").replace("Ice Coffee", "Iced Coffee"))
    n = re.sub(r"-(iced|frozen|hot)$", "", n)
    pre = {"ice": "iced-", "frozen": "frozen-"}.get(sec, "")
    return pre + n

def money(p):
    m = re.search(r"\$([\d.]+)", p or "")
    return float(m.group(1)) if m else None

def tidy(s):
    s = re.sub(r"\\+n", " ", s or "")
    s = re.sub(r"\s+", " ", s).strip()
    return s.replace("streamed", "steamed").replace("Flakey", "Flaky")

stores = {"amstel": "data/scraped/amstel-doordash.json", "elkton": "data/scraped/elkton-seamless.json"}
data = {k: json.load(open(v)) for k, v in stores.items()}

# Elkton's drinks have no descriptions on Seamless; borrow Amstel's for the same drink.
desc_by_drink = {}
for cat, items in data["amstel"]["categories"].items():
    for i in items:
        desc_by_drink[(section(cat, i["name"]), re.sub(r" (iced|frozen)$", "", i["name"].lower().strip()))] = tidy(i["description"])
# And photos: a drink photo from one shop covers the same drink at the other.
photo_by_key = {}
for s, d in data.items():
    for cat, items in d["categories"].items():
        for i in items:
            if i.get("photo"):
                photo_by_key.setdefault((section(cat, i["name"]), stock_id(section(cat, i["name"]), i["name"])), i["photo"])

# ---- options (sizes, flavors, milks, extra shots) ----
# Elkton: captured from each Seamless item page. Keyed by (category, name).
raw_opts = json.load(open("data/scraped/elkton-seamless-options.json"))
FLAVOR_MAX = 3

def groups_of(o):
    gs = []
    for c in o.get("choice_category_list", []):
        opts = [dict(id=str(x["id"]), name=(x.get("description") or "").strip().replace("Oak Milk", "Oat Milk"),
                     price=round(x.get("price", {}).get("amount", 0) / 100, 2)) for x in c.get("choice_option_list", [])]
        name = c["name"].strip().rstrip("?").replace("Would you Like to add a Flavor", "Add a flavor").replace("Would You Like an Extra Shot", "Extra shot")
        if not name and c.get("min_choice_options") == 1:
            name = "Choose a size"
        if "size" in name.lower() and any(not o["name"] for o in opts):
            labels = ["Small", "Medium", "Large"][-len(opts):] if len(opts) <= 3 else [f"Size {i+1}" for i in range(len(opts))]
            for o, l in zip(opts, labels): o["name"] = o["name"] or l
        mx = c.get("max_choice_options", 1)
        # Seamless caps flavors at one; in the shop you can mix syrups. Allow up to
        # FLAVOR_MAX, each charged. TODO(owner): confirm the limit with Carla.
        if "flavor" in name.lower() and c.get("min_choice_options", 0) == 0:
            mx = max(mx, FLAVOR_MAX)
        gs.append(dict(id=str(c["id"]), name=name, min=c.get("min_choice_options", 0), max=mx, options=opts))
    return gs
elk_opts = {(o["menu_category_name"].strip(), o["name"].strip()): o for o in raw_opts.values()}
# For Amstel, which DoorDash won't show options for: reuse Elkton's groups for the same drink.
elk_by_drink = {}
for (cat, name), o in elk_opts.items():
    if o.get("choice_category_list"):
        n = re.sub(r" (iced|frozen|hot)$", "", name.lower().replace("signature", "bing's").replace("ice coffee", "iced coffee"))
        elk_by_drink.setdefault((section(cat, name), n), o)

def is_size(g): return "size" in g["name"].lower()

def elk_lookup(sec, n):
    """Elkton drink by section and plain name, then by name in any drink section."""
    o = elk_by_drink.get((sec, n))
    if o: return o
    for (sc, nn), v in elk_by_drink.items():
        if nn == n and sc in ("espresso", "tea", "ice", "frozen", "feature"): return v
    return None

def group(name, opts, mn=1, mx=1, prices=None):
    gid = "x-" + slug(name)
    return dict(id=gid, name=name, min=mn, max=mx,
                options=[dict(id=f"{gid}-{slug(o)}", name=o, price=(prices or {}).get(o, 0.0)) for o in opts])

def elk_group(o, word):
    for g in groups_of(o):
        if word in g["name"].lower(): return g
    return None

COFFEE = elk_lookup("espresso", "vanilla latte")
ICED = elk_lookup("ice", "iced coffee")
FLAVOR = elk_group(COFFEE, "flavor"); SHOT = elk_group(COFFEE, "shot"); MILK = elk_group(COFFEE, "milk")
ALIASES = {"flavored creme": "vanilla creme", "monthly featured drink": "bing's mocha",
           "monthly featured drink - frozen": "bing's mocha", "monthly featured drink - iced": "bing's mocha"}
# Choices Amstel lists in its DoorDash descriptions (no extra charge).
DESCRIBED = {
    "bagel with cream cheese": [group("Choose a bagel", ["Plain", "Everything", "Cinnamon Raisin"]), group("Cream cheese", ["Plain", "Vegetable"])],
    "bagel with butter": [group("Choose a bagel", ["Plain", "Everything", "Cinnamon Raisin", "Sesame"])],
    "meat, egg & cheese": [group("Choose a meat", ["Bacon", "Sausage"]), group("Choose a bread", ["Plain Bagel", "Everything Bagel", "Croissant"])],
    "egg & cheese": [group("Choose a bread", ["Plain Bagel", "Everything Bagel", "Croissant"])],
    "muffins": [group("Choose a flavor", ["Blueberry", "Orange Cranberry"])],
    "gourmet cookies": [group("Choose a cookie", ["Oatmeal Raisin", "Peanut Butter"])],
}

def oz_sizes(g, sec):
    """Amstel names its sizes in ounces: 12/16/20 oz hot, 16/24 oz cold."""
    labels = ["12 oz", "16 oz", "20 oz"] if sec in ("espresso", "tea") or len(g["options"]) == 3 else ["16 oz", "24 oz"]
    for o, l in zip(g["options"], labels[-len(g["options"]):]): o["name"] = l

def rebase(groups, shown):
    """Price Amstel sizes from its own starting price plus Elkton's step-ups."""
    for g in groups:
        if "size" in g["name"].lower() and g["options"]:
            low = min(x["price"] for x in g["options"])
            for x in g["options"]: x["price"] = round(shown + (x["price"] - low), 2)
            return 0.0
    return shown

def amstel_groups(sec, raw_name, shown):
    n = re.sub(r" (iced|frozen|hot)$", "", raw_name.lower().strip())
    if n in DESCRIBED:
        return json.loads(json.dumps(DESCRIBED[n])), False, shown
    if shown is None: return [], False, shown
    o = elk_lookup(sec, ALIASES.get(raw_name.lower().strip(), ALIASES.get(n, n)))
    if o and o.get("choice_category_list"):
        gs = groups_of(o)
    elif n == "americano":
        twin = elk_lookup("tea", "brewed coffee")
        gs = [g for g in groups_of(twin) if "size" in g["name"].lower()] + [FLAVOR, dict(MILK, name="Add milk", min=0), SHOT]
    elif n == "cold brew":
        gs = [g for g in groups_of(ICED) if "size" in g["name"].lower()] + [
            group("Choice of dairy", ["Whole", "Skim", "Cream", "Soy", "Almond", "Oat", "No dairy"], 1, 1, {"Soy": 1.2, "Almond": 1.2, "Oat": 1.2}), FLAVOR, SHOT]
    elif n == "iced tea":
        twin = elk_lookup("tea", "organic black tea")
        gs = [group("Choose a tea", ["Black", "Green"])] + [g for g in groups_of(twin) if "size" in g["name"].lower()]
    elif n == "loose leaf tea":
        twin = elk_lookup("tea", "loose leaf hot tea")
        return [dict(g, name="Choose a tea") for g in groups_of(twin)], False, shown
    else:
        return [], False, shown
    gs = json.loads(json.dumps([g for g in gs if g]))
    base = rebase(gs, shown)
    for g in gs:
        if "size" in g["name"].lower(): oz_sizes(g, sec)
    return gs, True, base

out = {}
for s, d in data.items():
    items = []
    seen = set()
    for cat, lst in d["categories"].items():
        for i in lst:
            sec = section(cat, i["name"])
            name = i["name"].strip().replace("&Cheese", "& Cheese").replace("W/", "with").replace("Ice Coffee", "Iced Coffee")
            if sec in ("ice", "frozen"):
                name = re.sub(r" (Iced|ICED|Frozen)$", "", name)
            name = re.sub(r"\s+", " ", name).strip()
            iid = f"{s}-{sec}-{slug(name)}"
            if iid in seen: continue
            seen.add(iid)
            key = (sec, re.sub(r" (iced|frozen)$", "", i["name"].lower().strip()))
            desc = tidy(i["description"]) or desc_by_drink.get(key) or desc_by_drink.get((sec, key[1].replace("signature", "bing's"))) or ""
            if desc.lower() in ("flaky & savory",): desc = ""
            sid = stock_id(sec, name)
            shown = money(i["price"])
            base, groups, assumed = shown, [], False
            if s == "elkton":
                o = elk_opts.get((cat.strip(), i["name"].strip()))
                if o:
                    base = round(o["price"]["amount"] / 100, 2)
                    groups = groups_of(o)
            else:
                groups, assumed, base = amstel_groups(sec, i["name"], shown)
            if s == "elkton" and not groups and sec == "tea" and "green tea" in name.lower():
                twin = elk_lookup("tea", "organic black tea")
                if twin: groups, assumed, base = groups_of(twin), True, 0.0
            items.append(dict(
                id=iid, section=sec, name=name, description=desc,
                price=shown, base=base, from_=("+" in (i["price"] or "")) or any(is_size(g) for g in groups),
                photo=i.get("photo") or photo_by_key.get((sec, sid)), stockId=sid,
                groups=groups, optionsAssumed=assumed,
            ))
    out[s] = items

lines = ["// GENERATED by scripts/build-menu-data.py from data/scraped/*.json. Do not hand-edit;",
         "// edit the scraped JSON or the script, then re-run it.",
         "// Prices are what each shop charges on its delivery menu (DoorDash for Amstel,",
         "// Seamless for Elkton), scraped 2026-11-15. In-store prices may be a little lower.",
         "import type { RawItem } from \"./menu\";", "",
         "export const RAW_MENU: Record<\"amstel\" | \"elkton\", RawItem[]> = " + json.dumps(out, indent=2).replace('"from_"', '"from"') + ";", ""]
open("src/lib/menu-data.ts", "w").write("\n".join(lines))
for s, items in out.items():
    from collections import Counter
    print(s, len(items), dict(Counter(i["section"] for i in items)), "with photo:", sum(1 for i in items if i["photo"]))
