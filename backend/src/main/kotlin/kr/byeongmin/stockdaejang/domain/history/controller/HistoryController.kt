package kr.byeongmin.stockdaejang.domain.history.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import kr.byeongmin.stockdaejang.domain.history.dto.PurchasedStockResponseDto
import kr.byeongmin.stockdaejang.domain.history.dto.TradeHistoryResponseDto
import kr.byeongmin.stockdaejang.domain.history.service.HistoryService
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping(value = ["/api/v1"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "거래 내역", description = "매수·매도 거래 내역과 매수한 종목 목록")
class HistoryController(
    private val historyService: HistoryService,
) {
    @GetMapping("/trades/history")
    @Operation(
        summary = "거래 내역 조회",
        description = "매수 또는 매도 거래 내역을 페이지 단위로 조회합니다. 선택 필터의 유효하지 않은 값은 정규화하거나 무시합니다.",
    )
    fun getHistory(
        @Parameter(description = "조회할 거래 구분입니다. BUY 또는 SELL 값이 필수이며, 누락하거나 다른 값을 보내면 400 오류가 발생합니다.", example = "BUY", required = true)
        @RequestParam side: TradeSide,
        @Parameter(description = "종목명 또는 종목코드 검색어입니다. 앞뒤 공백을 제거하고 빈 값은 무시하며 최대 120자로 잘립니다.", example = "삼성전자")
        @RequestParam(name = "q", required = false) searchQuery: String?,
        @Parameter(description = "매수/매도 일시의 시작 경계입니다. yyyy-MM-dd, yyyy-MM-ddTHH:mm 또는 yyyy-MM-ddTHH:mm:ss 형식만 적용되고, 유효하지 않으면 무시됩니다.", example = "2026-08-01")
        @RequestParam(name = "from", required = false) fromBoundary: String?,
        @Parameter(description = "매수/매도 일시의 종료 경계입니다. yyyy-MM-dd, yyyy-MM-ddTHH:mm 또는 yyyy-MM-ddTHH:mm:ss 형식만 적용되고, 유효하지 않으면 무시됩니다.", example = "2026-08-20")
        @RequestParam(name = "to", required = false) toBoundary: String?,
        @Parameter(description = "소유주 식별자입니다. 양의 정수만 적용되고, 그 외 값은 무시됩니다.", example = "1")
        @RequestParam(required = false) ownerId: String?,
        @Parameter(description = "증권사 코드입니다. 숫자 3자리만 적용되고, 그 외 값은 무시됩니다.", example = "240")
        @RequestParam(required = false) brokerageCode: String?,
        @Parameter(description = "페이지 번호입니다. 양의 정수만 적용되며 기본값은 1입니다. 마지막 페이지보다 크면 마지막 페이지로 보정되고, 유효하지 않은 값은 1로 처리됩니다.", example = "1")
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
    @Operation(summary = "매수 종목 목록 조회", description = "매수 거래가 있는 종목명과 종목코드 목록을 조회합니다.")
    fun getPurchasedStocks(): SuccessDataResponse<List<PurchasedStockResponseDto>> {
        return historyService.getPurchasedStocks()
    }
}
