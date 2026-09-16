import { describe, expect, it } from "vitest";
import { drinkMacros, parseDrink, DRINKS } from "./drinks";

describe("drinkMacros", () => {
  it("puts the calories in the milk and sugar, not the tea", () => {
    const black = drinkMacros({ drink: "tea", sizeMl: 300, milk: "none", sugarTsp: 0, syrupPumps: 0, count: 1 });
    const white = drinkMacros({ drink: "tea", sizeMl: 300, milk: "semi", sugarTsp: 2, syrupPumps: 0, count: 1 });
    expect(black.calories).toBeLessThanOrEqual(4);
    // 36 ml semi-skimmed ≈ 17 kcal, 2 tsp sugar = 32 kcal
    expect(white.calories).toBeGreaterThanOrEqual(48);
    expect(white.calories).toBeLessThanOrEqual(56);
    expect(white.breakdown.map((b) => b.label).join(" ")).toMatch(/Semi-skimmed milk.*Sugar, 2 tsp/);
  });
  it("lands close to published coffee-shop values", () => {
    // A medium semi-skimmed latte is published at roughly 130 to 150 kcal; a regular whole-milk flat white at 110 to 130.
    const latte = drinkMacros({ drink: "latte", sizeMl: 350, milk: "semi", sugarTsp: 0, syrupPumps: 0, count: 1 });
    expect(latte.calories).toBeGreaterThanOrEqual(125); expect(latte.calories).toBeLessThanOrEqual(155);
    const fw = drinkMacros({ drink: "flat_white", sizeMl: 180, milk: "whole", sugarTsp: 0, syrupPumps: 0, count: 1 });
    expect(fw.calories).toBeGreaterThanOrEqual(80); expect(fw.calories).toBeLessThanOrEqual(130);
    const pint = drinkMacros({ drink: "beer", sizeMl: 568, milk: "none", sugarTsp: 0, syrupPumps: 0, count: 1 });
    expect(pint.calories).toBeGreaterThanOrEqual(230); expect(pint.calories).toBeLessThanOrEqual(260);
  });
  it("counts syrup, scoops and rounds, and a swap of milk changes the total", () => {
    const oat = drinkMacros({ drink: "latte", sizeMl: 350, milk: "oat", sugarTsp: 0, syrupPumps: 2, count: 2 });
    const almond = drinkMacros({ drink: "latte", sizeMl: 350, milk: "almond", sugarTsp: 0, syrupPumps: 2, count: 2 });
    expect(oat.calories).toBeGreaterThan(almond.calories);
    expect(oat.label).toMatch(/^2 × Latte/);
    const shake = drinkMacros({ drink: "protein_shake", sizeMl: 500, milk: "none", sugarTsp: 0, syrupPumps: 0, count: 1 });
    expect(shake.proteinG).toBe(48);
  });
  it("gives every drink sizes and never negative numbers", () => {
    for (const d of DRINKS) {
      expect(d.sizes.length).toBeGreaterThan(0);
      const r = drinkMacros({ drink: d.id, sizeMl: d.sizes[0]!.ml, milk: d.defaultMilk, sugarTsp: 0, syrupPumps: 0, count: 1 });
      expect(r.calories).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("parseDrink", () => {
  it("reads the way people actually type drinks", () => {
    expect(parseDrink("tea with milk and 2 sugars")).toMatchObject({ drink: "tea", milk: "semi", sugarTsp: 2 });
    expect(parseDrink("large oat flat white")).toMatchObject({ drink: "flat_white", milk: "oat", sizeMl: 240 });
    expect(parseDrink("pint of lager")).toMatchObject({ drink: "beer", sizeMl: 568 });
    expect(parseDrink("black coffee")).toMatchObject({ drink: "black_coffee", milk: "none" });
    expect(parseDrink("vanilla latte")).toMatchObject({ drink: "latte", syrupPumps: 2 });
    expect(parseDrink("coke zero")).toMatchObject({ drink: "diet_cola" });
    expect(parseDrink("2 cups of tea")).toMatchObject({ drink: "tea", count: 2 });
  });
  it("leaves food, and drinks with food, to the full estimate", () => {
    expect(parseDrink("chicken caesar salad")).toBeNull();
    expect(parseDrink("latte and a croissant")).toBeNull();
  });
});
