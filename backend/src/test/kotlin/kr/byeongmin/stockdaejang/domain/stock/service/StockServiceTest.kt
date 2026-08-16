package kr.byeongmin.stockdaejang.domain.stock.service

import kr.byeongmin.stockdaejang.domain.stock.dto.StockSearchResultDto
import kr.byeongmin.stockdaejang.domain.stock.provider.StockSearchProvider
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals

class StockServiceTest {
    @Test
    fun `trims a valid query and maps only Korean domestic stock results with valid codes and ETF flags`() {
        var providerQuery = ""
        val service = StockService(StockSearchProvider { query ->
            providerQuery = query
            listOf(
                result(code = "005930", isEtf = false),
                result(code = "AAPL", isKorean = false),
                result(code = "KOSPI", isStock = false),
                result(code = "123", hasDomesticStockPage = false),
                result(code = "000660", isEtf = null),
                result(code = "not-valid"),
            )
        })

        val response = service.searchStocks("  삼성  ")

        assertEquals("삼성", providerQuery)
        assertEquals(listOf("005930"), response.body?.data?.map { it.code })
    }

    @Test
    fun `does not request one-character queries and rejects queries over eighty characters`() {
        var invocationCount = 0
        val service = StockService(StockSearchProvider {
            invocationCount += 1
            emptyList()
        })

        assertEquals(emptyList(), service.searchStocks(" 삼 ").body?.data)
        assertThrows<BusinessException> { service.searchStocks("가".repeat(81)) }
        assertEquals(0, invocationCount)
    }

    private fun result(
        code: String,
        isEtf: Boolean? = false,
        isStock: Boolean = true,
        isKorean: Boolean = true,
        hasDomesticStockPage: Boolean = true,
    ): StockSearchResultDto {
        return StockSearchResultDto(
            code = code,
            isEtf = isEtf,
            isStock = isStock,
            isKorean = isKorean,
            hasDomesticStockPage = hasDomesticStockPage,
            market = "코스피",
            name = "종목",
        )
    }
}
