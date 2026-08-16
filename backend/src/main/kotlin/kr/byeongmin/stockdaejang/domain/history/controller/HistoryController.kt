package kr.byeongmin.stockdaejang.domain.history.controller

import kr.byeongmin.stockdaejang.domain.history.dto.PurchasedStockResponseDto
import kr.byeongmin.stockdaejang.domain.history.dto.TradeHistoryResponseDto
import kr.byeongmin.stockdaejang.domain.history.service.HistoryService
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1")
class HistoryController(
    private val historyService: HistoryService,
) {
    @GetMapping("/trades/history")
    fun getHistory(
        @RequestParam side: TradeSide,
        @RequestParam(name = "q", required = false) searchQuery: String?,
        @RequestParam(name = "from", required = false) fromBoundary: String?,
        @RequestParam(name = "to", required = false) toBoundary: String?,
        @RequestParam(required = false) ownerId: String?,
        @RequestParam(required = false) brokerageCode: String?,
        @RequestParam(required = false) page: String?,
    ): SuccessDataResponse<TradeHistoryResponseDto> {
        return historyService.getHistory(
            side,
            searchQuery,
            fromBoundary,
            toBoundary,
            ownerId,
            brokerageCode,
            page,
        )
    }

    @GetMapping("/stocks/purchased")
    fun getPurchasedStocks(): SuccessDataResponse<List<PurchasedStockResponseDto>> {
        return historyService.getPurchasedStocks()
    }
}
