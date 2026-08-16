package kr.byeongmin.stockdaejang.domain.stock.dto

import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import java.time.OffsetDateTime

data class MarketPriceDto(
    val itemCode: String,
    val localTradedAt: OffsetDateTime,
    val marketStatus: String,
    val price: Long,
    val session: MarketSession,
    val stockName: String,
) {
    companion object {
        fun from(
            marketPriceSnapshot: MarketPriceSnapshotDto,
            localTradedAt: OffsetDateTime,
            price: Long,
            session: MarketSession,
        ): MarketPriceDto {
            return MarketPriceDto(
                itemCode = marketPriceSnapshot.itemCode,
                localTradedAt = localTradedAt,
                marketStatus = marketPriceSnapshot.marketStatus,
                price = price,
                session = session,
                stockName = marketPriceSnapshot.stockName,
            )
        }
    }
}
