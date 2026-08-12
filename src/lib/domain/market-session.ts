export const MARKET_SESSIONS = ["BEFORE_MARKET", "REGULAR", "AFTER_MARKET"] as const;

export type MarketSession = (typeof MARKET_SESSIONS)[number];
