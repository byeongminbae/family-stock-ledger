package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import kr.byeongmin.stockdaejang.domain.trade.repository.TradeLedgerRepository
import org.junit.jupiter.api.Test
import org.mockito.Mockito.`when`
import org.mockito.Mockito.mock
import java.math.BigInteger
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneOffset
import kotlin.test.assertEquals

class TradeLedgerManagerTest {
    @Test
    fun `원장 재생은 조회한 관리 거래의 실현 손익을 갱신한다`() {
        val repository = mock(TradeLedgerRepository::class.java)
        val manager = TradeLedgerManager(repository, LedgerStateCalculator())
        val updateFrom = Instant.parse("2026-08-01T00:00:00Z")
        val ledgerKey = LedgerKey(1, 1, "TST001")
        val buy = trade(1, TradeSide.BUY, updateFrom, 2, 100)
        val sell = trade(2, TradeSide.SELL, updateFrom.plusSeconds(60), 1, 200)

        `when`(repository.findEntriesBefore(1, 1, "TST001", updateFrom)).thenReturn(emptyList())
        `when`(repository.findTradesFrom(1, 1, "TST001", updateFrom)).thenReturn(listOf(buy, sell))

        manager.replay(ledgerKey, updateFrom)

        assertEquals(BigInteger.valueOf(100), sell.realizedProfit)
    }

    private fun trade(
        id: Long,
        side: TradeSide,
        executedAt: Instant,
        quantity: Long,
        unitPrice: Long,
    ): Trade {
        return Trade(
            id = id,
            owner = Owner(1, "테스트 소유주"),
            security = Security(1, "TST001", "테스트 종목", "KRX"),
            brokerage = Brokerage(1, "264", "테스트 증권사"),
            side = side,
            executedAt = OffsetDateTime.ofInstant(executedAt, ZoneOffset.UTC),
            quantity = quantity,
            unitPrice = unitPrice,
        )
    }
}
