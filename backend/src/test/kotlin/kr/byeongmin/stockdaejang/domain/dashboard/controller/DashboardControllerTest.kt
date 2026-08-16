package kr.byeongmin.stockdaejang.domain.dashboard.controller

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardOwnerResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardSnapshotResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardSummaryTotalsResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.OwnerTotalsResponseDto
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
    fun `세션 enum과 DB 소유주를 문자열 JSON 계약으로 반환한다`() {
        val dashboardService = mock(DashboardService::class.java)
        `when`(dashboardService.getSnapshot()).thenReturn(SuccessDataResponse(snapshot()))
        val mockMvc = MockMvcBuilders.standaloneSetup(DashboardController(dashboardService)).build()

        mockMvc.perform(get("/api/v1/dashboard"))
            .andExpect(status().isOk)
            .andExpect(jsonPath("$.data.valuationSessions[0]").value("PRE_MARKET"))
            .andExpect(jsonPath("$.data.owners[0].id").value(4))
            .andExpect(jsonPath("$.data.owners[0].name").value("새 소유주"))
    }

    private fun snapshot(): DashboardSnapshotResponseDto {
        val emptyOwnerTotals = OwnerTotalsResponseDto(0, "0", null, valuation = null, unrealizedProfit = null)
        return DashboardSnapshotResponseDto(
            positions = emptyList(),
            owners = listOf(DashboardOwnerResponseDto(4, "새 소유주", emptyList(), emptyOwnerTotals)),
            summaryTotals = DashboardSummaryTotalsResponseDto(0, 0, "0", null, null),
            quoteFetchedAt = null,
            valuationSessions = listOf(MarketSession.PRE_MARKET),
        )
    }
}
