import ky from "ky";
import { z } from "zod";

import { MARKET_SESSIONS, type MarketSession } from "@/lib/domain/market-session";

const NAVER_API_BASE_URL = "https://m.stock.naver.com/front-api";
const PRICE_BATCH_SIZE = 50;
const AFTER_MARKET_EXPIRY_OFFSET_MS = (24 + 3) * 60 * 60 * 1_000;

const itemCodeSchema = z.string().regex(/^[0-9A-Z]{6}$/);
const localTradedAtSchema = z.iso.datetime({ offset: true });
const formattedPriceSchema = z
  .string()
  .regex(/^\d+(?:,\d{3})*$/)
  .transform((value) => value.replaceAll(",", ""));
const tradingSessionTypeSchema = z.enum(MARKET_SESSIONS);
const overMarketPriceInfoSchema = z.union([
  z
    .object({
      localTradedAt: localTradedAtSchema,
      overMarketStatus: z.literal("PREOPEN"),
      overPrice: formattedPriceSchema,
      tradingSessionType: z.literal(""),
    })
    .transform((value) => ({ ...value, tradingSessionType: "PREOPEN" as const })),
  z.object({
    localTradedAt: localTradedAtSchema,
    overPrice: formattedPriceSchema,
    tradingSessionType: tradingSessionTypeSchema,
  }),
]);
const searchResponseSchema = z.object({
  isSuccess: z.literal(true),
  result: z.object({
    items: z.array(
      z.object({
        category: z.string(),
        code: z.string(),
        isEtf: z.boolean().nullable(),
        name: z.string().min(1),
        nationCode: z.string().nullable(),
        typeCode: z.string(),
        typeName: z.string().min(1),
        url: z.string(),
      }),
    ),
  }),
});
const marketPriceResponseSchema = z.object({
  isSuccess: z.literal(true),
  result: z.object({
    datas: z.array(
      z.object({
        closePriceRaw: z.string().regex(/^\d+$/),
        itemCode: itemCodeSchema,
        localTradedAt: localTradedAtSchema,
        marketStatus: z.string().min(1),
        overMarketPriceInfo: overMarketPriceInfoSchema.nullish(),
        stockName: z.string().min(1),
      }),
    ),
  }),
});

const createNaverClient = () =>
  ky.create({
    fetch: globalThis.fetch,
    prefix: `${NAVER_API_BASE_URL}/`,
    retry: {
      backoffLimit: 250,
      limit: 1,
      methods: ["get"],
      statusCodes: [408, 429, 500, 502, 503, 504],
    },
    timeout: 4_000,
  });

export type NaverStock = Readonly<{
  code: string;
  isEtf: boolean;
  market: string;
  name: string;
}>;

export type NaverMarketPrice = Readonly<{
  itemCode: string;
  localTradedAt: string;
  marketStatus: string;
  price: string;
  session: MarketSession;
  stockName: string;
}>;

export class NaverProviderError extends Error {
  constructor(cause?: unknown) {
    super("네이버 증권 정보를 불러오지 못했습니다.", { cause });
    this.name = "NaverProviderError";
  }
}

function valuationSessionFor(
  session: MarketSession,
  localTradedAt: string,
  currentTime: Date,
): MarketSession {
  switch (session) {
    case "PREOPEN":
      return "PREOPEN";
    case "REGULAR":
      return "REGULAR";
    case "PRE_MARKET":
      return "PRE_MARKET";
    case "AFTER_MARKET": {
      const tradingDate = localTradedAt.slice(0, 10);
      const expiresAt = Date.parse(`${tradingDate}T00:00:00+09:00`) + AFTER_MARKET_EXPIRY_OFFSET_MS;
      return currentTime.getTime() < expiresAt ? "AFTER_MARKET" : "REGULAR";
    }
    default: {
      const unsupportedSession: never = session;
      throw new RangeError(`지원하지 않는 거래 세션입니다: ${unsupportedSession}`);
    }
  }
}

export async function searchNaverStocks(query: string): Promise<readonly NaverStock[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length === 0 || normalizedQuery.length > 80) {
    throw new NaverProviderError();
  }

  try {
    const response = await createNaverClient()
      .get("search", {
        cache: "no-store",
        searchParams: {
          page: "1",
          q: normalizedQuery,
          size: "20",
          target: "stock,index,marketindicator,coin,ipo,fund",
        },
      })
      .json<unknown>();
    const parsed = searchResponseSchema.parse(response);

    return parsed.result.items.flatMap((item) => {
      if (
        item.category !== "stock" ||
        item.nationCode !== "KOR" ||
        item.isEtf === null ||
        !item.url.startsWith("/domestic/stock/") ||
        !itemCodeSchema.safeParse(item.code).success
      ) {
        return [];
      }

      return [
        {
          code: item.code,
          isEtf: item.isEtf,
          market: item.typeName,
          name: item.name,
        },
      ];
    });
  } catch (error) {
    throw new NaverProviderError(error);
  }
}

export async function getNaverMarketPrices(
  itemCodes: readonly string[],
): Promise<Readonly<Record<string, NaverMarketPrice | null>>> {
  const codes = [...new Set(z.array(itemCodeSchema).max(500).parse(itemCodes))];
  const result: Record<string, NaverMarketPrice | null> = {};
  for (const code of codes) result[code] = null;

  const batches = Array.from({ length: Math.ceil(codes.length / PRICE_BATCH_SIZE) }, (_, index) =>
    codes.slice(index * PRICE_BATCH_SIZE, (index + 1) * PRICE_BATCH_SIZE),
  );
  const responses = await Promise.allSettled(batches.map(fetchPriceBatch));

  for (const response of responses) {
    if (response.status !== "fulfilled") continue;
    for (const price of response.value) {
      if (Object.hasOwn(result, price.itemCode)) result[price.itemCode] = price;
    }
  }

  return result;
}

async function fetchPriceBatch(itemCodes: readonly string[]): Promise<readonly NaverMarketPrice[]> {
  const response = await createNaverClient()
    .get("realTime/marketPrice", {
      cache: "no-store",
      searchParams: {
        endType: "stock",
        itemCodes: itemCodes.join(","),
        stockType: "domestic",
      },
    })
    .json<unknown>();
  const parsed = marketPriceResponseSchema.parse(response);
  const currentTime = new Date();

  return parsed.result.datas.map((item) => {
    const overMarketPriceInfo = item.overMarketPriceInfo;
    if (overMarketPriceInfo === null || overMarketPriceInfo === undefined) {
      return {
        itemCode: item.itemCode,
        localTradedAt: item.localTradedAt,
        marketStatus: item.marketStatus,
        price: item.closePriceRaw,
        session: "REGULAR",
        stockName: item.stockName,
      };
    }

    const session = valuationSessionFor(
      overMarketPriceInfo.tradingSessionType,
      overMarketPriceInfo.localTradedAt,
      currentTime,
    );
    switch (session) {
      case "PREOPEN":
      case "REGULAR":
        return {
          itemCode: item.itemCode,
          localTradedAt: item.localTradedAt,
          marketStatus: item.marketStatus,
          price: item.closePriceRaw,
          session,
          stockName: item.stockName,
        };
      case "PRE_MARKET":
      case "AFTER_MARKET":
        return {
          itemCode: item.itemCode,
          localTradedAt: overMarketPriceInfo.localTradedAt,
          marketStatus: item.marketStatus,
          price: overMarketPriceInfo.overPrice,
          session,
          stockName: item.stockName,
        };
      default: {
        const unsupportedSession: never = session;
        throw new RangeError(`지원하지 않는 거래 세션입니다: ${unsupportedSession}`);
      }
    }
  });
}
