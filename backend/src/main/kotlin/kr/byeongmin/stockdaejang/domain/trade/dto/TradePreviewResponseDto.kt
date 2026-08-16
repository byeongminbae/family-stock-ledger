package kr.byeongmin.stockdaejang.domain.trade.dto

data class TradePreviewResponseDto(
    val amount: String,
    val heldQuantity: String,
    val averageBuyPrice: String?,
    val expectedProfit: String?,
    val quantityError: String?,
)
