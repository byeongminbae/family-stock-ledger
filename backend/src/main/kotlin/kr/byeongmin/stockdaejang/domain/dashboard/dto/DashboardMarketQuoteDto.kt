package kr.byeongmin.stockdaejang.domain.dashboard.dto

import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession

data class DashboardMarketQuoteDto(
    val itemCode: String,
    val currentPrice: String,
    val quotedAt: String,
    val session: MarketSession,
) {
    companion object {
        fun from(marketPrice: MarketPriceDto): DashboardMarketQuoteDto {
            return DashboardMarketQuoteDto(
                itemCode = marketPrice.itemCode,
                currentPrice = marketPrice.price.toString(),
                quotedAt = marketPrice.localTradedAt.toString(),
                session = marketPrice.session,
            )
        }
    }
}
