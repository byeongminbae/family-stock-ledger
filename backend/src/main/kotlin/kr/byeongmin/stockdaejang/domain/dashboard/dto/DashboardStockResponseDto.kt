package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema
import java.math.BigDecimal

@Schema(description = "증권사에 보유한 개별 종목의 매입 및 평가 정보")
data class DashboardStockResponseDto(
    @field:Schema(
        description = "종목코드",
        example = "005930",
        pattern = "^[0-9A-Z]{6}$",
    )
    val stockCode: String,
    @field:Schema(
        description = "종목명",
        example = "삼성전자",
    )
    val stockName: String,
    @field:Schema(
        description = "보유 수량",
        example = "12",
    )
    val quantity: Int,
    @field:Schema(
        description = "매수평균단가. 원 단위 숫자",
        example = "71200",
    )
    val averageBuyPrice: BigDecimal,
    @field:Schema(
        description = "총 매입액. 원 단위 숫자",
        example = "890000",
    )
    val totalBuyAmount: BigDecimal,
    @field:Schema(
        description = "해당 증권사 총 매입액에서 종목 매입액이 차지하는 비중. 퍼센트 단위 숫자",
        example = "35.42",
    )
    val brokerageWeight: BigDecimal,
    @field:Schema(
        description = "현재가. 원 단위 숫자",
        example = "79800",
    )
    val currentPrice: BigDecimal,
    @field:Schema(
        description = "평가액. 원 단위 숫자",
        example = "997500",
    )
    val valuation: BigDecimal,
    @field:Schema(
        description = "평가 손익. 원 단위 숫자",
        example = "107500",
    )
    val unrealizedProfit: BigDecimal,
    @field:Schema(
        description = "수익률. 퍼센트 단위 숫자",
        example = "12.08",
    )
    val returnRate: BigDecimal,
)
