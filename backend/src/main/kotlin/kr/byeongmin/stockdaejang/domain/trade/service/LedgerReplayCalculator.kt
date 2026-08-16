package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import kr.byeongmin.stockdaejang.domain.trade.error.TradeError
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import java.math.BigInteger
import java.time.Instant

internal object LedgerReplayCalculator {
    fun replay(initialLedgerState: LedgerState, ledgerTrades: List<LedgerTradeDto>): LedgerReplayResultDto {
        var heldQuantity = initialLedgerState.heldQuantity
        var remainingCost = initialLedgerState.remainingCost
        val realizedProfitUpdates = mutableListOf<RealizedProfitUpdateDto>()

        for (trade in ledgerTrades.sortedWith(compareBy(LedgerTradeDto::executedAt, LedgerTradeDto::id))) {
            when (trade.side) {
                TradeSide.BUY -> {
                    heldQuantity += trade.quantity
                    remainingCost += trade.quantity * trade.unitPrice
                }

                TradeSide.SELL -> {
                    if (heldQuantity < trade.quantity) {
                        throw BusinessException(
                            TradeError.INSUFFICIENT_HOLDING,
                            mapOf("quantity" to TradeError.INSUFFICIENT_HOLDING.message),
                        )
                    }
                    val soldCost = divideRoundHalfUp(remainingCost * trade.quantity, heldQuantity)
                    realizedProfitUpdates += RealizedProfitUpdateDto(
                        tradeId = trade.id,
                        realizedProfit = trade.unitPrice * trade.quantity - soldCost,
                    )
                    heldQuantity -= trade.quantity
                    remainingCost -= soldCost
                    if (heldQuantity == BigInteger.ZERO) remainingCost = BigInteger.ZERO
                }
            }
        }
        return LedgerReplayResultDto(LedgerState(heldQuantity, remainingCost), realizedProfitUpdates)
    }

    fun divideRoundHalfUp(numerator: BigInteger, denominator: BigInteger): BigInteger {
        if (denominator <= BigInteger.ZERO) {
            throw BusinessException(CommonError.INTERNAL_SERVER_ERROR)
        }
        val (quotient, remainder) = numerator.divideAndRemainder(denominator)
        return if (remainder * TWO >= denominator) quotient + BigInteger.ONE else quotient
    }

    internal data class LedgerReplayResultDto(
        val state: LedgerState,
        val updates: List<RealizedProfitUpdateDto>,
    )

    internal data class RealizedProfitUpdateDto(
        val tradeId: Long,
        val realizedProfit: BigInteger,
    )

    internal data class LedgerTradeDto(
        val id: Long,
        val side: TradeSide,
        val executedAt: Instant,
        val quantity: BigInteger,
        val unitPrice: BigInteger,
    ) {
        companion object {
            fun from(trade: Trade): LedgerTradeDto {
                return LedgerTradeDto(
                    id = trade.id.ifNullThrow(),
                    side = trade.side,
                    executedAt = trade.executedAt.toInstant(),
                    quantity = BigInteger.valueOf(trade.quantity),
                    unitPrice = BigInteger.valueOf(trade.unitPrice),
                )
            }
        }
    }

    private val TWO = BigInteger.valueOf(2)
}
