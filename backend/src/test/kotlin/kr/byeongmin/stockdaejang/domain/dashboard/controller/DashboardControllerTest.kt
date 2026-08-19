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

class DashboardControllerTest {
    @Test
    fun `계층형 대시보드 응답을 JSON 계약으로 반환한다`() {
        // Given
        val dashboardService = mock(DashboardService::class.java)
        `when`(dashboardService.getDashboard()).thenReturn(SuccessDataResponse(snapshot()))
        val mockMvc = MockMvcBuilders.standaloneSetup(DashboardController(dashboardService)).build()

        // When & Then
        mockMvc.perform(get("/api/v1/dashboard"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.stockCount").value(1))
            .andExpect(jsonPath("$.data.quotedStockCount").value(1))
            .andExpect(jsonPath("$.data.costBasis").value("1000"))
            .andExpect(jsonPath("$.data.valuation").value("1200"))
            .andExpect(jsonPath("$.data.unrealizedProfit").value("200"))
            .andExpect(jsonPath("$.data.valuationSessions[0]").value("PRE_MARKET"))
            .andExpect(jsonPath("$.data.owners[0].id").value(4))
            .andExpect(jsonPath("$.data.owners[0].name").value("새 소유주"))
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].brokerageCode").value("264"))
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].stocks[0].itemCode").value("005930"))
            .andExpect(jsonPath("$.data.owners[0].brokerages[0].stocks[0].brokerageWeight").value("100"))
            .andExpect(jsonPath("$.data.positions").doesNotExist())
            .andExpect(jsonPath("$.data.summaryTotals").doesNotExist())
    }

    private fun snapshot(): DashboardResponseDto {
        return DashboardResponseDto(
            stockCount = 1,
            quotedStockCount = 1,
            costBasis = "1000",
            valuation = "1200",
            unrealizedProfit = "200",
            owners = listOf(
                DashboardOwnerResponseDto(
                    id = 4,
                    name = "새 소유주",
                    stockCount = 1,
                    costBasis = "1000",
                    valuation = "1200",
                    unrealizedProfit = "200",
                    brokerages = listOf(
                        DashboardBrokerageResponseDto(
                            brokerageCode = "264",
                            brokerageName = "키움증권",
                            stockCount = 1,
                            costBasis = "1000",
                            valuation = "1200",
                            unrealizedProfit = "200",
                            stocks = listOf(
                                DashboardStockResponseDto(
                                    itemCode = "005930",
                                    stockName = "삼성전자",
                                    heldQuantity = "1",
                                    averageBuyPrice = "1000",
                                    costBasis = "1000",
                                    brokerageWeight = "100",
                                    currentPrice = "1200",
                                    valuation = "1200",
                                    unrealizedProfit = "200",
                                    returnRate = "20",
                                ),
                            ),
                        ),
                    ),
                ),
            ),
            quoteFetchedAt = "2026-08-20T09:03:00+09:00",
            valuationSessions = listOf(MarketSession.PRE_MARKET),
        )
    }
}
