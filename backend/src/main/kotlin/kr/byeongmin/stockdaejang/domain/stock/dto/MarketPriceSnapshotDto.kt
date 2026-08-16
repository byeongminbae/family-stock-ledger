package kr.byeongmin.stockdaejang.domain.stock.dto

import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import java.time.OffsetDateTime

data class MarketPriceSnapshotDto(
    val itemCode: String,
    val marketStatus: String,
    val stockName: String,
    val regularPrice: Long,
    val regularTradedAt: OffsetDateTime,
    val overPrice: Long?,
    val overTradedAt: OffsetDateTime?,
    val session: MarketSession,
) {
    fun toRegularMarketPrice(
        selectedSession: MarketSession = session,
    ): MarketPriceDto {
        return MarketPriceDto.from(
            marketPriceSnapshot = this,
            localTradedAt = regularTradedAt,
            price = regularPrice,
            session = selectedSession,
        )
    }

    fun toOverMarketPrice(): MarketPriceDto {
        val selectedOverPrice = overPrice
            ?: throw BusinessException(CommonError.EXTERNAL_API_ERROR)
        val selectedOverTradedAt = overTradedAt
            ?: throw BusinessException(CommonError.EXTERNAL_API_ERROR)
        return MarketPriceDto.from(
            marketPriceSnapshot = this,
            localTradedAt = selectedOverTradedAt,
            price = selectedOverPrice,
            session = session,
        )
    }
}
