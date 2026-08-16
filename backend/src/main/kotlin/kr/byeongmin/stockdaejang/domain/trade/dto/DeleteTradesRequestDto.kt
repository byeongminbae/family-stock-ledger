package kr.byeongmin.stockdaejang.domain.trade.dto

data class DeleteTradesRequestDto(
    val ids: List<String>?,
    val side: String?,
)
