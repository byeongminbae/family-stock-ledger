package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema
import java.math.BigDecimal

@Schema(description = "소유주별 보유 종목 현황과 평가 합계")
data class DashboardOwnerResponseDto(
    @field:Schema(
        description = "소유주 ID",
        example = "1",
        minimum = "1",
    )
    val ownerId: Long,
    @field:Schema(
        description = "소유주명",
        example = "병민",
    )
    val ownerName: String,
    @field:Schema(
        description = "소유주의 보유 종목 수. 여러 증권사에 같은 종목을 보유해도 한 종목으로 계산",
        example = "3",
    )
    val stockCount: Int,
    @field:Schema(
        description = "소유주의 총 매입액. 원 단위 숫자",
        example = "2450000",
    )
    val totalBuyAmount: BigDecimal,
    @field:Schema(
        description = "소유주의 총 평가액. 원 단위 숫자",
        example = "2780000",
    )
    val valuation: BigDecimal,
    @field:Schema(
        description = "소유주의 총 평가 손익. 원 단위 숫자",
        example = "330000",
    )
    val unrealizedProfit: BigDecimal,
    @field:Schema(description = "소유주가 이용하는 증권사별 보유 현황")
    val brokerages: List<DashboardBrokerageResponseDto>,
)
