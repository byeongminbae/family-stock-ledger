package kr.byeongmin.stockdaejang.domain.stock.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import kr.byeongmin.stockdaejang.domain.stock.dto.StockSearchItemResponseDto
import kr.byeongmin.stockdaejang.domain.stock.service.StockService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping(value = ["/api/v1/stocks"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "종목", description = "거래에 입력할 종목명과 종목코드 검색")
class StockController(
    private val stockService: StockService,
) {
    @GetMapping("/search")
    @Operation(
        summary = "종목 검색",
        description = "종목명 또는 종목코드로 국내 종목을 검색합니다. 검색어는 앞뒤 공백을 제거해 처리합니다.",
    )
    fun searchStocks(
        @Parameter(description = "종목명 또는 종목코드 검색어입니다. 공백 제거 후 2자 미만이면 200과 빈 목록을 반환하고, 80자를 초과하면 400 오류가 발생합니다.", example = "삼성전자", required = true)
        @RequestParam(name = "q") query: String,
    ): ResponseEntity<SuccessDataResponse<List<StockSearchItemResponseDto>>> {
        return stockService.searchStocks(query)
    }
}
