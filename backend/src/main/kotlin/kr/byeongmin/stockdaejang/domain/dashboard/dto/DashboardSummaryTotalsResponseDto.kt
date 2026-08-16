package kr.byeongmin.stockdaejang.domain.dashboard.dto

data class DashboardSummaryTotalsResponseDto(
    val stockCount: Int,
    val quotedStockCount: Int,
    val costBasis: String,
    val valuation: String?,
    val unrealizedProfit: String?,
)
