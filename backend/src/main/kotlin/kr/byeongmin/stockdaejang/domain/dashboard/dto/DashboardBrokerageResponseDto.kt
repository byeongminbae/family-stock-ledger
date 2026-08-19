package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "증권사별 보유 종목 현황과 평가 합계")
data class DashboardBrokerageResponseDto(
    @field:Schema(description = "증권사 코드. 증권사가 지정되지 않은 거래 그룹이면 null", example = "264", pattern = "^[0-9]{3}$", nullable = true)
    val brokerageCode: String?,
    @field:Schema(description = "증권사명. 증권사가 지정되지 않은 거래 그룹이면 null이며 화면에는 미지정 증권사로 표시", example = "키움증권", nullable = true)
    val brokerageName: String?,
    @field:Schema(description = "증권사의 보유 종목 수", example = "3")
    val stockCount: Int,
    @field:Schema(description = "증권사의 총 매입액. 원 단위의 쉼표 없는 십진 문자열", example = "2450000")
    val costBasis: String,
    @field:Schema(description = "증권사의 총 평가액. 일부 보유 종목의 현재가가 없으면 null", example = "2780000", nullable = true)
    val valuation: String?,
    @field:Schema(description = "증권사의 총 평가 손익. 일부 보유 종목의 현재가가 없으면 null", example = "330000", nullable = true)
    val unrealizedProfit: String?,
    @field:Schema(description = "증권사에 보유한 종목 목록")
    val stocks: List<DashboardStockResponseDto>,
)
