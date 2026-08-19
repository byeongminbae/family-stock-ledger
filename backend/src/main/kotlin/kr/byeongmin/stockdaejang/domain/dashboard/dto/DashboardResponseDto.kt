package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession

@Schema(description = "주식대장 전체 보유 현황과 현재가 기준 평가 요약")
data class DashboardResponseDto(
    @field:Schema(description = "전체 보유 종목 수. 소유주와 증권사가 달라도 같은 종목코드는 한 종목으로 계산", example = "8")
    val stockCount: Int,
    @field:Schema(description = "현재가를 확인한 전체 보유 종목 수. 같은 종목코드는 한 종목으로 계산", example = "7")
    val quotedStockCount: Int,
    @field:Schema(description = "전체 매입액. 원 단위의 쉼표 없는 십진 문자열", example = "12450000")
    val costBasis: String,
    @field:Schema(description = "전체 평가액. 일부 보유 종목의 현재가가 없으면 null", example = "13210000", nullable = true)
    val valuation: String?,
    @field:Schema(description = "전체 평가 손익. 일부 보유 종목의 현재가가 없으면 null", example = "760000", nullable = true)
    val unrealizedProfit: String?,
    @field:Schema(description = "소유주별 보유 현황")
    val owners: List<DashboardOwnerResponseDto>,
    @field:Schema(description = "평가에 적용한 가장 최근 현재가 시각. 적용한 현재가가 없으면 null", example = "2026-08-20T09:03:00+09:00", nullable = true)
    val quoteFetchedAt: String?,
    @field:ArraySchema(
        arraySchema = Schema(
            description = "평가에 적용한 장 구분. PREOPEN·REGULAR_MARKET는 정규장, PRE_MARKET는 프리마켓, AFTER_MARKET는 애프터마켓",
            example = "[\"REGULAR_MARKET\"]",
        ),
        schema = Schema(implementation = MarketSession::class),
    )
    val valuationSessions: List<MarketSession>,
)
