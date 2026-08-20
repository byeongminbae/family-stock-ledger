package kr.byeongmin.stockdaejang.domain.trade.dto

internal data class ParsedPositionDto(
    val ownerId: Long,
    val brokerageCode: String,
    val itemCode: String,
)
