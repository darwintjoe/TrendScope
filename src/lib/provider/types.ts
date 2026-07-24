export interface OHLC {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type IndicatorColor = "green" | "red" | "grey";

export interface IndicatorResult {
  name: string;
  color: IndicatorColor;
  value?: string;
}

export interface IndicatorParams {
  [key: string]: number;
}

export type IndicatorFn = (ohlc: OHLC[], params?: IndicatorParams) => IndicatorResult;

export interface TickerScore {
  ticker: string;
  name?: string;
  price?: number;
  change?: number;
  changePct?: number;
  indicators: IndicatorResult[];
  greenCount: number;
  redCount: number;
}
