package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardBrokerageResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardOwnerResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardStockResponseDto
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import kr.byeongmin.stockdaejang.global.util.sumOfDecimal
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.math.MathContext

@Component
class DashboardTotalsCalculator {
    internal fun calculate(
        owners: List<Owner>,
        stocksByHolding: Map<DashboardHolding, DashboardStockResponseDto>,
        quoteFetchedAt: String?,
        valuationSessions: List<MarketSession>,
        mathContext: MathContext,
    ): DashboardResponseDto {
        val ownerResponses = owners.map { owner ->
            val ownerStocks = stocksByHolding.filterKeys { it.owner.id == owner.id }
            val ownerTotals = totals(ownerStocks.values.toList(), mathContext)
            val brokerages = ownerStocks.entries
                .groupBy { entry -> entry.key.brokerage?.let { it.id to it.code.trimEnd() } }
                .values
                .sortedWith(compareBy(nullsLast()) { it.first().key.brokerage?.name })
                .map { brokerageEntries ->
                    val brokerage = brokerageEntries.first().key.brokerage
                    val stocks = brokerageEntries.map { it.value }
                    val brokerageTotals = totals(stocks, mathContext)
                    DashboardBrokerageResponseDto(
                        brokerageCode = brokerage?.code?.trimEnd(),
                        brokerageName = brokerage?.name,
                        stockCount = brokerageTotals.stockCount,
                        costBasis = brokerageTotals.costBasis,
                        valuation = brokerageTotals.valuation,
                        unrealizedProfit = brokerageTotals.unrealizedProfit,
                        stocks = stocks,
                    )
                }
            DashboardOwnerResponseDto(
                id = owner.id,
                name = owner.name,
                stockCount = ownerTotals.stockCount,
                costBasis = ownerTotals.costBasis,
                valuation = ownerTotals.valuation,
                unrealizedProfit = ownerTotals.unrealizedProfit,
                brokerages = brokerages,
            )
        }
        val stocks = stocksByHolding.values.toList()
        val dashboardTotals = totals(stocks, mathContext)
        return DashboardResponseDto(
            stockCount = dashboardTotals.stockCount,
            quotedStockCount = stocks.asSequence()
                .filter { it.currentPrice != null }
                .map { it.itemCode }
                .distinct()
                .count(),
            costBasis = dashboardTotals.costBasis,
            valuation = dashboardTotals.valuation,
            unrealizedProfit = dashboardTotals.unrealizedProfit,
            owners = ownerResponses,
            quoteFetchedAt = quoteFetchedAt,
            valuationSessions = valuationSessions,
        )
    }

    private fun totals(
        stocks: List<DashboardStockResponseDto>,
        mathContext: MathContext,
    ): Totals {
        val costBasis = stocks.sumOfDecimal(mathContext) { BigDecimal(it.costBasis) }
        val allStocksHaveMarketPrices = stocks.isNotEmpty() && stocks.all {
            it.valuation != null && it.unrealizedProfit != null
        }
        return Totals(
            stockCount = stocks.map { it.itemCode }.distinct().size,
            costBasis = decimalText(costBasis),
            valuation = if (allStocksHaveMarketPrices) {
                decimalText(stocks.sumOfDecimal(mathContext) { BigDecimal(it.valuation.ifNullThrow()) })
            } else {
                null
            },
            unrealizedProfit = if (allStocksHaveMarketPrices) {
                decimalText(stocks.sumOfDecimal(mathContext) { BigDecimal(it.unrealizedProfit.ifNullThrow()) })
            } else {
                null
            },
        )
    }

    private data class Totals(
        val stockCount: Int,
        val costBasis: String,
        val valuation: String?,
        val unrealizedProfit: String?,
    )
}
