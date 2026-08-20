package kr.byeongmin.stockdaejang.domain.brokerage.dto

import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage

@Schema(description = "거래 입력과 내역 필터에서 선택하는 증권사 정보")
data class BrokerageResponseDto(
    @field:Schema(
        description = "증권사 코드",
        example = "240",
        pattern = "^[0-9]{3}$",
    )
    val code: String,
    @field:Schema(
        description = "증권사명",
        example = "삼성증권",
    )
    val name: String,
) {
    companion object {
        fun from(brokerage: Brokerage): BrokerageResponseDto {
            return BrokerageResponseDto(
                code = brokerage.code,
                name = brokerage.name,
            )
        }
    }
}
