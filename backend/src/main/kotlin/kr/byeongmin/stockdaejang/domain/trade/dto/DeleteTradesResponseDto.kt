package kr.byeongmin.stockdaejang.domain.trade.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "거래 삭제 결과")
data class DeleteTradesResponseDto(
    @field:Schema(
        description = "실제로 삭제된 거래 건수",
        example = "2",
    )
    val deletedCount: Int,
) {
    companion object {
        fun of(deletedCount: Int): DeleteTradesResponseDto {
            return DeleteTradesResponseDto(deletedCount)
        }
    }
}
