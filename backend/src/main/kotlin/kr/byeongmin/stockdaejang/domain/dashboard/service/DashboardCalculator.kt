package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardResponseDto
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import org.springframework.stereotype.Component
import java.math.MathContext
import java.math.RoundingMode

@Component
class DashboardCalculator(
    private val dashboardPositionCalculator: DashboardPositionCalculator = DashboardPositionCalculator(),
    private val dashboardTotalsCalculator: DashboardTotalsCalculator = DashboardTotalsCalculator(),
) {
    private val mathContext = MathContext(40, RoundingMode.HALF_UP)

    internal fun calculate(
        owners: List<Owner>,
        holdings: List<DashboardHolding>,
        marketPricesByItemCode: Map<String, MarketPriceDto>,
    ): DashboardResponseDto {
        val stocksByHolding = dashboardPositionCalculator.calculate(
            holdings,
            marketPricesByItemCode,
            mathContext,
        )
        val applicableMarketPrices = stocksByHolding.keys.map { holding ->
            marketPricesByItemCode.getValue(holding.security.itemCode)
        }
        val latestAppliedQuote = applicableMarketPrices.maxWithOrNull(
            compareBy<MarketPriceDto>(MarketPriceDto::localTradedAt)
                .thenBy(MarketPriceDto::itemCode)
                .thenBy { it.session.ordinal },
        )
        return dashboardTotalsCalculator.calculate(
            owners = owners,
            stocksByHolding = stocksByHolding,
            quoteFetchedAt = latestAppliedQuote?.localTradedAt?.toString(),
            valuationSession = latestAppliedQuote?.session,
            mathContext = mathContext,
        )
    }
}
