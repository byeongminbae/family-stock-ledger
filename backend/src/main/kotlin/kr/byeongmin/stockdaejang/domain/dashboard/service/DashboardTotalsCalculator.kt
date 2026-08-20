package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardBrokerageResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardOwnerResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardStockResponseDto
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
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
        valuationSession: MarketSession?,
        mathContext: MathContext,
    ): DashboardResponseDto {
        val ownerResponses = owners.map { owner ->
            val ownerStocks = stocksByHolding.filterKeys { it.owner.id == owner.id }
            val ownerTotals = totals(ownerStocks.values.toList(), mathContext)
            val brokerages = ownerStocks.entries
                .groupBy { entry -> entry.key.brokerage.id to entry.key.brokerage.code.trimEnd() }
                .values
                .sortedBy { it.first().key.brokerage.name }
                .map { brokerageEntries ->
                    val brokerage = brokerageEntries.first().key.brokerage
                    val stocks = brokerageEntries.map { it.value }
                    val brokerageTotals = totals(stocks, mathContext)
                    DashboardBrokerageResponseDto(
                        brokerageCode = brokerage.code.trimEnd(),
                        brokerageName = brokerage.name,
                        stockCount = brokerageTotals.stockCount,
                        totalBuyAmount = brokerageTotals.totalBuyAmount,
                        valuation = brokerageTotals.valuation,
                        unrealizedProfit = brokerageTotals.unrealizedProfit,
                        stocks = stocks,
                    )
                }
            DashboardOwnerResponseDto(
                ownerId = owner.id,
                ownerName = owner.name,
                stockCount = ownerTotals.stockCount,
                totalBuyAmount = ownerTotals.totalBuyAmount,
                valuation = ownerTotals.valuation,
                unrealizedProfit = ownerTotals.unrealizedProfit,
                brokerages = brokerages,
            )
        }
        val stocks = stocksByHolding.values.toList()
        val dashboardTotals = totals(stocks, mathContext)
        return DashboardResponseDto(
            stockCount = dashboardTotals.stockCount,
            checkedStockCount = stocks.asSequence()
                .map { it.stockCode }
                .distinct()
                .count(),
            totalBuyAmount = dashboardTotals.totalBuyAmount,
            valuation = dashboardTotals.valuation,
            unrealizedProfit = dashboardTotals.unrealizedProfit,
            owners = ownerResponses,
            quoteFetchedAt = quoteFetchedAt,
            valuationSession = valuationSession,
        )
    }

    private fun totals(
        stocks: List<DashboardStockResponseDto>,
        mathContext: MathContext,
    ): Totals {
        val totalBuyAmount = stocks.sumOfDecimal(mathContext, DashboardStockResponseDto::totalBuyAmount)
        return Totals(
            stockCount = stocks.map { it.stockCode }.distinct().size,
            totalBuyAmount = totalBuyAmount,
            valuation = stocks.sumOfDecimal(mathContext, DashboardStockResponseDto::valuation),
            unrealizedProfit = stocks.sumOfDecimal(mathContext, DashboardStockResponseDto::unrealizedProfit),
        )
    }

    private data class Totals(
        val stockCount: Int,
        val totalBuyAmount: BigDecimal,
        val valuation: BigDecimal,
        val unrealizedProfit: BigDecimal,
    )
}
