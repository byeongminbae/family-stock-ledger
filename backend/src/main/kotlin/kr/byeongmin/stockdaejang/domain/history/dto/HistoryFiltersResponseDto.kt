package kr.byeongmin.stockdaejang.domain.history.dto

import com.fasterxml.jackson.annotation.JsonIgnore
import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "적용된 거래 내역 필터")
data class HistoryFiltersResponseDto(
    @field:Schema(
        description = "종목명 또는 종목코드. 앞뒤 공백을 제거한 최대 120자 값이며 적용되지 않으면 null입니다.",
        example = "삼성전자",
        nullable = true,
    )
    val q: String?,
    @field:Schema(
        description = "시작일/시각. 해당 시각을 포함하며 서울 시간대 형식 yyyy-MM-dd, yyyy-MM-dd'T'HH:mm, yyyy-MM-dd'T'HH:mm:ss를 사용합니다",
        example = "2026-08-01",
        nullable = true,
    )
    val from: String?,
    @field:Schema(
        description = "종료일/시각. 선택한 정밀도를 포함하도록 다음 경계를 제외하며 서울 시간대 형식 yyyy-MM-dd, yyyy-MM-dd'T'HH:mm, yyyy-MM-dd'T'HH:mm:ss를 사용합니다",
        example = "2026-08-20T23:59:59",
        nullable = true,
    )
    val to: String?,
    @field:Schema(
        description = "소유주 ID. 1 이상 32767 이하의 필터가 적용되지 않으면 null입니다.",
        example = "1",
        minimum = "1",
        maximum = "32767",
        nullable = true,
    )
    val ownerId: Short?,
    @field:Schema(
        description = "증권사 코드. 3자리 코드 필터가 적용되지 않으면 null입니다.",
        example = "240",
        pattern = "^[0-9]{3}$",
        nullable = true,
    )
    val brokerageCode: String?,
    @field:Schema(description = "현재 페이지. 유효하지 않은 값은 1로 처리한 뒤 범위에 맞게 보정합니다", example = "1", minimum = "1")
    val page: Int,
) {
    @get:JsonIgnore
    @get:Schema(hidden = true)
    val hasFilters: Boolean
        get() {
            return q != null || from != null || to != null || ownerId != null || brokerageCode != null
        }
}
