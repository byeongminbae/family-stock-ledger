package kr.byeongmin.stockdaejang.domain.dashboard

import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardOwnerResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.service.DashboardCalculator
import kr.byeongmin.stockdaejang.domain.dashboard.service.DashboardHolding
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.OffsetDateTime
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class DashboardCalculatorTest {
    private val dashboardCalculator = DashboardCalculator()
    private val owners = listOf(Owner(1, "병민"), Owner(2, "할머니"), Owner(3, "아빠"))

    @Test
    fun `소유주와 증권사 계층의 수치 평가 합계와 종목 비중을 계산한다`() {
        val dashboardHoldings = listOf(
            holding("005930", "삼성전자", "3", "1", "3000"),
            holding("000660", "SK하이닉스", "2", "0", "4000"),
        )
        val marketQuotesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 2_000, MarketSession.REGULAR_MARKET),
            "000660" to marketPrice("000660", "SK하이닉스", 2_500, MarketSession.REGULAR_MARKET),
        )

        val dashboard = dashboardCalculator.calculate(owners, dashboardHoldings, marketQuotesByItemCode)

        val owner = dashboard.owner("병민")
        val brokerage = owner.brokerages.single()
        val stock = brokerage.stocks.first()
        assertEquals(2, stock.quantity)
        assertEquals(BigDecimal("1000"), stock.averageBuyPrice)
        assertEquals(BigDecimal("2000"), stock.totalBuyAmount)
        assertEquals(BigDecimal("33.333333333333333333"), stock.brokerageWeight)
        assertEquals(BigDecimal("2000"), stock.currentPrice)
        assertEquals(BigDecimal("4000"), stock.valuation)
        assertEquals(BigDecimal("2000"), stock.unrealizedProfit)
        assertEquals(BigDecimal("100"), stock.returnRate)
        assertEquals(2, owner.stockCount)
        assertEquals(BigDecimal("6000"), owner.totalBuyAmount)
        assertEquals(BigDecimal("9000"), owner.valuation)
        assertEquals(BigDecimal("3000"), owner.unrealizedProfit)
        assertEquals(2, brokerage.stockCount)
        assertEquals(BigDecimal("6000"), brokerage.totalBuyAmount)
        assertEquals(BigDecimal("9000"), brokerage.valuation)
        assertEquals(BigDecimal("3000"), brokerage.unrealizedProfit)
        assertEquals(2, dashboard.stockCount)
        assertEquals(2, dashboard.checkedStockCount)
        assertEquals(BigDecimal("6000"), dashboard.totalBuyAmount)
        assertEquals(BigDecimal("9000"), dashboard.valuation)
        assertEquals(BigDecimal("3000"), dashboard.unrealizedProfit)
    }

    @Test
    fun `비어 있는 소유주와 전체 대시보드는 평가 합계에 영을 반환한다`() {
        val dashboard = dashboardCalculator.calculate(owners, emptyList(), emptyMap())

        val emptyOwner = dashboard.owner("병민")
        assertEquals(emptyList(), emptyOwner.brokerages)
        assertEquals(0, emptyOwner.stockCount)
        assertEquals(BigDecimal.ZERO, emptyOwner.totalBuyAmount)
        assertEquals(BigDecimal.ZERO, emptyOwner.valuation)
        assertEquals(BigDecimal.ZERO, emptyOwner.unrealizedProfit)
        assertEquals(0, dashboard.stockCount)
        assertEquals(0, dashboard.checkedStockCount)
        assertEquals(BigDecimal.ZERO, dashboard.totalBuyAmount)
        assertEquals(BigDecimal.ZERO, dashboard.valuation)
        assertEquals(BigDecimal.ZERO, dashboard.unrealizedProfit)
        assertNull(dashboard.quoteFetchedAt)
        assertNull(dashboard.valuationSession)
    }

    @Test
    fun `비어 있지 않은 집계에서 시세 하나가 없으면 대시보드 계산에 실패한다`() {
        val dashboardHoldings = listOf(
            holding("005930", "삼성전자", "1", "0", "1000"),
            holding("000660", "SK하이닉스", "1", "0", "2000"),
        )
        val marketQuotesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 1_500, MarketSession.PRE_MARKET),
        )

        assertFailsWith<IllegalStateException> {
            dashboardCalculator.calculate(owners, dashboardHoldings, marketQuotesByItemCode)
        }
    }

    @Test
    fun `가장 최근에 적용한 시세의 시각과 장 구분을 함께 반환한다`() {
        val dashboardHoldings = listOf(
            holding("005930", "삼성전자", "1", "0", "1000"),
            holding("000660", "SK하이닉스", "1", "0", "2000"),
        )
        val marketQuotesByItemCode = mapOf(
            "005930" to marketPrice(
                "005930",
                "삼성전자",
                1_500,
                MarketSession.PRE_MARKET,
                "2026-08-14T08:30:00+09:00",
            ),
            "000660" to marketPrice(
                "000660",
                "SK하이닉스",
                2_500,
                MarketSession.AFTER_MARKET,
                "2026-08-14T18:00:00+09:00",
            ),
        )

        val dashboard = dashboardCalculator.calculate(owners, dashboardHoldings, marketQuotesByItemCode)

        assertEquals("2026-08-14T18:00+09:00", dashboard.quoteFetchedAt)
        assertEquals(MarketSession.AFTER_MARKET, dashboard.valuationSession)
    }

    @Test
    fun `같은 종목을 두 증권사에 보유하면 포지션은 분리하고 종목 수는 중복 없이 센다`() {
        val dashboardHoldings = listOf(
            holding("005930", "삼성전자", "2", "0", "2000", brokerage = Brokerage(1, "264", "키움증권")),
            holding("005930", "삼성전자", "1", "0", "1000", brokerage = Brokerage(2, "238", "미래에셋증권")),
        )
        val marketQuotesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 1_500, MarketSession.REGULAR_MARKET),
        )

        val dashboard = dashboardCalculator.calculate(owners, dashboardHoldings, marketQuotesByItemCode)

        val owner = dashboard.owner("병민")
        assertEquals(2, owner.brokerages.size)
        assertEquals(setOf("264", "238"), owner.brokerages.map { it.brokerageCode }.toSet())
        assertEquals(listOf(BigDecimal("100"), BigDecimal("100")), owner.brokerages.map { it.stocks.single().brokerageWeight })
        assertEquals(1, owner.stockCount)
        assertEquals(1, dashboard.stockCount)
        assertEquals(1, dashboard.checkedStockCount)
    }

    private fun holding(
        code: String,
        name: String,
        bought: String,
        sold: String,
        amount: String,
        owner: Owner = owners.first(),
        brokerage: Brokerage = Brokerage(1, "264", "키움증권"),
    ): DashboardHolding {
        return DashboardHolding(
            owner = owner,
            brokerage = brokerage,
            security = Security.of(code, name, "코스피", false),
            boughtQuantity = BigDecimal(bought),
            soldQuantity = BigDecimal(sold),
            grossBuyAmount = BigDecimal(amount),
        )
    }

    private fun marketPrice(
        itemCode: String,
        stockName: String,
        price: Long,
        session: MarketSession,
        localTradedAt: String = "2026-08-14T10:00:00+09:00",
    ): MarketPriceDto {
        return MarketPriceDto(
            itemCode = itemCode,
            localTradedAt = OffsetDateTime.parse(localTradedAt),
            marketStatus = "장중",
            price = price,
            session = session,
            stockName = stockName,
        )
    }

    private fun DashboardResponseDto.owner(name: String): DashboardOwnerResponseDto {
        return owners.single { it.ownerName == name }
    }
}
