package kr.byeongmin.stockdaejang.domain.trade.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "등록 또는 수정된 거래의 ID")
data class TradeIdResponseDto(
    @field:Schema(
        description = "거래 ID. 1 이상 9223372036854775807 이하의 정수 문자열",
        minLength = 1,
        maxLength = 19,
        pattern = "^[1-9][0-9]{0,18}$",
        example = "1",
    )
    val id: String,
) {
    companion object {
        fun of(id: Long): TradeIdResponseDto {
            return TradeIdResponseDto(id.toString())
        }
    }
}
