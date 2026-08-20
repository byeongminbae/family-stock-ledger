package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardStockResponseDto
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.global.util.sumOfDecimal
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode

@Component
class DashboardPositionCalculator {
    internal fun calculate(
        holdings: List<DashboardHolding>,
        marketPricesByItemCode: Map<String, MarketPriceDto>,
        mathContext: MathContext,
    ): Map<DashboardHolding, DashboardStockResponseDto> {
        val totalBuyAmountByHolding = holdings.associateWith { holding ->
            val remainingQuantity = holding.boughtQuantity.subtract(holding.soldQuantity, mathContext)
            val averageBuyPrice = holding.grossBuyAmount.divide(holding.boughtQuantity, mathContext)
            remainingQuantity.multiply(averageBuyPrice, mathContext)
        }
        val brokerageCostByIdentity = holdings
            .groupBy { holding -> holding.owner.id to holding.brokerageIdentity() }
            .mapValues { (_, brokerageHoldings) ->
                brokerageHoldings.sumOfDecimal(mathContext) { totalBuyAmountByHolding.getValue(it) }
            }

        return holdings.associateWith { holding ->
            val remainingQuantity = holding.boughtQuantity.subtract(holding.soldQuantity, mathContext)
            val averageBuyPrice = holding.grossBuyAmount.divide(holding.boughtQuantity, mathContext)
            val totalBuyAmount = totalBuyAmountByHolding.getValue(holding)
            val brokerageCost = brokerageCostByIdentity.getValue(holding.owner.id to holding.brokerageIdentity())
            val marketPrice = checkNotNull(marketPricesByItemCode[holding.security.itemCode]) {
                "Dashboard market price is required for ${holding.security.itemCode}"
            }
            val currentPrice = BigDecimal.valueOf(marketPrice.price)
            val valuation = currentPrice.multiply(remainingQuantity, mathContext)
            val unrealizedProfit = valuation.subtract(totalBuyAmount, mathContext)
            DashboardStockResponseDto(
                stockCode = holding.security.itemCode,
                stockName = holding.security.stockName,
                quantity = remainingQuantity.intValueExact(),
                averageBuyPrice = averageBuyPrice.normalized(),
                totalBuyAmount = totalBuyAmount.normalized(),
                brokerageWeight = percentage(totalBuyAmount, brokerageCost, mathContext),
                currentPrice = currentPrice,
                valuation = valuation.normalized(),
                unrealizedProfit = unrealizedProfit.normalized(),
                returnRate = percentage(unrealizedProfit, totalBuyAmount, mathContext),
            )
        }
    }

    private fun percentage(amount: BigDecimal, totalAmount: BigDecimal, mathContext: MathContext): BigDecimal {
        return if (totalAmount.signum() == 0) {
            BigDecimal.ZERO
        } else {
            amount.divide(totalAmount, mathContext).multiply(HUNDRED).normalized()
        }
    }

    private companion object {
        val HUNDRED = BigDecimal(100)
    }
}

private fun DashboardHolding.brokerageIdentity(): Pair<Long, String> {
    return checkNotNull(brokerage.id) { "Dashboard brokerage must be persisted" } to brokerage.code.trimEnd()
}

private fun BigDecimal.normalized(): BigDecimal {
    val normalized = setScale(18, RoundingMode.HALF_UP).stripTrailingZeros()
    return when {
        normalized.signum() == 0 -> BigDecimal.ZERO
        normalized.scale() < 0 -> normalized.setScale(0)
        else -> normalized
    }
}
