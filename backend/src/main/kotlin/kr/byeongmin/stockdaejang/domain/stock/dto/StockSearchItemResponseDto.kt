package kr.byeongmin.stockdaejang.domain.stock.dto

import kr.byeongmin.stockdaejang.global.util.ifNullThrow

data class StockSearchItemResponseDto(
    val code: String,
    val isEtf: Boolean,
    val market: String,
    val name: String,
) {
    companion object {
        fun from(stockSearchResult: StockSearchResultDto): StockSearchItemResponseDto {
            return StockSearchItemResponseDto(
                code = stockSearchResult.code,
                isEtf = stockSearchResult.isEtf.ifNullThrow(),
                market = stockSearchResult.market,
                name = stockSearchResult.name,
            )
        }
    }
}
