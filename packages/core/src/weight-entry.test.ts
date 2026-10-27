import { describe, expect, it } from "vitest";

/**
 * The keystroke rule for weight entry, mirrored here so the reachability guarantee is tested
 * in core where the rest of the lifting logic lives. The component imports its own copy;
 * these cases are the contract both must satisfy.
 */
function press(current: string, key: string): string {
  if (key === "back") return current.length <= 1 ? "" : current.slice(0, -1);
  if (key === ".") return current.includes(".") ? current : (current === "" ? "0." : current + ".");
  if (current.includes(".") && current.split(".")[1]!.length >= 1) return current;
  if (current === "0") return key;
  const next = current + key;
  return Number(next) > 9999 ? current : next;
}
const type = (keys: string) => [...keys].reduce((acc, k) => press(acc, k), "");

describe("every weight is reachable, which the ladder could not promise", () => {
  it.each([
    ["0", "0"],
    ["1", "1"],
    [".5", "0.5"],
    ["2.5", "2.5"],
    ["7.5", "7.5"],
    ["22.5", "22.5"],
    ["137.5", "137.5"],
    ["100", "100"],
  ])("types %s and means %s", (keys, expected) => {
    expect(type(keys)).toBe(expected);
    expect(Number(type(keys))).toBe(Number(expected));
  });
});

describe("the keystroke rules", () => {
  it("opens a bare decimal with a leading zero, so '.5' is never ambiguous", () => {
    expect(press("", ".")).toBe("0.");
  });
  it("allows one decimal point only", () => {
    expect(press("2.5", ".")).toBe("2.5");
  });
  it("stops at one decimal place, which is all any plate or bell needs", () => {
    expect(press("2.5", "7")).toBe("2.5");
  });
  it("replaces a lone leading zero rather than making 05", () => {
    expect(press("0", "5")).toBe("5");
  });
  it("deletes back to empty", () => {
    expect(press("5", "back")).toBe("");
    expect(press("22.5", "back")).toBe("22.");
  });
  it("refuses a weight no human lifts", () => {
    expect(press("9999", "9")).toBe("9999");
  });
});

/*
 * A prefilled figure must be replaced by the first digit, not appended to.
 *
 * The console loads reps with the target from the plan, so a lifter who hit 8 after a target
 * of 10 pressed "8" and got 108. The keypad calls press() with an empty string while the
 * figure is still the plan's, which is what these cases describe.
 */
describe("first keystroke on a prefilled figure", () => {
  const firstKey = (shown: string, key: string, pristine: boolean) => press(pristine ? "" : shown, key);

  it("replaces the planned reps rather than appending to them", () => {
    expect(firstKey("10", "8", true)).toBe("8");
    expect(firstKey("10", "8", false)).toBe("108");
  });

  it("replaces a planned load, including one with a decimal", () => {
    expect(firstKey("62.5", "6", true)).toBe("6");
    expect(firstKey("100", "9", true)).toBe("9");
  });

  it("keeps typing once the figure is the lifter's own", () => {
    expect(press(firstKey("10", "1", true), "2")).toBe("12");
  });

  it("still backspaces the shown value, because that is what is on screen", () => {
    expect(press("10", "back")).toBe("1");
  });
});
