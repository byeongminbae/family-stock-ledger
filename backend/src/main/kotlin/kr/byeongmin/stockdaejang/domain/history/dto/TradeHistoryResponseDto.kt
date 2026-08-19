package kr.byeongmin.stockdaejang.domain.history.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "거래 내역 조회 결과")
data class TradeHistoryResponseDto(
    @field:Schema(description = "거래 내역")
    val rows: List<TradeHistoryRowResponseDto>,
    @field:Schema(description = "검색 결과 건수", example = "42", minimum = "0")
    val total: Long,
    @field:Schema(description = "전체 건수", example = "100", minimum = "0")
    val unfilteredTotal: Long,
    @field:Schema(description = "현재 페이지", example = "1", minimum = "1")
    val page: Int,
    @field:Schema(description = "페이지당 건수. 항상 25", example = "25", minimum = "25", maximum = "25")
    val pageSize: Int,
    @field:Schema(description = "전체 페이지 수 (최소 1)", example = "4", minimum = "1")
    val totalPages: Int,
    @field:Schema(description = "정규화하여 적용한 필터")
    val filters: HistoryFiltersResponseDto,
    @field:Schema(description = "유효한 필터가 하나 이상 적용되었는지 여부", example = "true")
    val hasFilters: Boolean,
)
