package kr.byeongmin.stockdaejang.domain.trade.dto

data class TradePreviewRequestDto(
    val brokerageCode: String?,
    val itemCode: String?,
    val ownerId: Int?,
    val quantity: String?,
    val side: String?,
    val unitPrice: String?,
)
