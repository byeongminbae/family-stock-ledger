package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.stereotype.Component
import java.math.BigInteger

@Component
class LedgerStateCalculator {
    internal fun calculate(entries: List<PersistedLedgerEntryDto>): LedgerState {
        var heldQuantity = BigInteger.ZERO
        var remainingCost = BigInteger.ZERO
        entries.forEach { entry ->
            val amount = entry.quantity * entry.unitPrice
            when (entry.side) {
                TradeSide.BUY -> {
                    heldQuantity += entry.quantity
                    remainingCost += amount
                }

                TradeSide.SELL -> {
                    heldQuantity -= entry.quantity
                    val realizedProfit = entry.realizedProfit
                        ?: throw BusinessException(CommonError.NULL_CASTING_ERROR)
                    remainingCost -= amount - realizedProfit
                }
            }
        }
        return LedgerState(heldQuantity, remainingCost)
    }

    internal data class PersistedLedgerEntryDto(
        val side: TradeSide,
        val quantity: BigInteger,
        val unitPrice: BigInteger,
        val realizedProfit: BigInteger?,
    ) {
        companion object {
            fun from(trade: Trade): PersistedLedgerEntryDto {
                return PersistedLedgerEntryDto(
                    side = trade.side,
                    quantity = BigInteger.valueOf(trade.quantity),
                    unitPrice = BigInteger.valueOf(trade.unitPrice),
                    realizedProfit = trade.realizedProfit,
                )
            }
        }
    }
}
