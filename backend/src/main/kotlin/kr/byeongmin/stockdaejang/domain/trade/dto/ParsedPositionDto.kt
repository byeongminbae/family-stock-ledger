package kr.byeongmin.stockdaejang.domain.trade.dto

internal data class ParsedPositionDto(
    val ownerId: Short,
    val brokerageCode: String,
    val itemCode: String,
)
