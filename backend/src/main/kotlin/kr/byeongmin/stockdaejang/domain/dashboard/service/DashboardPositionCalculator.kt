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
        val costBasisByHolding = holdings.associateWith { holding ->
            val heldQuantity = holding.boughtQuantity.subtract(holding.soldQuantity, mathContext)
            val averageBuyPrice = holding.totalBuyAmount.divide(holding.boughtQuantity, mathContext)
            heldQuantity.multiply(averageBuyPrice, mathContext)
        }
        val brokerageCostByIdentity = holdings
            .groupBy { holding -> holding.owner.id to holding.brokerageIdentity() }
            .mapValues { (_, brokerageHoldings) ->
                brokerageHoldings.sumOfDecimal(mathContext) { costBasisByHolding.getValue(it) }
            }

        return holdings.associateWith { holding ->
            val heldQuantity = holding.boughtQuantity.subtract(holding.soldQuantity, mathContext)
            val averageBuyPrice = holding.totalBuyAmount.divide(holding.boughtQuantity, mathContext)
            val costBasis = costBasisByHolding.getValue(holding)
            val brokerageCost = brokerageCostByIdentity.getValue(holding.owner.id to holding.brokerageIdentity())
            val marketPrice = marketPricesByItemCode[holding.security.itemCode]?.takeIf { it.price > 0 }
            val valuation = marketPrice?.let {
                BigDecimal.valueOf(it.price).multiply(heldQuantity, mathContext)
            }
            val unrealizedProfit = valuation?.subtract(costBasis, mathContext)
            DashboardStockResponseDto(
                itemCode = holding.security.itemCode,
                stockName = holding.security.stockName,
                heldQuantity = decimalText(heldQuantity),
                averageBuyPrice = decimalText(averageBuyPrice),
                costBasis = decimalText(costBasis),
                brokerageWeight = percentage(costBasis, brokerageCost, mathContext),
                currentPrice = marketPrice?.price?.toString(),
                valuation = valuation?.let(::decimalText),
                unrealizedProfit = unrealizedProfit?.let(::decimalText),
                returnRate = unrealizedProfit?.let { percentage(it, costBasis, mathContext) },
            )
        }
    }

    private fun percentage(amount: BigDecimal, totalAmount: BigDecimal, mathContext: MathContext): String? {
        return if (totalAmount.signum() == 0) {
            null
        } else {
            decimalText(amount.divide(totalAmount, mathContext).multiply(HUNDRED))
        }
    }

    private companion object {
        val HUNDRED = BigDecimal(100)
    }
}

private fun DashboardHolding.brokerageIdentity(): Pair<Long?, String>? {
    return brokerage?.let { it.id to it.code.trimEnd() }
}

internal fun decimalText(value: BigDecimal): String {
    val rounded = value.setScale(18, RoundingMode.HALF_UP).stripTrailingZeros()
    return if (rounded.signum() == 0) "0" else rounded.toPlainString()
}
