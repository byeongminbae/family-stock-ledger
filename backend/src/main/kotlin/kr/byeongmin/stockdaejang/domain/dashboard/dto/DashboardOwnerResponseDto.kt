package kr.byeongmin.stockdaejang.domain.dashboard.dto

data class DashboardOwnerResponseDto(
    val id: Short,
    val name: String,
    val brokerageGroups: List<BrokeragePositionGroupResponseDto>,
    val totals: OwnerTotalsResponseDto,
)
