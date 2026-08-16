package kr.byeongmin.stockdaejang.domain.history.dto

import com.fasterxml.jackson.annotation.JsonIgnore

data class HistoryFiltersResponseDto(
    val q: String?,
    val from: String?,
    val to: String?,
    val ownerId: Short?,
    val brokerageCode: String?,
    val page: Int,
) {
    @get:JsonIgnore
    val hasFilters: Boolean
        get() {
            return q != null || from != null || to != null || ownerId != null || brokerageCode != null
        }
}
