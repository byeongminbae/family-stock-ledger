import "server-only";

import {
  getBaseDashboardPositions,
  type MarketQuote,
  mergeMarketQuotes,
  summarizeOwnerTotals,
} from "@/lib/domain/dashboard";
import { getNaverMarketPrices } from "@/lib/naver/client";

import { type DashboardSnapshot, OWNER_NAMES, type OwnerName, type OwnerTotals } from "./types";

const ownerNames: ReadonlySet<string> = new Set(["병민", "할머니", "아빠"]);

function ownerNameOf(value: string): OwnerName {
  if (ownerNames.has(value)) {
    if (value === "병민" || value === "할머니" || value === "아빠") return value;
  }
  throw new Error(`지원하지 않는 소유주입니다: ${value}`);
}

async function fetchMarketQuotes(
  itemCodes: readonly string[],
): Promise<Readonly<Record<string, MarketQuote>>> {
  if (itemCodes.length === 0) return {};

  const naverPrices = await getNaverMarketPrices(itemCodes);
  const quotes: Record<string, MarketQuote> = {};
  for (const [itemCode, price] of Object.entries(naverPrices)) {
    if (price !== null) {
      quotes[itemCode] = {
        itemCode,
        currentPrice: price.price,
        quotedAt: price.localTradedAt,
      };
    }
  }
  return quotes;
}

function ownerTotalsOf(
  ownerName: OwnerName,
  positions: Awaited<ReturnType<typeof mergeMarketQuotes>>,
): OwnerTotals {
  const totals = summarizeOwnerTotals(
    positions.filter((position) => ownerNameOf(position.ownerName) === ownerName),
  );
  return {
    stockCount: totals.stockCount,
    heldQuantity: totals.heldQuantity,
    averageBuyPrice: totals.averageBuyPrice,
    costBasis: totals.acquisitionAmount,
    portfolioWeight: totals.portfolioWeightPercent,
    currentPrice: totals.currentPrice,
    valuation: totals.valuationAmount,
    unrealizedProfit: totals.unrealizedProfit,
    returnRate: totals.returnRatePercent,
  };
}

export async function loadDashboard(): Promise<DashboardSnapshot> {
  const base = await getBaseDashboardPositions();
  const uniqueCodes = [...new Set(base.map((position) => position.itemCode))];
  const quotes = await fetchMarketQuotes(uniqueCodes);
  const positions = mergeMarketQuotes(base, quotes);
  const quoteFetchedAt =
    positions
      .map((position) => position.quoteUpdatedAt)
      .filter((value): value is string => value !== null)
      .sort()
      .at(-1) ?? null;

  return {
    positions: positions.map((position) => ({
      ownerId: position.ownerId,
      ownerName: ownerNameOf(position.ownerName),
      itemCode: position.itemCode,
      stockName: position.stockName,
      heldQuantity: position.quantity,
      averageBuyPrice: position.averageBuyPrice,
      costBasis: position.acquisitionAmount,
      portfolioWeight: position.portfolioWeightPercent,
      currentPrice: position.currentPrice,
      valuation: position.valuationAmount,
      unrealizedProfit: position.unrealizedProfit,
      returnRate: position.returnRatePercent,
    })),
    ownerTotals: {
      병민: ownerTotalsOf(OWNER_NAMES[0], positions),
      할머니: ownerTotalsOf(OWNER_NAMES[1], positions),
      아빠: ownerTotalsOf(OWNER_NAMES[2], positions),
    },
    quoteFetchedAt,
  };
}
