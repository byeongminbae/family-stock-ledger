package kr.byeongmin.stockdaejang.domain.brokerage.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import kr.byeongmin.stockdaejang.domain.brokerage.dto.BrokerageResponseDto
import kr.byeongmin.stockdaejang.domain.brokerage.service.BrokerageService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController


@RestController
@RequestMapping(value = ["/api/v1/brokerages"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "증권사", description = "거래 입력과 조회에 사용하는 증권사 목록")
class BrokerageController(
    private val brokerageService: BrokerageService,
) {
    @GetMapping
    @Operation(summary = "증권사 목록 조회", description = "거래를 기록할 때 선택할 수 있는 증권사 목록을 조회합니다.")
    fun getList(): SuccessDataResponse<List<BrokerageResponseDto>> {
        return brokerageService.getList()
    }
}
