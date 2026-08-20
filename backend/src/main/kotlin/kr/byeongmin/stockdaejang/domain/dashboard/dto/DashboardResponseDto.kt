package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import java.math.BigDecimal

@Schema(
    description = "주식대장 전체 보유 현황과 현재가 기준 평가 요약",
    requiredProperties = ["quoteFetchedAt", "valuationSession"],
)
data class DashboardResponseDto(
    @field:Schema(
        description = "전체 보유 종목 수. 소유주와 증권사가 달라도 같은 종목코드는 한 종목으로 계산",
        example = "8",
    )
    val stockCount: Int,
    @field:Schema(
        description = "현재가가 확인된 전체 보유 종목 수. 같은 종목코드는 한 종목으로 계산",
        example = "7",
    )
    val checkedStockCount: Int,
    @field:Schema(
        description = "전체 매입액. 원 단위 숫자",
        example = "12450000",
    )
    val totalBuyAmount: BigDecimal,
    @field:Schema(
        description = "전체 평가액. 원 단위 숫자",
        example = "13210000",
    )
    val valuation: BigDecimal,
    @field:Schema(
        description = "전체 평가 손익. 원 단위 숫자",
        example = "760000",
    )
    val unrealizedProfit: BigDecimal,
    @field:Schema(description = "소유주별 보유 현황")
    val owners: List<DashboardOwnerResponseDto>,
    @field:Schema(
        description = "평가에 적용한 가장 최근 현재가 시각. 보유 종목이 없으면 null",
        example = "2026-08-20T09:03:00+09:00",
        nullable = true,
    )
    val quoteFetchedAt: String?,
    @field:Schema(
        description = "평가에 적용한 가장 최근 현재가의 장 구분. 보유 종목이 없으면 null",
        example = "REGULAR_MARKET",
        nullable = true,
        implementation = MarketSession::class,
    )
    val valuationSession: MarketSession?,
)
