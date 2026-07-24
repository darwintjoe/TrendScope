"use client";

import { IndicatorResult } from "@/lib/provider/types";

const DOT_CLASSES: Record<string, string> = {
  green: "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]",
  red: "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]",
  grey: "bg-zinc-500",
};

export function IndicatorDot({ indicator }: { indicator: IndicatorResult }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${DOT_CLASSES[indicator.color]}`}
      title={`${indicator.name}: ${indicator.color}${indicator.value ? ` (${indicator.value})` : ""}`}
    />
  );
}
