package kr.byeongmin.stockdaejang.domain.dashboard.dto

data class DashboardPositionResponseDto(
    val ownerId: Short,
    val ownerName: String,
    val brokerageCode: String?,
    val brokerageName: String?,
    val itemCode: String,
    val stockName: String,
    val heldQuantity: String,
    val averageBuyPrice: String,
    val costBasis: String,
    val portfolioWeight: String?,
    val currentPrice: String?,
    val valuation: String?,
    val unrealizedProfit: String?,
    val returnRate: String?,
)
