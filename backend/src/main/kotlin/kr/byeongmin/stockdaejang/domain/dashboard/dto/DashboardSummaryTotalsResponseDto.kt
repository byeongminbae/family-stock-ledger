package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "전체 보유 종목 요약 합계")
data class DashboardSummaryTotalsResponseDto(
    @field:Schema(description = "전체 보유 종목 수", example = "8")
    val stockCount: Int,
    @field:Schema(description = "현재가를 적용한 보유 종목 수", example = "7")
    val quotedStockCount: Int,
    @field:Schema(description = "전체 매입액. 단위와 쉼표가 없는 십진 문자열", example = "12450000")
    val costBasis: String,
    @field:Schema(description = "전체 평가액. 단위와 쉼표가 없는 십진 문자열이며 모든 보유 종목의 시세가 적용되지 않으면 null", example = "13210000", nullable = true)
    val valuation: String?,
    @field:Schema(description = "전체 평가 손익. 단위와 쉼표가 없는 십진 문자열이며 모든 보유 종목의 시세가 적용되지 않으면 null", example = "760000", nullable = true)
    val unrealizedProfit: String?,
)
