package kr.byeongmin.stockdaejang.domain.brokerage.controller

import kr.byeongmin.stockdaejang.domain.brokerage.dto.BrokerageResponseDto
import kr.byeongmin.stockdaejang.domain.brokerage.service.BrokerageService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController


@RestController
@RequestMapping("/api/v1/brokerages")
class BrokerageController(
    private val brokerageService: BrokerageService,
) {
    @GetMapping
    fun getList(): SuccessDataResponse<List<BrokerageResponseDto>> {
        return brokerageService.getList()
    }
}
