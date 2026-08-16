export interface Brokerage {
  readonly code: string;
  readonly name: string;
}

export interface Owner {
  readonly id: number;
  readonly name: string;
}

export const MARKET_SESSIONS = ["PREOPEN", "PRE_MARKET", "REGULAR_MARKET", "AFTER_MARKET"] as const;

export type MarketSession = (typeof MARKET_SESSIONS)[number];
