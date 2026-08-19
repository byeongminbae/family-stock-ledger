package kr.byeongmin.stockdaejang.domain.trade.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.parameters.RequestBody as SwaggerRequestBody
import io.swagger.v3.oas.annotations.tags.Tag
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
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.ResponseStatus
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping(value = ["/api/v1/trades"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "거래", description = "매수·매도 거래 등록, 수정, 삭제와 예상 손익 미리보기")
class TradeController(
    private val tradeService: TradeService,
) {
    @PostMapping(consumes = [MediaType.APPLICATION_JSON_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "거래 등록", description = "소유주, 증권사, 종목명·종목코드, 매수/매도 일시와 수량·단가를 등록합니다.")
    @SwaggerRequestBody(description = "등록할 매수 또는 매도 거래입니다. 종목명, 종목코드, 소유주, 증권사, 매수/매도 일시, 수량과 단가를 포함합니다.", required = true)
    fun createTrade(@RequestBody request: TradeRequestDto): SuccessDataResponse<TradeIdResponseDto> {
        return tradeService.createTrade(request)
    }

    @PatchMapping(consumes = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(summary = "거래 수정", description = "기존 거래를 소유주, 증권사, 종목명·종목코드, 매수/매도 일시, 수량과 단가로 수정합니다.")
    @SwaggerRequestBody(description = "수정할 거래입니다. 거래 식별자와 변경할 매수 또는 매도 거래 정보를 포함합니다.", required = true)
    fun updateTrade(@RequestBody request: UpdateTradeRequestDto): SuccessDataResponse<TradeIdResponseDto> {
        return tradeService.updateTrade(request)
    }

    @DeleteMapping(consumes = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(summary = "거래 삭제", description = "같은 매수 또는 매도 구분의 거래를 최대 25건까지 한 번에 삭제합니다.")
    @SwaggerRequestBody(description = "삭제할 거래 식별자 목록과 거래 구분입니다. 식별자는 중복 없이 1건 이상 25건 이하로 보냅니다.", required = true)
    fun deleteTrades(@RequestBody request: DeleteTradesRequestDto): SuccessDataResponse<DeleteTradesResponseDto> {
        return tradeService.deleteTrades(request)
    }

    @PostMapping(value = ["/preview"], consumes = [MediaType.APPLICATION_JSON_VALUE])
    @Operation(summary = "거래 예상 손익 미리보기", description = "매수 또는 매도 예정 거래를 반영했을 때의 보유 수량, 매수평균단가와 예상 손익을 계산합니다.")
    @SwaggerRequestBody(description = "미리볼 거래입니다. 소유주, 증권사, 종목코드, 매수·매도 구분, 수량과 단가를 포함합니다.", required = true)
    fun previewTrade(@RequestBody request: TradePreviewRequestDto): SuccessDataResponse<TradePreviewResponseDto> {
        return tradeService.previewTrade(request)
    }
}
