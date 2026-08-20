package kr.byeongmin.stockdaejang.domain.dashboard.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.service.DashboardService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping(value = ["/api/v1/dashboard"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "대시보드", description = "소유주와 증권사별 보유 종목 및 평가 손익 현황")
class DashboardController(
    private val dashboardService: DashboardService,
) {
    @GetMapping
    @Operation(
        summary = "대시보드 현황 조회",
        description = "소유주·증권사별 보유 수량, 매수평균단가와 평가 손익을 조회합니다. 보유 종목의 모든 현재가가 필요하며, 시세 조회에 실패하면 부분 응답 대신 API 오류를 반환합니다.",
    )
    fun getDashboard(): SuccessDataResponse<DashboardResponseDto> {
        return dashboardService.getDashboard()
    }
}
