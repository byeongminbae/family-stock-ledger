package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema
import java.math.BigDecimal

@Schema(description = "증권사별 보유 종목 현황과 평가 합계")
data class DashboardBrokerageResponseDto(
    @field:Schema(
        description = "증권사 코드",
        example = "264",
        pattern = "^[0-9]{3}$",
    )
    val brokerageCode: String,

    @field:Schema(
        description = "증권사명",
        example = "키움증권",
    )
    val brokerageName: String,

    @field:Schema(
        description = "증권사의 보유 종목 수",
        example = "3",
    )
    val stockCount: Int,

    @field:Schema(
        description = "증권사의 총 매입액. 원 단위 숫자",
        example = "2450000",
    )
    val totalBuyAmount: BigDecimal,

    @field:Schema(
        description = "증권사의 총 평가액. 원 단위 숫자",
        example = "2780000",
    )
    val valuation: BigDecimal,

    @field:Schema(
        description = "증권사의 총 평가 손익. 원 단위 숫자",
        example = "330000",
    )
    val unrealizedProfit: BigDecimal,

    @field:Schema(description = "증권사에 보유한 종목 목록")
    val stocks: List<DashboardStockResponseDto>,
)
