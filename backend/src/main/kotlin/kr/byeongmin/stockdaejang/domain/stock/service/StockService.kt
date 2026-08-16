package kr.byeongmin.stockdaejang.domain.stock.service

import kr.byeongmin.stockdaejang.domain.stock.dto.StockSearchItemResponseDto
import kr.byeongmin.stockdaejang.domain.stock.provider.StockSearchProvider
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.CacheControl
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service

@Service
class StockService(
    private val stockSearchProvider: StockSearchProvider,
) {
    fun searchStocks(query: String): ResponseEntity<SuccessDataResponse<List<StockSearchItemResponseDto>>> {
        val normalizedQuery = query.trim()
        if (normalizedQuery.length < MIN_QUERY_LENGTH) return noStore(emptyList())
        if (normalizedQuery.length > MAX_QUERY_LENGTH) throw BusinessException(CommonError.INVALID_INPUT_VALUE)

        val stockSearchItems = stockSearchProvider.search(normalizedQuery)
            .filter { stockSearchResultDto ->
                stockSearchResultDto.isStock &&
                    stockSearchResultDto.isKorean &&
                    stockSearchResultDto.hasDomesticStockPage &&
                    ITEM_CODE.matches(stockSearchResultDto.code) &&
                    stockSearchResultDto.isEtf != null
            }
            .map(StockSearchItemResponseDto::from)
        return noStore(stockSearchItems)
    }

    private fun noStore(
        stockSearchItems: List<StockSearchItemResponseDto>,
    ): ResponseEntity<SuccessDataResponse<List<StockSearchItemResponseDto>>> {
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(SuccessDataResponse(stockSearchItems))
    }

    private companion object {
        const val MIN_QUERY_LENGTH = 2
        const val MAX_QUERY_LENGTH = 80
        val ITEM_CODE = Regex("^[0-9A-Z]{6}$")
    }
}
