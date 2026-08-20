package kr.byeongmin.stockdaejang.domain.trade.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "선택한 소유주·증권사·종목의 보유 수량과 매수평균단가")
data class PositionAverageResponseDto(
    @field:Schema(
        description = "현재 보유 수량을 나타내는 정수 문자열",
        example = "10",
    )
    val heldQuantity: String,
    @field:Schema(
        description = "매수평균단가. 보유 수량이 0이면 null입니다.",
        nullable = true,
        example = "71200",
    )
    val averageBuyPrice: String?,
)
