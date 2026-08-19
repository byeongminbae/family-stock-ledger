package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "증권사에 보유한 개별 종목의 매입 및 평가 정보")
data class DashboardStockResponseDto(
    @field:Schema(description = "종목코드", example = "005930", pattern = "^[0-9A-Z]{6}$")
    val itemCode: String,
    @field:Schema(description = "종목명", example = "삼성전자")
    val stockName: String,
    @field:Schema(description = "보유 수량. 단위와 쉼표 없는 십진 문자열", example = "12")
    val heldQuantity: String,
    @field:Schema(description = "매수평균단가. 원 단위의 쉼표 없는 십진 문자열", example = "71200")
    val averageBuyPrice: String,
    @field:Schema(description = "매입액. 원 단위의 쉼표 없는 십진 문자열", example = "890000")
    val costBasis: String,
    @field:Schema(description = "해당 증권사 총 매입액에서 종목 매입액이 차지하는 비중. 퍼센트 기호 없는 십진 문자열이며 기준 매입액이 0이면 null", example = "35.42", nullable = true)
    val brokerageWeight: String?,
    @field:Schema(description = "현재가. 원 단위의 쉼표 없는 십진 문자열이며 조회하지 못하면 null", example = "79800", nullable = true)
    val currentPrice: String?,
    @field:Schema(description = "평가액. 원 단위의 쉼표 없는 십진 문자열이며 현재가가 없으면 null", example = "997500", nullable = true)
    val valuation: String?,
    @field:Schema(description = "평가 손익. 원 단위의 쉼표 없는 십진 문자열이며 현재가가 없으면 null", example = "107500", nullable = true)
    val unrealizedProfit: String?,
    @field:Schema(description = "수익률. 퍼센트 기호 없는 십진 문자열이며 현재가가 없으면 null", example = "12.08", nullable = true)
    val returnRate: String?,
)
