package kr.byeongmin.stockdaejang.domain.trade.controller

import kr.byeongmin.stockdaejang.domain.trade.dto.DeleteTradesRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.DeleteTradesResponseDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradeIdResponseDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradePreviewRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradePreviewResponseDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradeRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.UpdateTradeRequestDto
import kr.byeongmin.stockdaejang.domain.trade.service.TradeService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/trades")
class TradeController(
    private val tradeService: TradeService,
) {
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createTrade(@RequestBody request: TradeRequestDto): SuccessDataResponse<TradeIdResponseDto> {
        return tradeService.createTrade(request)
    }

    @PatchMapping
    fun updateTrade(@RequestBody request: UpdateTradeRequestDto): SuccessDataResponse<TradeIdResponseDto> {
        return tradeService.updateTrade(request)
    }

    @DeleteMapping
    fun deleteTrades(@RequestBody request: DeleteTradesRequestDto): SuccessDataResponse<DeleteTradesResponseDto> {
        return tradeService.deleteTrades(request)
    }

    @PostMapping("/preview")
    fun previewTrade(@RequestBody request: TradePreviewRequestDto): SuccessDataResponse<TradePreviewResponseDto> {
        return tradeService.previewTrade(request)
    }
}
