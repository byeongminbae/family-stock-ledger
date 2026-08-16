package kr.byeongmin.stockdaejang.domain.brokerage.dto

import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage

data class BrokerageResponseDto(
    val code: String,
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
