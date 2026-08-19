package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession

@Schema(description = "대시보드 보유 종목, 소유주별 그룹, 전체 합계와 적용 시세 정보를 포함한 스냅샷")
data class DashboardSnapshotResponseDto(
    @field:Schema(description = "전체 보유 종목 목록")
    val positions: List<DashboardPositionResponseDto>,
    @field:Schema(description = "소유주별 보유 종목과 증권사 그룹")
    val owners: List<DashboardOwnerResponseDto>,
    @field:Schema(description = "전체 보유 종목 요약 합계")
    val summaryTotals: DashboardSummaryTotalsResponseDto,
    @field:Schema(description = "가장 최근에 적용한 시세의 ISO 8601 오프셋 일시. 적용한 시세가 없으면 null", example = "2026-08-20T09:03:00+09:00", nullable = true)
    val quoteFetchedAt: String?,
    @field:ArraySchema(
        arraySchema = Schema(
            description = "평가에 적용한 시세 장 목록. 화면 표기는 PREOPEN·REGULAR_MARKET=정규장, PRE_MARKET=프리, AFTER_MARKET=에프터입니다.",
            example = "[\"REGULAR_MARKET\"]",
        ),
        schema = Schema(implementation = MarketSession::class),
    )
    val valuationSessions: List<MarketSession>,
)
