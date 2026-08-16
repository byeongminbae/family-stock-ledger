package kr.byeongmin.stockdaejang.domain.dashboard.dto

import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession

data class DashboardSnapshotResponseDto(
    val positions: List<DashboardPositionResponseDto>,
    val owners: List<DashboardOwnerResponseDto>,
    val summaryTotals: DashboardSummaryTotalsResponseDto,
    val quoteFetchedAt: String?,
    val valuationSessions: List<MarketSession>,
)
