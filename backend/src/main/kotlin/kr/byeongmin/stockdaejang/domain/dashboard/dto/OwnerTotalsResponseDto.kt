package kr.byeongmin.stockdaejang.domain.dashboard.dto

data class OwnerTotalsResponseDto(
    val stockCount: Int,
    val costBasis: String,
    val portfolioWeight: String?,
    val currentPrice: Nothing? = null,
    val valuation: String?,
    val unrealizedProfit: String?,
)
