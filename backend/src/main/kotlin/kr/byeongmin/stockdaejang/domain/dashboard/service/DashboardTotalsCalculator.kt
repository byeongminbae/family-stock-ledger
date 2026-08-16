package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.dashboard.dto.BrokeragePositionGroupResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardPositionResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardOwnerResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardSummaryTotalsResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.OwnerTotalsResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.OwnerSummaryDto
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import kr.byeongmin.stockdaejang.global.util.sumOfDecimal
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.math.MathContext

@Component
class DashboardTotalsCalculator {
    fun owners(
        ownerSummaries: List<OwnerSummaryDto>,
        positions: List<DashboardPositionResponseDto>,
        mathContext: MathContext,
    ): List<DashboardOwnerResponseDto> {
        return ownerSummaries.map { ownerSummary ->
            val ownerPositions = positions.filter { it.ownerId == ownerSummary.id }
            val brokerageGroups = ownerPositions
                .groupBy { it.brokerageCode }
                .values
                .sortedWith(compareBy(nullsLast()) { it.first().brokerageName })
                .map { brokeragePositions ->
                    BrokeragePositionGroupResponseDto(
                        brokerageCode = brokeragePositions.first().brokerageCode,
                        brokerageName = brokeragePositions.first().brokerageName,
                        positions = brokeragePositions,
                        totals = totals(brokeragePositions, portfolioWeight = "100", mathContext),
                    )
                }
            DashboardOwnerResponseDto(
                id = ownerSummary.id,
                name = ownerSummary.name,
                brokerageGroups = brokerageGroups,
                totals = totals(ownerPositions, portfolioWeight = null, mathContext),
            )
        }
    }

    fun summary(
        positions: List<DashboardPositionResponseDto>,
        mathContext: MathContext,
    ): DashboardSummaryTotalsResponseDto {
        val summaryTotals = totals(positions, portfolioWeight = null, mathContext)
        return DashboardSummaryTotalsResponseDto(
            stockCount = summaryTotals.stockCount,
            quotedStockCount = positions.asSequence()
                .filter { it.currentPrice != null }
                .map { it.itemCode }
                .distinct()
                .count(),
            costBasis = summaryTotals.costBasis,
            valuation = summaryTotals.valuation,
            unrealizedProfit = summaryTotals.unrealizedProfit,
        )
    }

    private fun totals(
        positions: List<DashboardPositionResponseDto>,
        portfolioWeight: String?,
        mathContext: MathContext,
    ): OwnerTotalsResponseDto {
        val costBasis = positions.sumOfDecimal(mathContext) { BigDecimal(it.costBasis) }
        val allPositionsHaveMarketQuotes = positions.isNotEmpty() && positions.all {
            it.valuation != null && it.unrealizedProfit != null
        }
        return OwnerTotalsResponseDto(
            stockCount = positions.map { it.itemCode }.distinct().size,
            costBasis = decimalText(costBasis),
            portfolioWeight = portfolioWeight?.let { if (positions.isEmpty()) "0" else it },
            valuation = if (allPositionsHaveMarketQuotes) {
                decimalText(positions.sumOfDecimal(mathContext) { BigDecimal(it.valuation.ifNullThrow()) })
            } else {
                null
            },
            unrealizedProfit = if (allPositionsHaveMarketQuotes) {
                decimalText(positions.sumOfDecimal(mathContext) { BigDecimal(it.unrealizedProfit.ifNullThrow()) })
            } else {
                null
            },
        )
    }
}
