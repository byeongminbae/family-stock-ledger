package kr.byeongmin.stockdaejang.domain.trade.dto

data class PositionAverageResponseDto(
    val heldQuantity: String,
    val averageBuyPrice: String?,
)
