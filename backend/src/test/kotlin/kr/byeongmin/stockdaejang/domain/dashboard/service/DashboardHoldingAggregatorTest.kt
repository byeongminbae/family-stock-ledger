package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import kotlin.test.assertEquals

class DashboardHoldingAggregatorTest {
    private val dashboardHoldingAggregator = DashboardHoldingAggregator()

    @Test
    fun `매수와 매도를 합산해 남은 보유 수량과 매수 금액을 반환한다`() {
        val dashboardHoldings = dashboardHoldingAggregator.aggregate(
            listOf(
                tradeRow(TradeSide.BUY, quantity = 3, unitPrice = 1_000),
                tradeRow(TradeSide.BUY, quantity = 2, unitPrice = 1_500),
                tradeRow(TradeSide.SELL, quantity = 1, unitPrice = 2_000),
            ),
        )

        assertEquals(1, dashboardHoldings.size)
        assertEquals(BigDecimal("5"), dashboardHoldings.single().boughtQuantity)
        assertEquals(BigDecimal("1"), dashboardHoldings.single().soldQuantity)
        assertEquals(BigDecimal("6000"), dashboardHoldings.single().totalBuyAmount)
    }

    @Test
    fun `전량 매도한 보유분은 제외하고 같은 종목도 증권사별로 분리한다`() {
        val dashboardHoldings = dashboardHoldingAggregator.aggregate(
            listOf(
                tradeRow(TradeSide.BUY, quantity = 3, brokerageId = 1, brokerageCode = "264", brokerageName = "키움증권"),
                tradeRow(TradeSide.SELL, quantity = 3, brokerageId = 1, brokerageCode = "264", brokerageName = "키움증권"),
                tradeRow(TradeSide.BUY, quantity = 4, brokerageId = 2, brokerageCode = "238", brokerageName = "미래에셋증권"),
                tradeRow(TradeSide.SELL, quantity = 1, brokerageId = 2, brokerageCode = "238", brokerageName = "미래에셋증권"),
                tradeRow(TradeSide.BUY, quantity = 2, brokerageId = 3, brokerageCode = "279", brokerageName = "DB금융투자"),
            ),
        )

        assertEquals(listOf("238", "279"), dashboardHoldings.map { it.brokerageCode })
        assertEquals(listOf(BigDecimal("3"), BigDecimal("2")), dashboardHoldings.map { it.boughtQuantity - it.soldQuantity })
    }

    private fun tradeRow(
        side: TradeSide,
        quantity: Long,
        unitPrice: Long = 1_000,
        brokerageId: Long = 1,
        brokerageCode: String = "264",
        brokerageName: String = "키움증권",
    ): DashboardHoldingAggregator.TradeRowDto {
        return DashboardHoldingAggregator.TradeRowDto(
            ownerId = 1,
            ownerName = "병민",
            brokerageId = brokerageId,
            brokerageCode = brokerageCode,
            brokerageName = brokerageName,
            itemCode = "005930",
            stockName = "삼성전자",
            side = side,
            quantity = quantity,
            unitPrice = unitPrice,
        )
    }
}
