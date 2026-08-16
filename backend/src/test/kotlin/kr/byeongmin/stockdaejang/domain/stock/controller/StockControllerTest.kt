package kr.byeongmin.stockdaejang.domain.stock.controller

import kr.byeongmin.stockdaejang.domain.stock.dto.StockSearchResultDto
import kr.byeongmin.stockdaejang.domain.stock.provider.StockSearchProvider
import kr.byeongmin.stockdaejang.domain.stock.service.StockService
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import kr.byeongmin.stockdaejang.global.exception.GlobalExceptionHandler
import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.header
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders

class StockControllerTest {
    @Test
    fun `returns the success envelope and does not call Naver for one character`() {
        var invocationCount = 0
        val mockMvc = mockMvc(StockSearchProvider {
            invocationCount += 1
            listOf(stockSearchResult())
        })

        mockMvc.perform(get("/api/v1/stocks/search").param("q", "삼"))
            .andExpect(status().isOk)
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray)
            .andExpect(jsonPath("$.data.length()").value(0))
            .andExpect(jsonPath("$.timestamp").exists())

        kotlin.test.assertEquals(0, invocationCount)
    }

    @Test
    fun `returns stock item fields in the success envelope`() {
        val mockMvc = mockMvc(StockSearchProvider {
            listOf(stockSearchResult())
        })

        mockMvc.perform(get("/api/v1/stocks/search").param("q", "삼성"))
            .andExpect(status().isOk)
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data[0].code").value("005930"))
            .andExpect(jsonPath("$.data[0].isEtf").value(false))
            .andExpect(jsonPath("$.data[0].market").value("코스피"))
            .andExpect(jsonPath("$.data[0].name").value("삼성전자"))
    }

    @Test
    fun `maps a typed Naver provider failure to the external API error response`() {
        val mockMvc = mockMvc(StockSearchProvider {
            throw BusinessException(CommonError.EXTERNAL_API_ERROR)
        })

        mockMvc.perform(get("/api/v1/stocks/search").param("q", "삼성"))
            .andExpect(status().isBadGateway)
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.statusCode").value("EXT_000"))
    }

    private fun mockMvc(provider: StockSearchProvider): MockMvc {
        return MockMvcBuilders
            .standaloneSetup(StockController(StockService(provider)))
            .setControllerAdvice(GlobalExceptionHandler())
            .build()
    }

    private fun stockSearchResult(): StockSearchResultDto {
        return StockSearchResultDto(
            code = "005930",
            isEtf = false,
            isStock = true,
            isKorean = true,
            hasDomesticStockPage = true,
            market = "코스피",
            name = "삼성전자",
        )
    }
}
