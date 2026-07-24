import { OHLC } from "./types";
import { getCachedOHLC, setCachedOHLC } from "../cache";

export async function fetchOHLC(
  ticker: string,
  range: string = "1y"
): Promise<OHLC[]> {
  /* check localStorage cache first */
  const cached = getCachedOHLC(ticker, range);
  if (cached && cached.length > 0) return cached;

  const res = await fetch(`/api/proxy?t=${encodeURIComponent(ticker)}&range=${range}`);
  if (!res.ok) throw new Error(`Fetch ${ticker}: ${res.status}`);

  const data = await res.json();
  const ohlc: OHLC[] = data.ohlc ?? [];

  if (ohlc.length > 0) setCachedOHLC(ticker, range, ohlc);
  return ohlc;
}
