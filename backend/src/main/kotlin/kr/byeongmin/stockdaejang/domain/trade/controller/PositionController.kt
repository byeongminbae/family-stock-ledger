package kr.byeongmin.stockdaejang.domain.trade.controller

import kr.byeongmin.stockdaejang.domain.trade.dto.PositionAverageResponseDto
import kr.byeongmin.stockdaejang.domain.trade.service.TradeService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/positions")
class PositionController(
    private val tradeService: TradeService,
) {
    @GetMapping("/average")
    fun getPositionAverage(
        @RequestParam(required = false) ownerId: Int?,
        @RequestParam(required = false) brokerageCode: String?,
        @RequestParam(required = false) itemCode: String?,
    ): SuccessDataResponse<PositionAverageResponseDto> {
        return tradeService.getPositionAverage(ownerId, brokerageCode, itemCode)
    }
}
