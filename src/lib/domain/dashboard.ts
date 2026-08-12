import Decimal from "decimal.js";
import { z } from "zod";

import { type Database, db } from "@/lib/db";
import { financeTextSchema, ownerIdSchema } from "@/lib/domain/types";

const FinancialDecimal = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

const aggregateRowSchema = z.object({
  ownerId: ownerIdSchema,
  ownerName: z.string(),
  brokerageCode: z.string().nullable(),
  brokerageName: z.string().nullable(),
  itemCode: z.string(),
  stockName: z.string(),
  boughtQuantity: financeTextSchema,
  soldQuantity: financeTextSchema,
  totalBuyAmount: financeTextSchema,
});

export type DashboardAggregateRow = z.infer<typeof aggregateRowSchema>;

export interface MarketQuote {
  readonly itemCode: string;
  readonly currentPrice: string;
  readonly quotedAt: string;
}

export interface DashboardPosition {
  readonly ownerId: DashboardAggregateRow["ownerId"];
  readonly ownerName: string;
  readonly brokerageCode: string | null;
  readonly brokerageName: string | null;
  readonly itemCode: string;
  readonly stockName: string;
  readonly quantity: string;
  readonly averageBuyPrice: string;
  readonly acquisitionAmount: string;
  readonly portfolioWeightPercent: string;
  readonly currentPrice: string | null;
  readonly valuationAmount: string | null;
  readonly unrealizedProfit: string | null;
  readonly returnRatePercent: string | null;
  readonly quoteUpdatedAt: string | null;
}

export type DashboardOwnerTotals = Readonly<{
  stockCount: number;
  acquisitionAmount: string;
  portfolioWeightPercent: string | null;
  currentPrice: null;
  valuationAmount: string | null;
  unrealizedProfit: string | null;
}>;

function decimalText(value: Decimal): string {
  const rounded = value.toDecimalPlaces(18).toFixed();
  if (/^-?0(?:\.0+)?$/.test(rounded)) {
    return "0";
  }
  return rounded.replace(/\.0+$|(?<=\.[0-9]*?)0+$/u, "");
}

export function summarizeDashboardRows(
  input: readonly DashboardAggregateRow[],
): readonly DashboardPosition[] {
  const base = input.map((row) => {
    const bought = new FinancialDecimal(row.boughtQuantity);
    const held = bought.minus(row.soldQuantity);
    const average = new FinancialDecimal(row.totalBuyAmount).dividedBy(bought);
    const acquisition = held.times(average);
    return { row, held, average, acquisition };
  });
  const brokerageAcquisitions = new Map<
    DashboardAggregateRow["ownerId"],
    Map<string | null, Decimal>
  >();
  for (const position of base) {
    const ownerBrokerages =
      brokerageAcquisitions.get(position.row.ownerId) ?? new Map<string | null, Decimal>();
    const current = ownerBrokerages.get(position.row.brokerageCode) ?? new FinancialDecimal(0);
    ownerBrokerages.set(position.row.brokerageCode, current.plus(position.acquisition));
    brokerageAcquisitions.set(position.row.ownerId, ownerBrokerages);
  }

  return base.map(({ row, held, average, acquisition }) => {
    const brokerageAcquisition =
      brokerageAcquisitions.get(row.ownerId)?.get(row.brokerageCode) ?? new FinancialDecimal(0);
    return {
      ownerId: row.ownerId,
      ownerName: row.ownerName,
      brokerageCode: row.brokerageCode,
      brokerageName: row.brokerageName,
      itemCode: row.itemCode,
      stockName: row.stockName,
      quantity: decimalText(held),
      averageBuyPrice: decimalText(average),
      acquisitionAmount: decimalText(acquisition),
      portfolioWeightPercent: brokerageAcquisition.isZero()
        ? "0"
        : decimalText(acquisition.dividedBy(brokerageAcquisition).times(100)),
      currentPrice: null,
      valuationAmount: null,
      unrealizedProfit: null,
      returnRatePercent: null,
      quoteUpdatedAt: null,
    };
  });
}

export function mergeMarketQuotes(
  positions: readonly DashboardPosition[],
  quotes: Readonly<Record<string, MarketQuote>>,
): readonly DashboardPosition[] {
  return positions.map((position) => {
    const quote = quotes[position.itemCode];
    if (quote === undefined || !/^[1-9]\d*$/.test(quote.currentPrice)) {
      return position;
    }

    const price = new FinancialDecimal(quote.currentPrice);
    const valuation = price.times(position.quantity);
    const profit = valuation.minus(position.acquisitionAmount);
    const returnRate = new FinancialDecimal(position.acquisitionAmount).isZero()
      ? null
      : profit.dividedBy(position.acquisitionAmount).times(100);

    return {
      ...position,
      currentPrice: quote.currentPrice,
      valuationAmount: decimalText(valuation),
      unrealizedProfit: decimalText(profit),
      returnRatePercent: returnRate === null ? null : decimalText(returnRate),
      quoteUpdatedAt: quote.quotedAt,
    };
  });
}

function summarizePositionTotals(
  positions: readonly DashboardPosition[],
  portfolioWeightPercent: string | null,
): DashboardOwnerTotals {
  const acquisitionAmount = positions.reduce(
    (total, position) => total.plus(position.acquisitionAmount),
    new FinancialDecimal(0),
  );
  const quotesComplete =
    positions.length > 0 &&
    positions.every(
      (position) =>
        position.currentPrice !== null &&
        position.valuationAmount !== null &&
        position.unrealizedProfit !== null,
    );
  const valuationAmount = quotesComplete
    ? positions.reduce(
        (total, position) => total.plus(position.valuationAmount ?? "0"),
        new FinancialDecimal(0),
      )
    : null;
  const unrealizedProfit = quotesComplete
    ? positions.reduce(
        (total, position) => total.plus(position.unrealizedProfit ?? "0"),
        new FinancialDecimal(0),
      )
    : null;
  return {
    stockCount: new Set(positions.map((position) => position.itemCode)).size,
    acquisitionAmount: decimalText(acquisitionAmount),
    portfolioWeightPercent,
    currentPrice: null,
    valuationAmount: valuationAmount === null ? null : decimalText(valuationAmount),
    unrealizedProfit: unrealizedProfit === null ? null : decimalText(unrealizedProfit),
  };
}

export function summarizeBrokerageTotals(
  positions: readonly DashboardPosition[],
): DashboardOwnerTotals {
  return summarizePositionTotals(positions, positions.length === 0 ? "0" : "100");
}

export function summarizeOwnerTotals(
  positions: readonly DashboardPosition[],
): DashboardOwnerTotals {
  return summarizePositionTotals(positions, null);
}

export async function getBaseDashboardPositions(
  database: Database = db,
): Promise<readonly DashboardPosition[]> {
  const result: unknown = await database`
    SELECT
      o.id AS "ownerId",
      o.name AS "ownerName",
      b.code::text AS "brokerageCode",
      b.name AS "brokerageName",
      s.item_code AS "itemCode",
      s.stock_name AS "stockName",
      SUM(t.quantity) FILTER (WHERE t.side = 'BUY')::text AS "boughtQuantity",
      COALESCE(SUM(t.quantity) FILTER (WHERE t.side = 'SELL'), 0)::text AS "soldQuantity",
      SUM(t.quantity::numeric * t.unit_price::numeric)
        FILTER (WHERE t.side = 'BUY')::text AS "totalBuyAmount"
    FROM trades t
    JOIN owners o ON o.id = t.owner_id
    JOIN securities s ON s.id = t.security_id
    LEFT JOIN brokerages b ON b.id = t.brokerage_id
    GROUP BY o.id, o.name, t.brokerage_id, b.code, b.name, s.item_code, s.stock_name
    HAVING
      SUM(CASE WHEN t.side = 'BUY' THEN t.quantity ELSE -t.quantity END) > 0
    ORDER BY o.id, b.name NULLS LAST, b.code NULLS LAST, s.stock_name, s.item_code
  `;
  return summarizeDashboardRows(z.array(aggregateRowSchema).parse(result));
}
