"use client";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import { WhenVisible } from "@/components/when-visible";

/**
 * The charts, fetched on the way to them rather than with the page.
 *
 * Recharts is 361KB of the 1.2MB Progress was shipping, and every chart here is below the
 * fold: you land on a photograph and a figure and have to scroll twice before one is on
 * screen. `next/dynamic` alone was not enough, because it still fetches the chunk the moment
 * the component mounts - so each chart also waits for the reader to come within 400px of it.
 *
 * Every placeholder is the exact height of the chart it stands in for, so nothing moves and
 * the page looks the same either way.
 *
 * The options below are written out rather than built by a helper: next/dynamic reads them
 * at build time and rejects anything that is not an object literal.
 */
function Skeleton({ h }: { h: string }) {
  return <div className={`${h} animate-pulse-soft rounded-md bg-rule`} aria-hidden />;
}

const E1RM = dynamic(() => import("./charts").then((m) => m.E1RMChart), { ssr: false, loading: () => <Skeleton h="h-56" /> });
const Tonnage = dynamic(() => import("./charts").then((m) => m.TonnageChart), { ssr: false, loading: () => <Skeleton h="h-52" /> });
const Weight = dynamic(() => import("./charts").then((m) => m.WeightChart), { ssr: false, loading: () => <Skeleton h="h-48" /> });
const Physique = dynamic(() => import("./physique-charts").then((m) => m.PhysiqueCharts), { ssr: false, loading: () => <Skeleton h="h-56" /> });

export function E1RMChart(p: ComponentProps<typeof E1RM>) {
  return <WhenVisible placeholder={<Skeleton h="h-56" />}><E1RM {...p} /></WhenVisible>;
}
export function TonnageChart(p: ComponentProps<typeof Tonnage>) {
  return <WhenVisible placeholder={<Skeleton h="h-52" />}><Tonnage {...p} /></WhenVisible>;
}
export function WeightChart(p: ComponentProps<typeof Weight>) {
  return <WhenVisible placeholder={<Skeleton h="h-48" />}><Weight {...p} /></WhenVisible>;
}
export function PhysiqueCharts(p: ComponentProps<typeof Physique>) {
  return <WhenVisible placeholder={<Skeleton h="h-56" />}><Physique {...p} /></WhenVisible>;
}

/** Bars made of divs, from the module that has no Recharts in it, so it stays eager. */
export { VolumeCompare } from "./charts-plain";
