package kr.byeongmin.stockdaejang.domain.stock.provider

import kr.byeongmin.stockdaejang.domain.stock.dto.StockSearchResultDto

fun interface StockSearchProvider {
    fun search(query: String): List<StockSearchResultDto>
}
