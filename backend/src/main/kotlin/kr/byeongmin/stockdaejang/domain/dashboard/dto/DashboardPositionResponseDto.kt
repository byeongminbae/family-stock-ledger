package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "보유 종목의 대시보드 표시 정보")
data class DashboardPositionResponseDto(
    @field:Schema(description = "소유주 ID", example = "1", minimum = "1", maximum = "32767")
    val ownerId: Short,
    @field:Schema(description = "소유주명", example = "병민")
    val ownerName: String,
    @field:Schema(
        description = "증권사 코드. 증권사가 지정되지 않은 레거시 거래이면 null입니다.",
        example = "264",
        pattern = "^[0-9]{3}$",
        nullable = true,
    )
    val brokerageCode: String?,
    @field:Schema(
        description = "증권사명. 증권사가 지정되지 않은 레거시 거래이면 null이며 화면에는 '미지정 증권사'로 표시합니다.",
        example = "키움증권",
        nullable = true,
    )
    val brokerageName: String?,
    @field:Schema(description = "종목코드", example = "005930", pattern = "^[0-9A-Z]{6}$")
    val itemCode: String,
    @field:Schema(description = "종목명", example = "삼성전자")
    val stockName: String,
    @field:Schema(description = "보유 수량. 단위와 쉼표가 없는 정수 문자열", example = "12")
    val heldQuantity: String,
    @field:Schema(description = "매수평균단가. 단위와 쉼표가 없는 십진 문자열", example = "71200")
    val averageBuyPrice: String,
    @field:Schema(description = "매입액. 단위와 쉼표가 없는 십진 문자열", example = "890000")
    val costBasis: String,
    @field:Schema(
        description = "같은 소유주·증권사의 전체 매입액에서 이 종목의 매입액이 차지하는 증권사 비중. 퍼센트 기호와 쉼표가 없는 십진 문자열이며 기준 매입액이 0이면 null입니다.",
        example = "35.42",
        nullable = true,
    )
    val portfolioWeight: String?,
    @field:Schema(description = "현재가. 단위와 쉼표가 없는 십진 문자열이며 시세를 조회할 수 없으면 null", example = "79800", nullable = true)
    val currentPrice: String?,
    @field:Schema(description = "평가액. 단위와 쉼표가 없는 십진 문자열이며 시세를 조회할 수 없으면 null", example = "997500", nullable = true)
    val valuation: String?,
    @field:Schema(description = "평가 손익. 단위와 쉼표가 없는 십진 문자열이며 시세를 조회할 수 없으면 null", example = "107500", nullable = true)
    val unrealizedProfit: String?,
    @field:Schema(description = "수익률. 퍼센트 단위와 쉼표가 없는 십진 문자열이며 시세를 조회할 수 없으면 null", example = "12.08", nullable = true)
    val returnRate: String?,
)
