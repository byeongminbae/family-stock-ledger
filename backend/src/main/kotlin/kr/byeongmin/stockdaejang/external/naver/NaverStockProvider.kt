package kr.byeongmin.stockdaejang.external.naver

import io.github.oshai.kotlinlogging.KotlinLogging
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceSnapshotDto
import kr.byeongmin.stockdaejang.domain.stock.dto.StockSearchResultDto
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketPriceProvider
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import kr.byeongmin.stockdaejang.domain.stock.provider.StockSearchProvider
import kr.byeongmin.stockdaejang.external.naver.dto.NaverMarketPriceResponseDto
import kr.byeongmin.stockdaejang.external.naver.dto.NaverSearchResponseDto
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class NaverStockProvider(
    @Qualifier("naverRestClient") private val restClient: RestClient,
) : StockSearchProvider, MarketPriceProvider {
    private val logger = KotlinLogging.logger {}

    override val maxBatchSize: Int = PRICE_BATCH_SIZE

    override fun search(query: String): List<StockSearchResultDto> {
        val searchResponse = fetch("search", "queryLength=${query.length}") {
            restClient.get()
                .uri { builder ->
                    builder.path("/search")
                        .queryParam("page", 1)
                        .queryParam("q", query)
                        .queryParam("size", 20)
                        .queryParam("target", "stock,index,marketindicator,coin,ipo,fund")
                        .build()
                }
                .retrieve()
                .body(NaverSearchResponseDto::class.java)
        }

        if (!searchResponse.isSuccess) {
            externalApiError("search", "queryLength=${query.length}", "Naver response isSuccess=false")
        }

        return searchResponse.result.items.map(NaverSearchResponseDto.ItemDto::toStockSearchResultDto)
    }

    override fun fetchMarketPrices(itemCodes: List<String>): List<MarketPriceSnapshotDto> {
        val marketPriceResponse = fetch("market-price", "itemCodeCount=${itemCodes.size}") {
            restClient.get()
                .uri { builder ->
                    builder.path("/realTime/marketPrice")
                        .queryParam("endType", "stock")
                        .queryParam("itemCodes", itemCodes.joinToString(","))
                        .queryParam("stockType", "domestic")
                        .build()
                }
                .retrieve()
                .body(NaverMarketPriceResponseDto::class.java)
        }

        if (!marketPriceResponse.isSuccess) {
            externalApiError("market-price", "itemCodeCount=${itemCodes.size}", "Naver response isSuccess=false")
        }
        return marketPriceResponse.result.datas.map { marketPriceItem ->
            toMarketPriceSnapshot(marketPriceItem, "itemCode=${marketPriceItem.itemCode}")
        }
    }

    private fun toMarketPriceSnapshot(
        marketPriceItem: NaverMarketPriceResponseDto.ItemDto,
        context: String,
    ): MarketPriceSnapshotDto {
        val overMarketPriceInfo = marketPriceItem.overMarketPriceInfo
        return MarketPriceSnapshotDto(
            itemCode = marketPriceItem.itemCode,
            marketStatus = marketPriceItem.marketStatus,
            stockName = marketPriceItem.stockName,
            regularPrice = parsePrice(marketPriceItem.closePriceRaw, context),
            regularTradedAt = marketPriceItem.localTradedAt,
            overPrice = overMarketPriceInfo?.let { parsePrice(it.overPrice, context) },
            overTradedAt = overMarketPriceInfo?.localTradedAt,
            session = overMarketPriceInfo?.let { translateSession(it, context) } ?: MarketSession.REGULAR_MARKET,
        )
    }

    private fun translateSession(
        overMarketPriceInfo: NaverMarketPriceResponseDto.OverMarketPriceInfoDto,
        context: String,
    ): MarketSession {
        if (overMarketPriceInfo.overMarketStatus == "PREOPEN" && overMarketPriceInfo.tradingSessionType.isBlank()) {
            return MarketSession.PREOPEN
        }

        return when (val session = MarketSession.entries.firstOrNull { it.name == overMarketPriceInfo.tradingSessionType }) {
            MarketSession.PRE_MARKET,
            MarketSession.REGULAR_MARKET,
            MarketSession.AFTER_MARKET,
            -> session
            MarketSession.PREOPEN,
            null,
            -> externalApiError("market-price", context, "Unsupported session=$session")
        }
    }

    private fun parsePrice(rawPrice: String, context: String): Long {
        return rawPrice.replace(",", "").toLongOrNull()
            ?: externalApiError("market-price", context, "Invalid price=$rawPrice")
    }

    private fun <T> fetch(operation: String, context: String, request: () -> T?): T {
        return try {
            request() ?: externalApiError(operation, context, "Naver returned an empty response body")
        } catch (businessException: BusinessException) {
            throw businessException
        } catch (exception: Exception) {
            logger.debug(exception) {
                "Naver request failed: operation=$operation, context=$context, " +
                    "exception=${exception::class.simpleName}"
            }
            throw BusinessException(CommonError.EXTERNAL_API_ERROR)
        }
    }

    private fun externalApiError(operation: String, context: String, reason: String): Nothing {
        logger.debug { "Naver response rejected: operation=$operation, context=$context, reason=$reason" }
        throw BusinessException(CommonError.EXTERNAL_API_ERROR)
    }

    private companion object {
        const val PRICE_BATCH_SIZE = 50
    }
}
