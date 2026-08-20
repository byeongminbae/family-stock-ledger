package kr.byeongmin.stockdaejang.domain.history.service

import kr.byeongmin.stockdaejang.domain.history.dto.PurchasedStockResponseDto
import kr.byeongmin.stockdaejang.domain.history.dto.TradeHistoryResponseDto
import kr.byeongmin.stockdaejang.domain.history.dto.TradeHistoryRowResponseDto
import kr.byeongmin.stockdaejang.domain.history.repository.HistoryRepository
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.ZoneOffset

@Service
class HistoryService(
    private val historyRepository: HistoryRepository,
) {
    @Transactional(readOnly = true)
    fun getHistory(
        side: TradeSide,
        searchQuery: String?,
        fromBoundary: String?,
        toBoundary: String?,
        ownerId: String?,
        brokerageCode: String?,
        page: String?,
    ): SuccessDataResponse<TradeHistoryResponseDto> {
        val historyFilters = HistoryFilterParser.parse(
            searchQuery,
            fromBoundary,
            toBoundary,
            ownerId,
            brokerageCode,
            page,
        )
        val fromInclusiveDateTime = HistoryFilterParser.startInstant(historyFilters.from)?.atOffset(ZoneOffset.UTC)
        val toExclusiveDateTime = HistoryFilterParser.endExclusiveInstant(historyFilters.to)?.atOffset(ZoneOffset.UTC)
        val filteredTradeCount = historyRepository.count(
            side,
            historyFilters.q,
            fromInclusiveDateTime,
            toExclusiveDateTime,
            historyFilters.ownerId,
            historyFilters.brokerageCode,
        )
        val unfilteredTradeCount = historyRepository.countAll(side)
        val totalPages = maxOf(1, ((filteredTradeCount + PAGE_SIZE - 1) / PAGE_SIZE).toInt())
        val currentPage = minOf(historyFilters.page, totalPages)
        val tradeHistoryRows = historyRepository.findPage(
            side,
            historyFilters.q,
            fromInclusiveDateTime,
            toExclusiveDateTime,
            historyFilters.ownerId,
            historyFilters.brokerageCode,
            (currentPage - 1L) * PAGE_SIZE,
            PAGE_SIZE.toLong(),
        ).map(TradeHistoryRowResponseDto::from)
        return SuccessDataResponse(
            TradeHistoryResponseDto(
                rows = tradeHistoryRows,
                total = filteredTradeCount,
                unfilteredTotal = unfilteredTradeCount,
                page = currentPage,
                pageSize = PAGE_SIZE,
                totalPages = totalPages,
                filters = historyFilters,
                hasFilters = historyFilters.hasFilters,
            ),
        )
    }

    @Transactional(readOnly = true)
    fun getPurchasedStocks(): SuccessDataResponse<List<PurchasedStockResponseDto>> {
        val purchasedStocks = historyRepository.findPurchasedStocks().map(PurchasedStockResponseDto::from)
        return SuccessDataResponse(purchasedStocks)
    }

    private companion object {
        const val PAGE_SIZE = 25
    }
}
