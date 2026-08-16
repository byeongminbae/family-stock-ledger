package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardAggregateRowDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardMarketQuoteDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardPositionResponseDto
import kr.byeongmin.stockdaejang.global.util.sumOfDecimal
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.math.MathContext

@Component
class DashboardPositionCalculator {
    fun calculate(
        dashboardAggregateRows: List<DashboardAggregateRowDto>,
        marketQuotesByItemCode: Map<String, DashboardMarketQuoteDto>,
        mathContext: MathContext,
    ): List<DashboardPositionResponseDto> {
        val positionBases = dashboardAggregateRows.map { aggregateRow -> aggregateRow.toPositionBase(mathContext) }
        val brokerageCostByOwnerAndBrokerage = positionBases
            .groupBy { it.aggregateRow.ownerId to it.aggregateRow.brokerageCode }
            .mapValues { (_, brokeragePositionBases) ->
                brokeragePositionBases.sumOfDecimal(mathContext, DashboardAggregateRowDto.PositionBaseDto::costBasis)
            }

        return positionBases.map { positionBase ->
            val brokerageCost = brokerageCostByOwnerAndBrokerage.getValue(
                positionBase.aggregateRow.ownerId to positionBase.aggregateRow.brokerageCode,
            )
            val marketQuote = marketQuotesByItemCode[positionBase.aggregateRow.itemCode]
                ?.takeIf { POSITIVE_INTEGER.matches(it.currentPrice) }
            val valuation = marketQuote?.let {
                BigDecimal(it.currentPrice).multiply(positionBase.heldQuantity, mathContext)
            }
            val unrealizedProfit = valuation?.subtract(positionBase.costBasis, mathContext)
            DashboardPositionResponseDto(
                ownerId = positionBase.aggregateRow.ownerId,
                ownerName = positionBase.aggregateRow.ownerName,
                brokerageCode = positionBase.aggregateRow.brokerageCode,
                brokerageName = positionBase.aggregateRow.brokerageName,
                itemCode = positionBase.aggregateRow.itemCode,
                stockName = positionBase.aggregateRow.stockName,
                heldQuantity = decimalText(positionBase.heldQuantity),
                averageBuyPrice = decimalText(positionBase.averageBuyPrice),
                costBasis = decimalText(positionBase.costBasis),
                portfolioWeight = percentage(positionBase.costBasis, brokerageCost, mathContext),
                currentPrice = marketQuote?.currentPrice,
                valuation = valuation?.let(::decimalText),
                unrealizedProfit = unrealizedProfit?.let(::decimalText),
                returnRate = unrealizedProfit?.let { percentage(it, positionBase.costBasis, mathContext) },
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
        val POSITIVE_INTEGER = Regex("^[1-9][0-9]*$")
    }
}

internal fun decimalText(value: BigDecimal): String {
    val rounded = value.setScale(18, java.math.RoundingMode.HALF_UP).stripTrailingZeros()
    return if (rounded.signum() == 0) "0" else rounded.toPlainString()
}
