package kr.byeongmin.stockdaejang.domain.history.repository

import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.dto.TradeRequestDto
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import kr.byeongmin.stockdaejang.domain.trade.service.TradeService
import kr.byeongmin.stockdaejang.support.QueryDslTestData
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Import
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.postgresql.PostgreSQLContainer
import java.time.OffsetDateTime
import kotlin.test.assertEquals
import kotlin.test.assertNull

@SpringBootTest
@Testcontainers
@Import(QueryDslTestData::class)
class HistoryQueryRepositoryIntegrationTest {
    @Autowired
    private lateinit var repository: HistoryQueryRepository

    @Autowired
    private lateinit var tradeService: TradeService

    @Autowired
    private lateinit var testData: QueryDslTestData

    @BeforeEach
    fun clearHistory() {
        testData.clearTrades()
    }

    @Test
    fun `증권사 필터는 해당 원장만 보이고 기존 무증권사 거래의 증권사는 null이며 매수 종목은 중복 제거한다`() {
        tradeService.createTrade(trade(itemCode = "HST001", brokerageCode = "264", executedAt = "2026-08-01T10:00"))
        tradeService.createTrade(trade(itemCode = "HST001", brokerageCode = "238", executedAt = "2026-08-01T11:00"))
        tradeService.createTrade(trade(itemCode = "HST002", brokerageCode = "264", executedAt = "2026-08-01T12:00"))
        val legacyTradeId = testData.createTradeWithoutBrokerage(
            itemCode = "HST003",
            stockName = "기존 종목",
            executedAt = OffsetDateTime.parse("2026-08-01T13:00:00+09:00"),
        )

        val brokerageRows = findPage(brokerageCode = "238")
        val allRows = findPage()
        val purchased = repository.findPurchasedStocks()

        assertEquals(1L, count(brokerageCode = "238"))
        assertEquals(listOf("HST001"), brokerageRows.map { it.security.itemCode })
        assertEquals("238", brokerageRows.single().brokerage?.code)
        assertEquals("미래에셋증권", brokerageRows.single().brokerage?.name)
        assertNull(allRows.single { it.id == legacyTradeId }.brokerage)
        assertEquals(setOf("HST001", "HST002", "HST003"), purchased.map { it.itemCode }.toSet())
        assertEquals(3, purchased.size)
    }

    private fun findPage(brokerageCode: String? = null): List<Trade> {
        return repository.findPage(
            side = TradeSide.BUY,
            searchQuery = null,
            fromInclusive = null,
            toExclusive = null,
            ownerId = null,
            brokerageCode = brokerageCode,
            offset = 0,
            limit = 25,
        )
    }

    private fun count(brokerageCode: String? = null): Long {
        return repository.count(
            side = TradeSide.BUY,
            searchQuery = null,
            fromInclusive = null,
            toExclusive = null,
            ownerId = null,
            brokerageCode = brokerageCode,
        )
    }

    private fun trade(itemCode: String, brokerageCode: String, executedAt: String): TradeRequestDto {
        return TradeRequestDto(
            brokerageCode = brokerageCode,
            executedAt = executedAt,
            isEtf = false,
            itemCode = itemCode,
            market = "KRX",
            ownerId = 1,
            quantity = "1",
            securityName = "이력 테스트 종목",
            side = "BUY",
            unitPrice = "100",
        )
    }

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:17-alpine")
    }
}
