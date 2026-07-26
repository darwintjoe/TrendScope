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

export interface IndicatorGroupResult {
  name: string;
  color: IndicatorColor;
  children: IndicatorResult[];
}

export interface IndicatorParams {
  [key: string]: number;
}

export type IndicatorFn = (ohlc: OHLC[], params?: IndicatorParams) => IndicatorResult;

export interface CompanyInfo {
  shortName?: string;
  longName?: string;
  currency?: string;
  exchangeName?: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  trailingPE?: number;
  forwardPE?: number;
  pbv?: number;
  per?: number;
  eps?: number;
  bookValue?: number;
  dividendYield?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
}

export interface TickerScore {
  ticker: string;
  name?: string;
  companyInfo?: CompanyInfo;
  price?: number;
  change?: number;
  changePct?: number;
  indicators: IndicatorResult[];
  greenCount: number;
  redCount: number;
}
