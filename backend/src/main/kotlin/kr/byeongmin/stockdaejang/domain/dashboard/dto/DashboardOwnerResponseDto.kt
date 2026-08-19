package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "소유주별 대시보드 보유 종목과 합계")
data class DashboardOwnerResponseDto(
    @field:Schema(description = "소유주 ID", example = "1", minimum = "1", maximum = "32767")
    val id: Short,
    @field:Schema(description = "소유주명", example = "병민")
    val name: String,
    @field:Schema(description = "소유주의 증권사별 보유 종목 그룹")
    val brokerageGroups: List<BrokeragePositionGroupResponseDto>,
    @field:Schema(description = "소유주의 전체 보유 종목 합계")
    val totals: OwnerTotalsResponseDto,
)
