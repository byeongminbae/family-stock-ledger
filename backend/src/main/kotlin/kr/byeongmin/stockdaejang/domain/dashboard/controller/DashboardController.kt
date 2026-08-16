package kr.byeongmin.stockdaejang.domain.dashboard.controller

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardSnapshotResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.service.DashboardService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/dashboard")
class DashboardController(
    private val dashboardService: DashboardService,
) {
    @GetMapping
    fun getSnapshot(): SuccessDataResponse<DashboardSnapshotResponseDto> {
        return dashboardService.getSnapshot()
    }
}
