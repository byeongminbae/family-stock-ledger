package kr.byeongmin.stockdaejang.domain.stock.service

import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceSnapshotDto
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketPriceProvider
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.stereotype.Service
import java.time.Clock
import java.time.ZoneOffset

@Service
class MarketPriceService(
    private val marketPriceProvider: MarketPriceProvider,
    private val clock: Clock = Clock.systemDefaultZone(),
) {
    fun getMarketPrices(itemCodes: Collection<String>): Map<String, MarketPriceDto> {
        if (itemCodes.size > MAX_PRICE_CODES || itemCodes.any { itemCode -> !ITEM_CODE.matches(itemCode) }) {
            throw BusinessException(CommonError.INVALID_INPUT_VALUE)
        }

        val normalizedItemCodes = itemCodes.distinct()
        if (normalizedItemCodes.isEmpty()) {
            return emptyMap()
        }
        if (marketPriceProvider.maxBatchSize <= 0) {
            throw BusinessException(CommonError.INTERNAL_SERVER_ERROR)
        }

        val marketPricesByItemCode = linkedMapOf<String, MarketPriceDto>()

        normalizedItemCodes.chunked(marketPriceProvider.maxBatchSize).forEach { itemCodeBatch ->
            val marketPriceSnapshots = marketPriceProvider.fetchMarketPrices(itemCodeBatch)

            if (marketPriceSnapshots.any { marketPriceSnapshot -> marketPriceSnapshot.itemCode !in itemCodeBatch }) {
                throw BusinessException(CommonError.EXTERNAL_API_ERROR)
            }
            marketPriceSnapshots.forEach { marketPriceSnapshot ->
                val marketPrice = selectMarketPrice(marketPriceSnapshot)
                if (marketPrice.price <= 0) {
                    throw BusinessException(CommonError.EXTERNAL_API_ERROR)
                }
                marketPricesByItemCode[marketPriceSnapshot.itemCode] = marketPrice
            }
            if (itemCodeBatch.any { itemCode -> itemCode !in marketPricesByItemCode }) {
                throw BusinessException(CommonError.EXTERNAL_API_ERROR)
            }
        }
        return normalizedItemCodes.associateWithTo(linkedMapOf()) { itemCode ->
            marketPricesByItemCode.getValue(itemCode)
        }
    }

    private fun selectMarketPrice(marketPriceSnapshot: MarketPriceSnapshotDto): MarketPriceDto {
        return when (marketPriceSnapshot.session) {
            MarketSession.PREOPEN,
            MarketSession.REGULAR_MARKET,
            -> marketPriceSnapshot.toRegularMarketPrice()
            MarketSession.PRE_MARKET -> marketPriceSnapshot.toOverMarketPrice()
            MarketSession.AFTER_MARKET -> {
                val overTradedAt = marketPriceSnapshot.overTradedAt
                    ?: throw BusinessException(CommonError.EXTERNAL_API_ERROR)
                val expiresAt = overTradedAt
                    .toLocalDate()
                    .atStartOfDay()
                    .atOffset(SEOUL_OFFSET)
                    .plusHours(AFTER_MARKET_EXPIRY_HOURS)
                if (clock.instant().isBefore(expiresAt.toInstant())) {
                    marketPriceSnapshot.toOverMarketPrice()
                } else {
                    marketPriceSnapshot.toRegularMarketPrice(MarketSession.REGULAR_MARKET)
                }
            }
        }
    }

    private companion object {
        const val MAX_PRICE_CODES = 500
        const val AFTER_MARKET_EXPIRY_HOURS = 27L
        val ITEM_CODE = Regex("^[0-9A-Z]{6}$")
        val SEOUL_OFFSET: ZoneOffset = ZoneOffset.ofHours(9)
    }
}
