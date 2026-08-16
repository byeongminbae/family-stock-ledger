package kr.byeongmin.stockdaejang.domain.history.dto

data class TradeHistoryResponseDto(
    val rows: List<TradeHistoryRowResponseDto>,
    val total: Long,
    val unfilteredTotal: Long,
    val page: Int,
    val pageSize: Int,
    val totalPages: Int,
    val filters: HistoryFiltersResponseDto,
    val hasFilters: Boolean,
)
