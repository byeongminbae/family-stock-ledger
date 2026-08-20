package kr.byeongmin.stockdaejang.domain.dashboard.controller

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardBrokerageResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardOwnerResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardStockResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.service.DashboardService
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.`when`
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import java.math.BigDecimal

class DashboardControllerTest {
    @Test
    fun `계층형 대시보드 응답을 수치 JSON 계약으로 반환한다`() {
        val dashboardService = mock(DashboardService::class.java)
        `when`(dashboardService.getDashboard()).thenReturn(SuccessDataResponse(snapshot()))
        val mockMvc = MockMvcBuilders.standaloneSetup(DashboardController(dashboardService)).build()

        mockMvc.perform(get("/api/v1/dashboard"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.stockCount").value(1))
            .andExpect(jsonPath("$.data.checkedStockCount").value(1))
            .andExpect(jsonPath("$.data.totalBuyAmount").isNumber)
            .andExpect(jsonPath("$.data.totalBuyAmount").value(1000))
            .andExpect(jsonPath("$.data.valuation").isNumber)
            .andExpect(jsonPath("$.data.valuation").value(1200))
            .andExpect(jsonPath("$.data.unrealizedProfit").isNumber)
            .andExpect(jsonPath("$.data.unrealizedProfit").value(200))
            .andExpect(jsonPath("$.data.valuationSession").value("PRE_MARKET"))
            .andExpect(jsonPath("$.data.owners[0].ownerId").value(4))
            .andExpect(jsonPath("$.data.owners[0].ownerName").value("새 소유주"))
            .andExpect(jsonPath("$.data.owners[0].totalBuyAmount").isNumber)
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].brokerageCode").value("264"))
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].brokerageName").value("키움증권"))
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].totalBuyAmount").isNumber)
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].stocks[0].stockCode").value("005930"))
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].stocks[0].quantity").value(1))
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].stocks[0].averageBuyPrice").isNumber)
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].stocks[0].totalBuyAmount").isNumber)
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].stocks[0].brokerageWeight").isNumber)
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].stocks[0].currentPrice").isNumber)
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].stocks[0].valuation").isNumber)
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].stocks[0].unrealizedProfit").isNumber)
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].stocks[0].returnRate").isNumber)
            .andExpect(jsonPath("$.data.positions").doesNotExist())
            .andExpect(jsonPath("$.data.summaryTotals").doesNotExist())
    }

    private fun snapshot(): DashboardResponseDto {
        return DashboardResponseDto(
            stockCount = 1,
            checkedStockCount = 1,
            totalBuyAmount = BigDecimal("1000"),
            valuation = BigDecimal("1200"),
            unrealizedProfit = BigDecimal("200"),
            owners = listOf(
                DashboardOwnerResponseDto(
                    ownerId = 4L,
                    ownerName = "새 소유주",
                    stockCount = 1,
                    totalBuyAmount = BigDecimal("1000"),
                    valuation = BigDecimal("1200"),
                    unrealizedProfit = BigDecimal("200"),
                    brokerages = listOf(
                        DashboardBrokerageResponseDto(
                            brokerageCode = "264",
                            brokerageName = "키움증권",
                            stockCount = 1,
                            totalBuyAmount = BigDecimal("1000"),
                            valuation = BigDecimal("1200"),
                            unrealizedProfit = BigDecimal("200"),
                            stocks = listOf(
                                DashboardStockResponseDto(
                                    stockCode = "005930",
                                    stockName = "삼성전자",
                                    quantity = 1,
                                    averageBuyPrice = BigDecimal("1000"),
                                    totalBuyAmount = BigDecimal("1000"),
                                    brokerageWeight = BigDecimal("100"),
                                    currentPrice = BigDecimal("1200"),
                                    valuation = BigDecimal("1200"),
                                    unrealizedProfit = BigDecimal("200"),
                                    returnRate = BigDecimal("20"),
                                ),
                            ),
                        ),
                    ),
                ),
            ),
            quoteFetchedAt = "2026-08-20T09:03:00+09:00",
            valuationSession = MarketSession.PRE_MARKET,
        )
    }
}
