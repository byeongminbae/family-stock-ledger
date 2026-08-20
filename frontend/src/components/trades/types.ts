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
  readonly ownerId: number;
  readonly ownerName: string;
  readonly brokerageCode: string;
  readonly brokerageName: string;
  readonly profit: string | null;
}

export const sideLabel = (side: TradeSide): "매수" | "매도" => (side === "BUY" ? "매수" : "매도");
