package kr.byeongmin.stockdaejang.domain.dashboard.dto

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "소유주 또는 증권사별 보유 종목 합계")
data class OwnerTotalsResponseDto(
    @field:Schema(description = "보유 종목 수", example = "3")
    val stockCount: Int,
    @field:Schema(description = "전체 매입액. 단위와 쉼표가 없는 십진 문자열", example = "2450000")
    val costBasis: String,
    @field:Schema(
        description = "증권사 그룹 합계에서는 100, 소유주 전체 합계에서는 null인 증권사 비중 문자열",
        example = "100",
        nullable = true,
    )
    val portfolioWeight: String?,
    @get:JsonProperty("currentPrice")
    @get:Schema(
        name = "currentPrice",
        description = "현재가. 합계에는 단일 현재가가 없으므로 항상 null입니다.",
        types = ["null"],
        nullable = true,
    )
    val currentPrice: String? = null,
    @field:Schema(description = "전체 평가액. 단위와 쉼표가 없는 십진 문자열이며 모든 보유 종목의 시세가 적용되지 않으면 null", example = "2780000", nullable = true)
    val valuation: String?,
    @field:Schema(description = "평가 손익. 단위와 쉼표가 없는 십진 문자열이며 모든 보유 종목의 시세가 적용되지 않으면 null", example = "330000", nullable = true)
    val unrealizedProfit: String?,
)
