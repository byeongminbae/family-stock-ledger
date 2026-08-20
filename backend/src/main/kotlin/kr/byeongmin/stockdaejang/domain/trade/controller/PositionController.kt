package kr.byeongmin.stockdaejang.domain.trade.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import kr.byeongmin.stockdaejang.domain.trade.dto.PositionAverageResponseDto
import kr.byeongmin.stockdaejang.domain.trade.service.TradeService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping(value = ["/api/v1/positions"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "보유 수량", description = "소유주·증권사·종목별 현재 보유 수량과 매수평균단가")
class PositionController(
    private val tradeService: TradeService,
) {
    @GetMapping("/average")
    @Operation(
        summary = "보유 수량과 매수평균단가 조회",
        description = "소유주, 증권사, 종목코드로 현재 보유 수량과 매수평균단가를 조회합니다. 세 파라미터는 모두 필수이며 하나라도 누락하면 400 오류를 반환합니다.",
    )
    fun getPositionAverage(
        @Parameter(description = "소유주 ID입니다. 누락하거나 0 이하이면 400 오류가 발생합니다.", example = "1", required = true)
        @RequestParam(required = false) ownerId: Long?,
        @Parameter(description = "증권사 코드입니다. 숫자 3자리가 아니거나 누락하면 400 오류가 발생합니다.", example = "240", required = true)
        @RequestParam(required = false) brokerageCode: String?,
        @Parameter(description = "종목코드입니다. 영문 대문자·숫자 6자리가 아니거나 누락하면 400 오류가 발생합니다.", example = "005930", required = true)
        @RequestParam(required = false) itemCode: String?,
    ): SuccessDataResponse<PositionAverageResponseDto> {
        return tradeService.getPositionAverage(ownerId, brokerageCode, itemCode)
    }
}
