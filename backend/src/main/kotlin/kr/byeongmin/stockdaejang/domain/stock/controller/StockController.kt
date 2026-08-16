package kr.byeongmin.stockdaejang.domain.stock.controller

import kr.byeongmin.stockdaejang.domain.stock.dto.StockSearchItemResponseDto
import kr.byeongmin.stockdaejang.domain.stock.service.StockService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/stocks")
class StockController(
    private val stockService: StockService,
) {
    @GetMapping("/search")
    fun searchStocks(
        @RequestParam(name = "q") query: String,
    ): ResponseEntity<SuccessDataResponse<List<StockSearchItemResponseDto>>> {
        return stockService.searchStocks(query)
    }
}
