import "server-only";

import {
  type DashboardOwnerTotals,
  getBaseDashboardPositions,
  type MarketQuote,
  mergeMarketQuotes,
  summarizeBrokerageTotals,
  summarizeOwnerTotals,
} from "@/lib/domain/dashboard";
import { MARKET_SESSIONS, type MarketSession } from "@/lib/domain/market-session";
import { getNaverMarketPrices } from "@/lib/naver/client";

import {
  type BrokeragePositionGroup,
  type DashboardPosition,
  type DashboardSnapshot,
  OWNER_NAMES,
  type OwnerName,
  type OwnerTotals,
} from "./types";

type QuotedPosition = Awaited<ReturnType<typeof mergeMarketQuotes>>[number];
type MarketQuoteResult = Readonly<{
  quotes: Readonly<Record<string, MarketQuote>>;
  valuationSessions: readonly MarketSession[];
}>;

const ownerNames: ReadonlySet<string> = new Set(["병민", "할머니", "아빠"]);

function ownerNameOf(value: string): OwnerName {
  if (ownerNames.has(value)) {
    if (value === "병민" || value === "할머니" || value === "아빠") return value;
  }
  throw new Error(`지원하지 않는 소유주입니다: ${value}`);
}

async function fetchMarketQuotes(itemCodes: readonly string[]): Promise<MarketQuoteResult> {
  if (itemCodes.length === 0) return { quotes: {}, valuationSessions: [] };

  const naverPrices = await getNaverMarketPrices(itemCodes);
  const quotes: Record<string, MarketQuote> = {};
  const valuationSessions = new Set<MarketSession>();
  for (const [itemCode, price] of Object.entries(naverPrices)) {
    if (price !== null) {
      quotes[itemCode] = {
        itemCode,
        currentPrice: price.price,
        quotedAt: price.localTradedAt,
      };
      valuationSessions.add(price.session);
    }
  }
  return {
    quotes,
    valuationSessions: MARKET_SESSIONS.filter((session) => valuationSessions.has(session)),
  };
}

function ownerTotalsOf(
  ownerName: OwnerName,
  positions: Awaited<ReturnType<typeof mergeMarketQuotes>>,
): OwnerTotals {
  return dashboardTotalsOf(
    summarizeOwnerTotals(
      positions.filter((position) => ownerNameOf(position.ownerName) === ownerName),
    ),
  );
}

function dashboardTotalsOf(totals: DashboardOwnerTotals): OwnerTotals {
  return {
    stockCount: totals.stockCount,
    costBasis: totals.acquisitionAmount,
    portfolioWeight: totals.portfolioWeightPercent,
    currentPrice: totals.currentPrice,
    valuation: totals.valuationAmount,
    unrealizedProfit: totals.unrealizedProfit,
  };
}

function dashboardPositionOf(position: QuotedPosition): DashboardPosition {
  return {
    ownerId: position.ownerId,
    ownerName: ownerNameOf(position.ownerName),
    brokerageCode: position.brokerageCode,
    brokerageName: position.brokerageName,
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
  };
}

function brokerageGroupsOf(
  ownerName: OwnerName,
  positions: readonly QuotedPosition[],
): readonly BrokeragePositionGroup[] {
  const groups = new Map<
    string,
    {
      readonly brokerageCode: string | null;
      readonly brokerageName: string | null;
      readonly positions: QuotedPosition[];
    }
  >();
  for (const position of positions) {
    if (ownerNameOf(position.ownerName) !== ownerName) continue;
    const key = position.brokerageCode ?? "legacy";
    const group = groups.get(key);
    if (group === undefined) {
      groups.set(key, {
        brokerageCode: position.brokerageCode,
        brokerageName: position.brokerageName,
        positions: [position],
      });
    } else {
      group.positions.push(position);
    }
  }

  return [...groups.values()]
    .sort((left, right) => {
      if (left.brokerageName === null && right.brokerageName === null) return 0;
      if (left.brokerageName === null) return 1;
      if (right.brokerageName === null) return -1;
      return left.brokerageName.localeCompare(right.brokerageName, "ko");
    })
    .map((group) => ({
      brokerageCode: group.brokerageCode,
      brokerageName: group.brokerageName,
      positions: group.positions.map(dashboardPositionOf),
      totals: dashboardTotalsOf(summarizeBrokerageTotals(group.positions)),
    }));
}

export async function loadDashboard(): Promise<DashboardSnapshot> {
  const base = await getBaseDashboardPositions();
  const uniqueCodes = [...new Set(base.map((position) => position.itemCode))];
  const { quotes, valuationSessions } = await fetchMarketQuotes(uniqueCodes);
  const positions = mergeMarketQuotes(base, quotes);
  const quoteFetchedAt =
    positions
      .map((position) => position.quoteUpdatedAt)
      .filter((value): value is string => value !== null)
      .sort()
      .at(-1) ?? null;
  const dashboardPositions = positions.map(dashboardPositionOf);

  return {
    positions: dashboardPositions,
    brokerageGroups: {
      병민: brokerageGroupsOf(OWNER_NAMES[0], positions),
      할머니: brokerageGroupsOf(OWNER_NAMES[1], positions),
      아빠: brokerageGroupsOf(OWNER_NAMES[2], positions),
    },
    ownerTotals: {
      병민: ownerTotalsOf(OWNER_NAMES[0], positions),
      할머니: ownerTotalsOf(OWNER_NAMES[1], positions),
      아빠: ownerTotalsOf(OWNER_NAMES[2], positions),
    },
    quoteFetchedAt,
    valuationSessions,
  };
}
