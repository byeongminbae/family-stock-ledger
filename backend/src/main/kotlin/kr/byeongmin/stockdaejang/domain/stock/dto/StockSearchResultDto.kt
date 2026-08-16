package kr.byeongmin.stockdaejang.domain.stock.dto

data class StockSearchResultDto(
    val code: String,
    val isEtf: Boolean?,
    val isStock: Boolean,
    val isKorean: Boolean,
    val hasDomesticStockPage: Boolean,
    val market: String,
    val name: String,
)
