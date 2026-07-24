const CACHE_PREFIX = "trendscore_";
const OHLC_PREFIX = "ohlc_";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function getCachedScore<T>(ticker: string, range: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + ticker + "_" + range);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > ONE_DAY_MS) {
      localStorage.removeItem(CACHE_PREFIX + ticker + "_" + range);
      return null;
    }
    return data.score as T;
  } catch {
    return null;
  }
}

export function setCachedScore<T>(ticker: string, range: string, score: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CACHE_PREFIX + ticker + "_" + range,
      JSON.stringify({ score, ts: Date.now() })
    );
  } catch {
    /* quota exceeded — silently ignore */
  }
}

export function getCachedOHLC(ticker: string, range: string): import("./provider/types").OHLC[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(OHLC_PREFIX + ticker + "_" + range);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > ONE_DAY_MS) {
      localStorage.removeItem(OHLC_PREFIX + ticker + "_" + range);
      return null;
    }
    return data.ohlc as import("./provider/types").OHLC[];
  } catch {
    return null;
  }
}

export function setCachedOHLC(ticker: string, range: string, ohlc: import("./provider/types").OHLC[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      OHLC_PREFIX + ticker + "_" + range,
      JSON.stringify({ ohlc, ts: Date.now() })
    );
  } catch {
    /* quota exceeded */
  }
}
