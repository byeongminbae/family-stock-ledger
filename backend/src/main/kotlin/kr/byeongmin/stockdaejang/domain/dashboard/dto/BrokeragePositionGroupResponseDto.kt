package kr.byeongmin.stockdaejang.domain.dashboard.dto

data class BrokeragePositionGroupResponseDto(
    val brokerageCode: String?,
    val brokerageName: String?,
    val positions: List<DashboardPositionResponseDto>,
    val totals: OwnerTotalsResponseDto,
)
