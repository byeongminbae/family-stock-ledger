package kr.byeongmin.stockdaejang.domain.dashboard

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardOwnerResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.service.DashboardCalculator
import kr.byeongmin.stockdaejang.domain.dashboard.service.DashboardHolding
import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.OffsetDateTime
import kotlin.test.assertEquals
import kotlin.test.assertNull

class DashboardCalculatorTest {
    private val dashboardCalculator = DashboardCalculator()
    private val owners = listOf(Owner(1, "병민"), Owner(2, "할머니"), Owner(3, "아빠"))

    @Test
    fun `소유주와 증권사 계층의 평가 합계와 종목 비중을 계산한다`() {
        // Given
        val dashboardHoldings = listOf(
            holding("005930", "삼성전자", "3", "1", "3000"),
            holding("000660", "SK하이닉스", "2", "0", "4000"),
        )
        val marketQuotesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 2_000, MarketSession.REGULAR_MARKET),
            "000660" to marketPrice("000660", "SK하이닉스", 2_500, MarketSession.REGULAR_MARKET),
        )

        // When
        val dashboard = dashboardCalculator.calculate(
            owners,
            dashboardHoldings,
            marketQuotesByItemCode,
        )

        // Then
        val owner = dashboard.owner("병민")
        val brokerage = owner.brokerages.single()
        val stock = brokerage.stocks.first()
        assertEquals("2", stock.heldQuantity)
        assertEquals("1000", stock.averageBuyPrice)
        assertEquals("2000", stock.costBasis)
        assertEquals("33.333333333333333333", stock.brokerageWeight)
        assertEquals("4000", stock.valuation)
        assertEquals("2000", stock.unrealizedProfit)
        assertEquals("100", stock.returnRate)
        assertEquals(2, owner.stockCount)
        assertEquals("6000", owner.costBasis)
        assertEquals("9000", owner.valuation)
        assertEquals("3000", owner.unrealizedProfit)
        assertEquals(2, brokerage.stockCount)
        assertEquals("6000", brokerage.costBasis)
        assertEquals("9000", brokerage.valuation)
        assertEquals("3000", brokerage.unrealizedProfit)
        assertEquals(2, dashboard.stockCount)
        assertEquals(2, dashboard.quotedStockCount)
        assertEquals("6000", dashboard.costBasis)
        assertEquals("9000", dashboard.valuation)
        assertEquals("3000", dashboard.unrealizedProfit)
    }

    @Test
    fun `일부 시세가 없으면 소유주와 증권사 평가 합계를 비운다`() {
        // Given
        val dashboardHoldings = listOf(
            holding("005930", "삼성전자", "1", "0", "1000"),
            holding("000660", "SK하이닉스", "1", "0", "2000"),
        )
        val marketQuotesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 1_500, MarketSession.PRE_MARKET),
        )

        // When
        val dashboard = dashboardCalculator.calculate(
            owners,
            dashboardHoldings,
            marketQuotesByItemCode,
        )

        // Then
        val owner = dashboard.owner("병민")
        assertNull(owner.valuation)
        assertNull(owner.brokerages.single().unrealizedProfit)
        assertEquals("3000", dashboard.costBasis)
        assertEquals(1, dashboard.quotedStockCount)
        assertNull(dashboard.valuation)
        assertNull(dashboard.unrealizedProfit)
        assertEquals(listOf(MarketSession.PRE_MARKET), dashboard.valuationSessions)
    }

    @Test
    fun `같은 종목을 두 증권사에 보유하면 포지션은 분리하고 종목 수는 중복 없이 센다`() {
        // Given
        val dashboardHoldings = listOf(
            holding("005930", "삼성전자", "2", "0", "2000", brokerage = Brokerage(code = "264", name = "키움증권")),
            holding("005930", "삼성전자", "1", "0", "1000", brokerage = Brokerage(code = "238", name = "미래에셋증권")),
        )
        val marketQuotesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 1_500, MarketSession.REGULAR_MARKET),
        )

        // When
        val dashboard = dashboardCalculator.calculate(
            owners,
            dashboardHoldings,
            marketQuotesByItemCode,
        )

        // Then
        val owner = dashboard.owner("병민")
        assertEquals(2, owner.brokerages.size)
        assertEquals(setOf("264", "238"), owner.brokerages.mapNotNull { it.brokerageCode }.toSet())
        assertEquals(listOf("100", "100"), owner.brokerages.map { it.stocks.single().brokerageWeight })
        assertEquals(1, owner.stockCount)
        assertEquals(1, dashboard.stockCount)
        assertEquals(1, dashboard.quotedStockCount)
    }

    @Test
    fun `증권사가 없는 보유 종목은 null 증권사 그룹에 넣고 빈 소유주는 빈 합계를 반환한다`() {
        // Given
        val ownerWithHolding = Owner(1, "병민")
        val ownerWithoutHolding = Owner(2, "빈 소유주")
        val dashboardHoldings = listOf(
            holding(
                code = "005930",
                name = "삼성전자",
                bought = "1",
                sold = "0",
                amount = "1000",
                owner = ownerWithHolding,
                brokerage = null,
            ),
        )
        val marketQuotesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 1_500, MarketSession.REGULAR_MARKET),
        )

        // When
        val dashboard = dashboardCalculator.calculate(
            listOf(ownerWithHolding, ownerWithoutHolding),
            dashboardHoldings,
            marketQuotesByItemCode,
        )

        // Then
        val unassignedBrokerage = dashboard.owner("병민").brokerages.single()
        assertNull(unassignedBrokerage.brokerageCode)
        assertNull(unassignedBrokerage.brokerageName)
        assertEquals("005930", unassignedBrokerage.stocks.single().itemCode)
        val emptyOwner = dashboard.owner("빈 소유주")
        assertEquals(emptyList(), emptyOwner.brokerages)
        assertEquals(0, emptyOwner.stockCount)
        assertEquals("0", emptyOwner.costBasis)
        assertNull(emptyOwner.valuation)
        assertNull(emptyOwner.unrealizedProfit)
    }

    private fun holding(
        code: String,
        name: String,
        bought: String,
        sold: String,
        amount: String,
        owner: Owner = owners.first(),
        brokerage: Brokerage? = Brokerage(code = "264", name = "키움증권"),
    ): DashboardHolding {
        return DashboardHolding(
            owner = owner,
            brokerage = brokerage,
            security = Security.of(code, name, "코스피", false),
            boughtQuantity = BigDecimal(bought),
            soldQuantity = BigDecimal(sold),
            totalBuyAmount = BigDecimal(amount),
        )
    }

    private fun marketPrice(
        itemCode: String,
        stockName: String,
        price: Long,
        session: MarketSession,
    ): MarketPriceDto {
        return MarketPriceDto(
            itemCode = itemCode,
            localTradedAt = OffsetDateTime.parse("2026-08-14T10:00:00+09:00"),
            marketStatus = "장중",
            price = price,
            session = session,
            stockName = stockName,
        )
    }

    private fun DashboardResponseDto.owner(
        name: String,
    ): DashboardOwnerResponseDto {
        return owners.single { it.name == name }
    }
}
