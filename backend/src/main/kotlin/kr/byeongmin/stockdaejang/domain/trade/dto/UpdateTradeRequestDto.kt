package kr.byeongmin.stockdaejang.domain.trade.dto

data class UpdateTradeRequestDto(
    val id: String?,
    val brokerageCode: String?,
    val executedAt: String?,
    val isEtf: Boolean?,
    val itemCode: String?,
    val market: String?,
    val ownerId: Int?,
    val quantity: String?,
    val securityName: String?,
    val side: String?,
    val unitPrice: String?,
)
