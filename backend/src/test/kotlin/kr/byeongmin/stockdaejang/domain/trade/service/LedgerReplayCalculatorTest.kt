package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import kr.byeongmin.stockdaejang.domain.trade.error.TradeError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.math.BigInteger
import java.time.Instant
import kotlin.test.assertEquals

class LedgerReplayCalculatorTest {
    @Test
    fun `증권사 유무가 다른 원장은 서로 다른 원장 식별 텍스트를 사용한다`() {
        assertEquals("[1,null,\"005930\"]", LedgerKey(1, null, "005930").lockText())
        assertEquals("[1,\"42\",\"005930\"]", LedgerKey(1, 42, "005930").lockText())
    }

    @Test
    fun `같은 시각의 거래를 ID 순서로 재생하면 매도 손익이 가중평균 원가로 계산된다`() {
        val sharedExecutionTime = Instant.parse("2026-08-01T00:00:00Z")
        val replayResult = LedgerReplayCalculator.replay(
            initialLedgerState = LedgerState(BigInteger.ZERO, BigInteger.ZERO),
            ledgerTrades = listOf(
                trade(3, TradeSide.SELL, sharedExecutionTime, 2, 200),
                trade(2, TradeSide.BUY, sharedExecutionTime, 2, 200),
                trade(1, TradeSide.BUY, sharedExecutionTime, 3, 100),
            ),
        )

        assertEquals(BigInteger.valueOf(3), replayResult.state.heldQuantity)
        assertEquals(BigInteger.valueOf(420), replayResult.state.remainingCost)
        assertEquals(BigInteger.valueOf(120), replayResult.updates.single().realizedProfit)
    }

    @Test
    fun `비례 배분 매도 원가의 정확한 절반은 HALF_UP으로 올림한다`() {
        val replayResult = LedgerReplayCalculator.replay(
            initialLedgerState = LedgerState(BigInteger.valueOf(2), BigInteger.ONE),
            ledgerTrades = listOf(trade(1, TradeSide.SELL, Instant.EPOCH, 1, 2)),
        )

        assertEquals(BigInteger.ONE, replayResult.updates.single().realizedProfit)
        assertEquals(BigInteger.ZERO, replayResult.state.remainingCost)
    }

    @Test
    fun `거래 시점 보유량을 넘겨 매도하면 원장 재생이 거부된다`() {
        val exception = assertThrows<BusinessException> {
            LedgerReplayCalculator.replay(
                initialLedgerState = LedgerState(BigInteger.ZERO, BigInteger.ZERO),
                ledgerTrades = listOf(trade(1, TradeSide.SELL, Instant.EPOCH, 1, 100)),
            )
        }
        assertEquals(TradeError.INSUFFICIENT_HOLDING, exception.errorType)
    }

    private fun trade(
        id: Long,
        side: TradeSide,
        executedAt: Instant,
        quantity: Long,
        unitPrice: Long,
    ): LedgerReplayCalculator.LedgerTradeDto {
        return LedgerReplayCalculator.LedgerTradeDto(
            id = id,
            side = side,
            executedAt = executedAt,
            quantity = BigInteger.valueOf(quantity),
            unitPrice = BigInteger.valueOf(unitPrice),
        )
    }
}
