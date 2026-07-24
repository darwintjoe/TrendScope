import { TickerScore } from "./provider/types";

export function sortByTrend(scores: TickerScore[]): TickerScore[] {
  return [...scores].sort((a, b) => {
    if (b.greenCount !== a.greenCount) return b.greenCount - a.greenCount;
    return a.redCount - b.redCount;
  });
}
