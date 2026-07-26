import { IndicatorColor, IndicatorResult } from "../provider/types";

export interface IndicatorGroup {
  name: string;
  indicators: string[]; // indicator names in this group
  icon: string; // emoji or symbol for the group
}

/**
 * Group definitions matching TrendScope checklist structure.
 * Order matters — groups displayed in this order.
 */
export const INDICATOR_GROUPS: IndicatorGroup[] = [
  {
    name: "Market Filter",
    indicators: ["Alligator", "ADX"],
    icon: "🔍",
  },
  {
    name: "Trend",
    indicators: ["EMA 200", "EMA 50/200", "MACD", "VWAP"],
    icon: "📈",
  },
  {
    name: "Money Flow",
    indicators: ["OBV", "CMF", "Volume"],
    icon: "💰",
  },
  {
    name: "Volatility",
    indicators: ["BB Squeeze", "Breakout", "Signal"],
    icon: "⚡",
  },
];

/**
 * Find which group an indicator belongs to.
 */
export function findGroup(indicatorName: string): IndicatorGroup | undefined {
  return INDICATOR_GROUPS.find((g) => g.indicators.includes(indicatorName));
}

/**
 * Compute parent group color from child indicator results.
 *
 * Market Filter group (white/grey children):
 * - ANY white → parent = white (green represents white in our system)
 * - ALL grey → parent = grey
 *
 * Other groups (green/red/grey children):
 * - Green majority → parent = green
 * - Red majority → parent = red
 * - Equal or grey majority → parent = grey
 */
export function computeGroupColor(
  groupName: string,
  childResults: IndicatorResult[]
): IndicatorColor {
  if (childResults.length === 0) return "grey";

  // Market Filter uses white/grey semantics (displayed as green/grey)
  if (groupName === "Market Filter") {
    const hasWhite = childResults.some((r) => r.color === "green"); // green = white (condition met)
    return hasWhite ? "green" : "grey";
  }

  // Other groups use green/red/grey semantics
  const greenCount = childResults.filter((r) => r.color === "green").length;
  const redCount = childResults.filter((r) => r.color === "red").length;
  const greyCount = childResults.filter((r) => r.color === "grey").length;

  if (greenCount > redCount && greenCount > greyCount) return "green";
  if (redCount > greenCount && redCount > greyCount) return "red";
  return "grey";
}

/**
 * Compute group results from all indicator results.
 * Returns one result per group (for parent dots).
 */
export function computeGroupResults(
  allResults: IndicatorResult[]
): { group: IndicatorGroup; color: IndicatorColor; children: IndicatorResult[] }[] {
  return INDICATOR_GROUPS.map((group) => {
    const children = allResults.filter((r) => group.indicators.includes(r.name));
    const color = computeGroupColor(group.name, children);
    return { group, color, children };
  });
}
