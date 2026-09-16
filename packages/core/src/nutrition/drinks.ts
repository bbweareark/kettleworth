/**
 * Drinks, calculated rather than guessed. Values per 100 ml from McCance and Widdowson's Composition of Foods (UK) and
 * USDA FoodData Central, rounded. A drink is modelled as its base, the milk that goes into it, and what is stirred in,
 * because that is where the calories actually are: a black coffee is almost nothing, the milk and sugar are not.
 */
export type Per100 = { kcal: number; p: number; c: number; f: number };
export type MilkId = "none" | "whole" | "semi" | "skimmed" | "oat" | "almond" | "soy" | "coconut";
export type DrinkId =
  | "tea" | "green_tea" | "herbal_tea" | "black_coffee" | "espresso" | "americano" | "latte" | "flat_white" | "cappuccino" | "mocha" | "chai_latte" | "iced_latte"
  | "hot_chocolate" | "milk" | "orange_juice" | "apple_juice" | "cola" | "diet_cola" | "energy_drink" | "sports_drink" | "smoothie" | "protein_shake"
  | "beer" | "cider" | "wine" | "spirit_mixer" | "water";
export type DrinkGroup = "tea" | "coffee" | "cold" | "shake" | "alcohol";

export const MILKS: Record<Exclude<MilkId, "none">, { name: string; per100: Per100 }> = {
  whole: { name: "Whole", per100: { kcal: 64, p: 3.4, c: 4.7, f: 3.6 } },
  semi: { name: "Semi-skimmed", per100: { kcal: 46, p: 3.5, c: 4.8, f: 1.7 } },
  skimmed: { name: "Skimmed", per100: { kcal: 34, p: 3.4, c: 5.0, f: 0.2 } },
  oat: { name: "Oat", per100: { kcal: 50, p: 1.0, c: 6.6, f: 2.5 } },
  almond: { name: "Almond", per100: { kcal: 13, p: 0.4, c: 0.1, f: 1.1 } },
  soy: { name: "Soya", per100: { kcal: 36, p: 3.0, c: 0.4, f: 1.8 } },
  coconut: { name: "Coconut", per100: { kcal: 20, p: 0.1, c: 2.7, f: 0.9 } },
};

type Size = { label: string; ml: number };
type Milk = { kind: "none" } | { kind: "splash"; mlPer250: number } | { kind: "share"; share: number };
export type DrinkDef = {
  id: DrinkId; name: string; group: DrinkGroup; sizes: Size[]; per100: Per100;
  milk: Milk; defaultMilk: MilkId; sugar: boolean; syrup: boolean;
  /** Fixed additions that are part of the drink, e.g. chocolate powder or a protein scoop. */
  extra?: { label: string; kcal: number; p: number; c: number; f: number; perScoop?: boolean };
};

const CUP: Size[] = [{ label: "Small", ml: 240 }, { label: "Medium", ml: 350 }, { label: "Large", ml: 470 }];
const MUG: Size[] = [{ label: "Cup", ml: 200 }, { label: "Mug", ml: 300 }, { label: "Large mug", ml: 400 }];
const GLASS: Size[] = [{ label: "Glass", ml: 250 }, { label: "Can", ml: 330 }, { label: "Bottle", ml: 500 }];
const WATERY: Per100 = { kcal: 1, p: 0.1, c: 0, f: 0 };

export const DRINKS: DrinkDef[] = [
  { id: "tea", name: "Tea", group: "tea", sizes: MUG, per100: WATERY, milk: { kind: "splash", mlPer250: 30 }, defaultMilk: "semi", sugar: true, syrup: false },
  { id: "green_tea", name: "Green tea", group: "tea", sizes: MUG, per100: WATERY, milk: { kind: "none" }, defaultMilk: "none", sugar: true, syrup: false },
  { id: "herbal_tea", name: "Herbal tea", group: "tea", sizes: MUG, per100: WATERY, milk: { kind: "none" }, defaultMilk: "none", sugar: true, syrup: false },
  { id: "chai_latte", name: "Chai latte", group: "tea", sizes: CUP, per100: WATERY, milk: { kind: "share", share: 0.8 }, defaultMilk: "semi", sugar: true, syrup: false, extra: { label: "Chai syrup", kcal: 70, p: 0, c: 17, f: 0 } },
  { id: "black_coffee", name: "Filter coffee", group: "coffee", sizes: MUG, per100: WATERY, milk: { kind: "splash", mlPer250: 30 }, defaultMilk: "none", sugar: true, syrup: true },
  { id: "espresso", name: "Espresso", group: "coffee", sizes: [{ label: "Single", ml: 30 }, { label: "Double", ml: 60 }], per100: { kcal: 2, p: 0.1, c: 0, f: 0.2 }, milk: { kind: "none" }, defaultMilk: "none", sugar: true, syrup: false },
  { id: "americano", name: "Americano", group: "coffee", sizes: CUP, per100: WATERY, milk: { kind: "splash", mlPer250: 30 }, defaultMilk: "none", sugar: true, syrup: true },
  { id: "flat_white", name: "Flat white", group: "coffee", sizes: [{ label: "Regular", ml: 180 }, { label: "Large", ml: 240 }], per100: WATERY, milk: { kind: "share", share: 0.75 }, defaultMilk: "whole", sugar: true, syrup: true },
  { id: "latte", name: "Latte", group: "coffee", sizes: CUP, per100: WATERY, milk: { kind: "share", share: 0.85 }, defaultMilk: "semi", sugar: true, syrup: true },
  { id: "cappuccino", name: "Cappuccino", group: "coffee", sizes: CUP, per100: WATERY, milk: { kind: "share", share: 0.6 }, defaultMilk: "semi", sugar: true, syrup: true },
  { id: "mocha", name: "Mocha", group: "coffee", sizes: CUP, per100: WATERY, milk: { kind: "share", share: 0.75 }, defaultMilk: "semi", sugar: false, syrup: true, extra: { label: "Chocolate sauce", kcal: 90, p: 1, c: 17, f: 2.5 } },
  { id: "iced_latte", name: "Iced latte", group: "coffee", sizes: CUP, per100: WATERY, milk: { kind: "share", share: 0.55 }, defaultMilk: "semi", sugar: true, syrup: true },
  { id: "hot_chocolate", name: "Hot chocolate", group: "coffee", sizes: CUP, per100: WATERY, milk: { kind: "share", share: 0.85 }, defaultMilk: "semi", sugar: false, syrup: true, extra: { label: "Chocolate powder", kcal: 80, p: 1.5, c: 15, f: 1.5 } },
  { id: "milk", name: "Glass of milk", group: "cold", sizes: [{ label: "Small glass", ml: 200 }, { label: "Glass", ml: 250 }, { label: "Pint", ml: 568 }], per100: { kcal: 0, p: 0, c: 0, f: 0 }, milk: { kind: "share", share: 1 }, defaultMilk: "semi", sugar: false, syrup: false },
  { id: "orange_juice", name: "Orange juice", group: "cold", sizes: [{ label: "Small glass", ml: 150 }, { label: "Glass", ml: 250 }, { label: "Bottle", ml: 330 }], per100: { kcal: 45, p: 0.7, c: 10.4, f: 0.1 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
  { id: "apple_juice", name: "Apple juice", group: "cold", sizes: [{ label: "Small glass", ml: 150 }, { label: "Glass", ml: 250 }, { label: "Bottle", ml: 330 }], per100: { kcal: 46, p: 0.1, c: 11.2, f: 0.1 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
  { id: "cola", name: "Cola", group: "cold", sizes: GLASS, per100: { kcal: 42, p: 0, c: 10.6, f: 0 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
  { id: "diet_cola", name: "Diet or zero cola", group: "cold", sizes: GLASS, per100: { kcal: 0.4, p: 0, c: 0, f: 0 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
  { id: "energy_drink", name: "Energy drink", group: "cold", sizes: [{ label: "Small can", ml: 250 }, { label: "Can", ml: 500 }], per100: { kcal: 45, p: 0, c: 11, f: 0 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
  { id: "sports_drink", name: "Sports drink", group: "cold", sizes: [{ label: "Bottle", ml: 500 }, { label: "Large bottle", ml: 750 }], per100: { kcal: 26, p: 0, c: 6.4, f: 0 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
  { id: "smoothie", name: "Fruit smoothie", group: "cold", sizes: [{ label: "Small", ml: 250 }, { label: "Bottle", ml: 400 }], per100: { kcal: 55, p: 0.6, c: 12.5, f: 0.2 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
  { id: "protein_shake", name: "Protein shake", group: "shake", sizes: [{ label: "1 scoop", ml: 300 }, { label: "2 scoops", ml: 500 }], per100: { kcal: 0, p: 0, c: 0, f: 0 }, milk: { kind: "share", share: 1 }, defaultMilk: "none", sugar: false, syrup: false, extra: { label: "Whey scoop", kcal: 120, p: 24, c: 3, f: 1.5, perScoop: true } },
  { id: "beer", name: "Beer or lager", group: "alcohol", sizes: [{ label: "Half pint", ml: 284 }, { label: "Bottle", ml: 330 }, { label: "Pint", ml: 568 }], per100: { kcal: 43, p: 0.3, c: 3.6, f: 0 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
  { id: "cider", name: "Cider", group: "alcohol", sizes: [{ label: "Half pint", ml: 284 }, { label: "Bottle", ml: 500 }, { label: "Pint", ml: 568 }], per100: { kcal: 40, p: 0, c: 4.3, f: 0 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
  { id: "wine", name: "Wine", group: "alcohol", sizes: [{ label: "Small glass", ml: 125 }, { label: "Medium glass", ml: 175 }, { label: "Large glass", ml: 250 }], per100: { kcal: 76, p: 0.1, c: 2.6, f: 0 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
  { id: "spirit_mixer", name: "Spirit and mixer", group: "alcohol", sizes: [{ label: "Single", ml: 225 }, { label: "Double", ml: 250 }], per100: { kcal: 45, p: 0, c: 4.5, f: 0 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
  { id: "water", name: "Water", group: "cold", sizes: [{ label: "Glass", ml: 250 }, { label: "Bottle", ml: 500 }, { label: "Litre", ml: 1000 }], per100: { kcal: 0, p: 0, c: 0, f: 0 }, milk: { kind: "none" }, defaultMilk: "none", sugar: false, syrup: false },
];

export type DrinkOrder = { drink: DrinkId; sizeMl: number; milk: MilkId; sugarTsp: number; syrupPumps: number; count: number };
export type DrinkResult = { label: string; calories: number; proteinG: number; carbsG: number; fatG: number; fibreG: number; breakdown: { label: string; calories: number }[]; volumeMl: number };

const SUGAR_TSP = { kcal: 16, c: 4 };
const SYRUP_PUMP = { kcal: 20, c: 5 };
const r1 = (n: number) => Math.round(n * 10) / 10;

export function drinkDef(id: DrinkId): DrinkDef {
  const d = DRINKS.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown drink ${id}`);
  return d;
}

/** Calories and macros for one order, with a breakdown of where the energy comes from. */
export function drinkMacros(o: DrinkOrder): DrinkResult {
  const d = drinkDef(o.drink);
  const count = Math.max(1, Math.min(10, Math.round(o.count)));
  const size = Math.max(1, o.sizeMl);
  const parts: { label: string; kcal: number; p: number; c: number; f: number }[] = [];
  const milkMl = o.milk === "none" || d.milk.kind === "none" ? 0 : d.milk.kind === "splash" ? (d.milk.mlPer250 * size) / 250 : d.milk.share * size;
  const baseMl = Math.max(0, size - milkMl);
  if (d.per100.kcal > 0) parts.push({ label: d.name, kcal: (d.per100.kcal * baseMl) / 100, p: (d.per100.p * baseMl) / 100, c: (d.per100.c * baseMl) / 100, f: (d.per100.f * baseMl) / 100 });
  if (milkMl > 0 && o.milk !== "none") { const m = MILKS[o.milk].per100; parts.push({ label: `${MILKS[o.milk].name} milk, ${Math.round(milkMl)} ml`, kcal: (m.kcal * milkMl) / 100, p: (m.p * milkMl) / 100, c: (m.c * milkMl) / 100, f: (m.f * milkMl) / 100 }); }
  if (d.extra) { const n = d.extra.perScoop ? Math.max(1, Math.round(size / 250)) : 1; parts.push({ label: n > 1 ? `${d.extra.label} ×${n}` : d.extra.label, kcal: d.extra.kcal * n, p: d.extra.p * n, c: d.extra.c * n, f: d.extra.f * n }); }
  const sugar = d.sugar ? Math.max(0, Math.min(8, o.sugarTsp)) : 0;
  if (sugar > 0) parts.push({ label: `Sugar, ${sugar} tsp`, kcal: SUGAR_TSP.kcal * sugar, p: 0, c: SUGAR_TSP.c * sugar, f: 0 });
  const syrup = d.syrup ? Math.max(0, Math.min(6, o.syrupPumps)) : 0;
  if (syrup > 0) parts.push({ label: `Syrup, ${syrup} pump${syrup === 1 ? "" : "s"}`, kcal: SYRUP_PUMP.kcal * syrup, p: 0, c: SYRUP_PUMP.c * syrup, f: 0 });
  const sum = (k: "kcal" | "p" | "c" | "f") => parts.reduce((a, x) => a + x[k], 0) * count;
  const sizeLabel = d.sizes.find((s) => s.ml === size)?.label ?? `${size} ml`;
  const milkLabel = milkMl > 0 && o.milk !== "none" ? `, ${MILKS[o.milk].name.toLowerCase()} milk` : "";
  const sugarLabel = sugar ? `, ${sugar} sugar${sugar === 1 ? "" : "s"}` : "";
  return {
    label: `${count > 1 ? `${count} × ` : ""}${d.name} (${sizeLabel.toLowerCase()}${milkLabel}${sugarLabel})`,
    calories: Math.round(sum("kcal")), proteinG: r1(sum("p")), carbsG: r1(sum("c")), fatG: r1(sum("f")), fibreG: 0,
    breakdown: parts.filter((x) => x.kcal >= 0.5).map((x) => ({ label: x.label, calories: Math.round(x.kcal * count) })),
    volumeMl: size * count,
  };
}

/**
 * Read a typed drink ("tea with milk and 2 sugars", "large oat flat white", "pint of lager") without calling anything,
 * so common drinks are instant and work offline. Returns null when the text is not clearly a single drink.
 */
export function parseDrink(text: string): DrinkOrder | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9\s.]/g, " ")} `;
  if (/\b(and|with)\s+(a|an|some)?\s*(toast|sandwich|croissant|biscuit|cake|muffin|cookie|bagel)/.test(t)) return null;
  const table: [RegExp, DrinkId][] = [
    [/\bflat white\b/, "flat_white"], [/\bchai\b/, "chai_latte"], [/\biced (latte|coffee)\b/, "iced_latte"], [/\bmocha\b/, "mocha"], [/\bcappuccino\b/, "cappuccino"], [/\blatte\b/, "latte"],
    [/\bamericano\b/, "americano"], [/\bespresso\b/, "espresso"], [/\bhot choc(olate)?\b/, "hot_chocolate"], [/\b(filter|black|drip) coffee\b|\bcoffee\b/, "black_coffee"],
    [/\bgreen tea\b/, "green_tea"], [/\b(herbal|peppermint|camomile|chamomile|fruit) tea\b/, "herbal_tea"], [/\btea\b|\bbrew\b|\bcuppa\b/, "tea"],
    [/\bprotein shake\b|\bwhey\b/, "protein_shake"], [/\bsmoothie\b/, "smoothie"], [/\borange juice\b|\boj\b/, "orange_juice"], [/\bapple juice\b/, "apple_juice"],
    [/\b(diet|zero|sugar free) (coke|cola|pepsi)\b|\bcoke zero\b|\bpepsi max\b/, "diet_cola"], [/\bcoke\b|\bcola\b|\bpepsi\b/, "cola"],
    [/\benergy drink\b|\bred bull\b|\bmonster\b/, "energy_drink"], [/\bsports drink\b|\blucozade sport\b|\bgatorade\b|\bpowerade\b/, "sports_drink"],
    [/\bcider\b/, "cider"], [/\b(beer|lager|ale|stout|ipa|guinness)\b/, "beer"], [/\bwine\b|\bprosecco\b|\bchampagne\b/, "wine"], [/\b(gin|vodka|rum|whisky|whiskey) and\b/, "spirit_mixer"],
    [/\bglass of milk\b|\bmilk\b/, "milk"], [/\bwater\b/, "water"],
  ];
  const hit = table.find(([re]) => re.test(t));
  if (!hit) return null;
  const d = drinkDef(hit[1]);
  const num = (w: string) => ({ a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, half: 0.5 } as Record<string, number>)[w] ?? Number(w);
  const count = (() => { const m = t.match(/\b(\d+|two|three|four|five)\s*(x\s*)?(cups?|mugs?|glasses?|pints?|cans?|bottles?|shots?)?\s+(of\s+)?(tea|coffee|lattes?|flat whites?|cappuccinos?|beers?|pints?|glasses?|cans?|espressos?)/); return m ? Math.max(1, Math.round(num(m[1]!))) : 1; })();
  let sizeMl = d.sizes[Math.min(1, d.sizes.length - 1)]!.ml;
  const bySize = (label: RegExp) => d.sizes.find((s) => label.test(s.label.toLowerCase()));
  if (/\b(small|short|tall)\b/.test(t)) sizeMl = d.sizes[0]!.ml;
  if (/\b(large|big|venti|grande)\b/.test(t)) sizeMl = d.sizes[d.sizes.length - 1]!.ml;
  for (const [re, lab] of [[/\bpint\b/, /^pint$/], [/\bhalf pint\b/, /^half pint$/], [/\bcan\b/, /can/], [/\bbottle\b/, /bottle/], [/\bdouble\b/, /double/], [/\bmug\b/, /^mug$/], [/\bcup\b/, /^cup$/]] as [RegExp, RegExp][]) {
    if (re.test(t)) { const s = bySize(lab); if (s) sizeMl = s.ml; }
  }
  const ml = t.match(/\b(\d{2,4})\s*ml\b/); if (ml) sizeMl = Number(ml[1]);
  let milk: MilkId = d.defaultMilk;
  if (/\bno milk\b|\bblack\b|\bwithout milk\b/.test(t)) milk = "none";
  const milkWords: [RegExp, MilkId][] = [[/\boat\b/, "oat"], [/\balmond\b/, "almond"], [/\bso(y|ya)\b/, "soy"], [/\bcoconut\b/, "coconut"], [/\bskim(med)?\b/, "skimmed"], [/\bsemi\b/, "semi"], [/\bwhole\b|\bfull fat\b/, "whole"]];
  const named = milkWords.find(([re]) => re.test(t)); if (named) milk = named[1];
  if (milk === "none" && d.milk.kind !== "none" && /\bwith milk\b|\bwhite\b|\bmilky\b/.test(t)) milk = "semi";
  if (d.milk.kind === "none") milk = "none";
  const sug = t.match(/\b(\d+|one|two|three|four|a|half)\s*(tsp|teaspoons?|sugars?|spoons?)\b/);
  const sugarTsp = sug ? num(sug[1]!) : /\bwith sugar\b|\bsugar\b/.test(t) && !/\bno sugar\b|\bsugar free\b/.test(t) ? 1 : 0;
  const pumps = t.match(/\b(\d+|one|two|three)\s*(pumps?|shots? of syrup)\b/);
  const syrupPumps = pumps ? num(pumps[1]!) : /\b(vanilla|caramel|hazelnut|syrup)\b/.test(t) && d.syrup ? 2 : 0;
  return { drink: d.id, sizeMl, milk, sugarTsp, syrupPumps, count };
}
