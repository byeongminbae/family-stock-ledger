package kr.byeongmin.stockdaejang.domain.history.dto

import kr.byeongmin.stockdaejang.domain.stock.entity.Security

data class PurchasedStockResponseDto(
    val code: String,
    val name: String,
    val market: String,
    val isEtf: Boolean,
) {
    companion object {
        fun from(security: Security): PurchasedStockResponseDto {
            return PurchasedStockResponseDto(
                code = security.itemCode,
                name = security.stockName,
                market = security.market,
                isEtf = security.isEtf,
            )
        }
    }
}
