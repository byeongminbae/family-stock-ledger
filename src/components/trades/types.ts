export type TradeSide = "BUY" | "SELL";

export interface StockSelection {
  readonly code: string;
  readonly name: string;
  readonly market: string;
  readonly isEtf: boolean;
}

export interface TradeHistoryRow {
  readonly id: string;
  readonly executedAt: string;
  readonly stockName: string;
  readonly itemCode: string;
  readonly market: string;
  readonly isEtf: boolean;
  readonly quantity: string;
  readonly unitPrice: string;
  readonly amount: string;
  readonly ownerId: 1 | 2 | 3;
  readonly ownerName: string;
  readonly profit: string | null;
}

export const OWNERS = [
  { id: 1, name: "병민" },
  { id: 2, name: "할머니" },
  { id: 3, name: "아빠" },
] as const;

export const sideLabel = (side: TradeSide): "매수" | "매도" => (side === "BUY" ? "매수" : "매도");
