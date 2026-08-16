package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardAggregateRowDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardMarketQuoteDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardSnapshotResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.OwnerSummaryDto
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import org.springframework.stereotype.Component
import java.math.MathContext
import java.math.RoundingMode

@Component
class DashboardCalculator(
    private val dashboardPositionCalculator: DashboardPositionCalculator,
    private val dashboardTotalsCalculator: DashboardTotalsCalculator,
) {
    private val mathContext = MathContext(40, RoundingMode.HALF_UP)

    fun summarize(
        ownerSummaries: List<OwnerSummaryDto>,
        dashboardAggregateRows: List<DashboardAggregateRowDto>,
        marketQuotesByItemCode: Map<String, DashboardMarketQuoteDto>,
    ): DashboardSnapshotResponseDto {
        val dashboardPositions = dashboardPositionCalculator.calculate(
            dashboardAggregateRows,
            marketQuotesByItemCode,
            mathContext,
        )
        val applicableMarketQuotes = dashboardPositions.mapNotNull { position ->
            marketQuotesByItemCode[position.itemCode]?.takeIf { position.currentPrice != null }
        }
        val valuationSessions = applicableMarketQuotes.map(DashboardMarketQuoteDto::session).toSet()
        return DashboardSnapshotResponseDto(
            positions = dashboardPositions,
            owners = dashboardTotalsCalculator.owners(ownerSummaries, dashboardPositions, mathContext),
            summaryTotals = dashboardTotalsCalculator.summary(dashboardPositions, mathContext),
            quoteFetchedAt = applicableMarketQuotes.maxOfOrNull(DashboardMarketQuoteDto::quotedAt),
            valuationSessions = MarketSession.entries.filter(valuationSessions::contains),
        )
    }
}
