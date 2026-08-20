package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.repository.DashboardRepository
import kr.byeongmin.stockdaejang.domain.owner.repository.OwnerRepository
import kr.byeongmin.stockdaejang.domain.stock.service.MarketPriceService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.stereotype.Service

@Service
class DashboardService(
    private val dashboardRepository: DashboardRepository,
    private val ownerRepository: OwnerRepository,
    private val marketPriceService: MarketPriceService,
    private val dashboardHoldingAggregator: DashboardHoldingAggregator,
    private val dashboardCalculator: DashboardCalculator,
) {
    fun getDashboard(): SuccessDataResponse<DashboardResponseDto> {
        val owners = ownerRepository.findAll()
        val dashboardHoldings = dashboardHoldingAggregator.aggregate(dashboardRepository.findAll())
        val marketPricesByItemCode = marketPriceService.getMarketPrices(
            dashboardHoldings.map { it.security.itemCode }.distinct(),
        )
        return SuccessDataResponse(
            dashboardCalculator.calculate(
                owners,
                dashboardHoldings,
                marketPricesByItemCode,
            ),
        )
    }
}
