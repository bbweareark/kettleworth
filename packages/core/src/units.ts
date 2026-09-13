export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const cmToIn = (cm: number) => cm / CM_PER_IN;
export const inToCm = (inches: number) => inches * CM_PER_IN;

export function formatWeight(kg: number | null | undefined, units: "metric" | "imperial", digits = 1): string {
  if (kg == null) return "-";
  return units === "metric" ? `${round(kg, digits)} kg` : `${round(kgToLb(kg), digits)} lb`;
}
export function formatHeight(cm: number | null | undefined, units: "metric" | "imperial"): string {
  if (cm == null) return "-";
  if (units === "metric") return `${Math.round(cm)} cm`;
  const totalIn = cmToIn(cm);
  const ft = Math.floor(totalIn / 12);
  const inch = Math.round(totalIn - ft * 12);
  return `${ft}′ ${inch}″`;
}
export function round(n: number, digits = 1): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
/** Round to the nearest loadable increment (kg). Upper-body 1.25, lower-body 2.5 by default. */
export function roundToPlate(kg: number, increment = 2.5): number {
  return Math.round(kg / increment) * increment;
}
