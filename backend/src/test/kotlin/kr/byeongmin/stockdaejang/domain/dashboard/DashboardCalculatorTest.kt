package kr.byeongmin.stockdaejang.domain.dashboard

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardAggregateRowDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardMarketQuoteDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardOwnerResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.OwnerSummaryDto
import kr.byeongmin.stockdaejang.domain.dashboard.service.DashboardCalculator
import kr.byeongmin.stockdaejang.domain.dashboard.service.DashboardPositionCalculator
import kr.byeongmin.stockdaejang.domain.dashboard.service.DashboardTotalsCalculator
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import kotlin.test.assertEquals
import kotlin.test.assertNull

class DashboardCalculatorTest {
    private val dashboardCalculator = DashboardCalculator(DashboardPositionCalculator(), DashboardTotalsCalculator())
    private val ownerSummaries = listOf(
        OwnerSummaryDto(1, "병민"),
        OwnerSummaryDto(2, "할머니"),
        OwnerSummaryDto(3, "아빠"),
    )

    @Test
    fun `증권사별 취득금액을 기준으로 비중과 평가손익을 계산한다`() {
        val dashboardAggregateRows = listOf(
            aggregateRow("005930", "삼성전자", "3", "1", "3000"),
            aggregateRow("000660", "SK하이닉스", "2", "0", "4000"),
        )
        val marketQuotesByItemCode = mapOf(
            "005930" to DashboardMarketQuoteDto("005930", "2000", "2026-08-14T10:00:00+09:00", MarketSession.REGULAR_MARKET),
            "000660" to DashboardMarketQuoteDto("000660", "2500", "2026-08-14T10:01:00+09:00", MarketSession.REGULAR_MARKET),
        )

        val dashboardSnapshot = dashboardCalculator.summarize(
            ownerSummaries,
            dashboardAggregateRows,
            marketQuotesByItemCode,
        )

        assertEquals("2", dashboardSnapshot.positions[0].heldQuantity)
        assertEquals("1000", dashboardSnapshot.positions[0].averageBuyPrice)
        assertEquals("2000", dashboardSnapshot.positions[0].costBasis)
        assertEquals("33.333333333333333333", dashboardSnapshot.positions[0].portfolioWeight)
        assertEquals("4000", dashboardSnapshot.positions[0].valuation)
        assertEquals("2000", dashboardSnapshot.positions[0].unrealizedProfit)
        assertEquals("100", dashboardSnapshot.positions[0].returnRate)
        assertEquals("6000", dashboardSnapshot.owner("병민").totals.costBasis)
        assertEquals("9000", dashboardSnapshot.owner("병민").totals.valuation)
        assertEquals("3000", dashboardSnapshot.owner("병민").totals.unrealizedProfit)
        assertEquals(2, dashboardSnapshot.owner("병민").totals.stockCount)
        assertEquals(2, dashboardSnapshot.summaryTotals.stockCount)
        assertEquals(2, dashboardSnapshot.summaryTotals.quotedStockCount)
        assertEquals("6000", dashboardSnapshot.summaryTotals.costBasis)
        assertEquals("9000", dashboardSnapshot.summaryTotals.valuation)
        assertEquals("3000", dashboardSnapshot.summaryTotals.unrealizedProfit)
    }

    @Test
    fun `일부 시세가 없으면 소유주와 증권사 평가 합계를 비운다`() {
        val dashboardSnapshot = dashboardCalculator.summarize(
            ownerSummaries,
            listOf(
                aggregateRow("005930", "삼성전자", "1", "0", "1000"),
                aggregateRow("000660", "SK하이닉스", "1", "0", "2000"),
            ),
            mapOf("005930" to DashboardMarketQuoteDto("005930", "1500", "2026-08-14T10:00:00+09:00", MarketSession.PRE_MARKET)),
        )

        assertNull(dashboardSnapshot.owner("병민").totals.valuation)
        assertNull(dashboardSnapshot.owner("병민").brokerageGroups.single().totals.unrealizedProfit)
        assertEquals("3000", dashboardSnapshot.summaryTotals.costBasis)
        assertEquals(1, dashboardSnapshot.summaryTotals.quotedStockCount)
        assertNull(dashboardSnapshot.summaryTotals.valuation)
        assertNull(dashboardSnapshot.summaryTotals.unrealizedProfit)
        assertEquals(listOf(MarketSession.PRE_MARKET), dashboardSnapshot.valuationSessions)
    }

    @Test
    fun `같은 종목을 두 증권사에 보유하면 포지션은 분리하고 종목 수는 중복 없이 센다`() {
        val dashboardSnapshot = dashboardCalculator.summarize(
            ownerSummaries,
            listOf(
                aggregateRow("005930", "삼성전자", "2", "0", "2000", brokerageCode = "264", brokerageName = "키움증권"),
                aggregateRow("005930", "삼성전자", "1", "0", "1000", brokerageCode = "238", brokerageName = "미래에셋증권"),
            ),
            mapOf("005930" to DashboardMarketQuoteDto("005930", "1500", "2026-08-14T10:00:00+09:00", MarketSession.REGULAR_MARKET)),
        )

        assertEquals(2, dashboardSnapshot.positions.size)
        assertEquals(setOf("264", "238"), dashboardSnapshot.positions.mapNotNull { it.brokerageCode }.toSet())
        assertEquals(listOf("100", "100"), dashboardSnapshot.owner("병민").brokerageGroups.map { it.totals.portfolioWeight })
        assertEquals(1, dashboardSnapshot.owner("병민").totals.stockCount)
        assertEquals(1, dashboardSnapshot.summaryTotals.stockCount)
        assertEquals(1, dashboardSnapshot.summaryTotals.quotedStockCount)
    }

    private fun aggregateRow(
        code: String,
        name: String,
        bought: String,
        sold: String,
        amount: String,
        brokerageCode: String = "264",
        brokerageName: String = "키움증권",
    ): DashboardAggregateRowDto {
        return DashboardAggregateRowDto(
            ownerId = 1,
            ownerName = "병민",
            brokerageCode = brokerageCode,
            brokerageName = brokerageName,
            itemCode = code,
            stockName = name,
            boughtQuantity = BigDecimal(bought),
            soldQuantity = BigDecimal(sold),
            totalBuyAmount = BigDecimal(amount),
        )
    }

    private fun kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardSnapshotResponseDto.owner(
        name: String,
    ): DashboardOwnerResponseDto {
        return owners.single { it.name == name }
    }
}
