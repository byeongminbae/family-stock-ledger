package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.trade.dto.PositionAverageResponseDto
import kr.byeongmin.stockdaejang.domain.trade.dto.ParsedPreviewDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradePreviewResponseDto
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import org.springframework.stereotype.Component
import java.math.BigInteger
import java.math.RoundingMode
import java.text.NumberFormat
import java.util.Locale

@Component
class TradePreviewCalculator {
    internal fun positionAverage(state: LedgerState): PositionAverageResponseDto {
        return PositionAverageResponseDto(
            heldQuantity = state.heldQuantity.toString(),
            averageBuyPrice = averagePrice(state),
        )
    }

    internal fun preview(parsedPreview: ParsedPreviewDto, state: LedgerState): TradePreviewResponseDto {
        val amount = parsedPreview.quantity * parsedPreview.unitPrice
        val quantityError = quantityError(parsedPreview, state)
        val expectedProfit = if (parsedPreview.side == TradeSide.SELL && quantityError == null) {
            val soldCost = LedgerReplayCalculator.divideRoundHalfUp(
                state.remainingCost * parsedPreview.quantity,
                state.heldQuantity,
            )
            (amount - soldCost).toString()
        } else {
            null
        }
        return TradePreviewResponseDto(
            amount = amount.toString(),
            heldQuantity = state.heldQuantity.toString(),
            averageBuyPrice = averagePrice(state),
            expectedProfit = expectedProfit,
            quantityError = quantityError,
        )
    }

    private fun quantityError(parsedPreview: ParsedPreviewDto, state: LedgerState): String? {
        return when {
            parsedPreview.side != TradeSide.SELL -> null
            state.heldQuantity == BigInteger.ZERO -> "선택한 증권사에 보유 수량이\u00a0없습니다."
            parsedPreview.quantity > state.heldQuantity ->
                "보유 수량 ${formatQuantity(state.heldQuantity)}주를 초과할 수 없습니다."
            else -> null
        }
    }

    private fun averagePrice(state: LedgerState): String? {
        if (state.heldQuantity == BigInteger.ZERO) return null
        return state.remainingCost.toBigDecimal()
            .divide(state.heldQuantity.toBigDecimal(), 16, RoundingMode.HALF_UP)
            .toPlainString()
    }

    private fun formatQuantity(quantity: BigInteger): String {
        return NumberFormat.getIntegerInstance(Locale.KOREA).format(quantity)
    }
}
