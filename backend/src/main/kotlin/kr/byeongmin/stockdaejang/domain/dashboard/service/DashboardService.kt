package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardAggregateRowDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardMarketQuoteDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardSnapshotResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.OwnerSummaryDto
import kr.byeongmin.stockdaejang.domain.dashboard.repository.DashboardRepository
import kr.byeongmin.stockdaejang.domain.owner.repository.OwnerQueryRepository
import kr.byeongmin.stockdaejang.domain.stock.service.MarketPriceService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.stereotype.Service

@Service
class DashboardService(
    private val dashboardRepository: DashboardRepository,
    private val ownerQueryRepository: OwnerQueryRepository,
    private val marketPriceService: MarketPriceService,
    private val dashboardHoldingAggregator: DashboardHoldingAggregator,
    private val dashboardCalculator: DashboardCalculator,
) {
    fun getSnapshot(): SuccessDataResponse<DashboardSnapshotResponseDto> {
        val ownerSummaries = ownerQueryRepository.findAll().map(OwnerSummaryDto::from)
        val dashboardTradeRows = dashboardRepository.findAll().map(DashboardHoldingAggregator.TradeRowDto::from)
        val dashboardHoldings = dashboardHoldingAggregator.aggregate(dashboardTradeRows)
        val marketPricesByItemCode = marketPriceService.getMarketPrices(
            dashboardHoldings.map(DashboardAggregateRowDto::itemCode).distinct(),
        )
        val marketQuotesByItemCode = marketPricesByItemCode.mapNotNull { (itemCode, marketPrice) ->
            marketPrice?.let { availableMarketPrice ->
                itemCode to DashboardMarketQuoteDto.from(availableMarketPrice)
            }
        }.toMap()
        return SuccessDataResponse(
            dashboardCalculator.summarize(ownerSummaries, dashboardHoldings, marketQuotesByItemCode),
        )
    }
}
