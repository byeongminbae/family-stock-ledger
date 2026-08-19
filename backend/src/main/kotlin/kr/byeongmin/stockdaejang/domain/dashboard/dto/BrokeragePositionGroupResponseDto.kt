package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "한 소유주의 증권사별 보유 종목과 합계")
data class BrokeragePositionGroupResponseDto(
    @field:Schema(
        description = "증권사 코드. 증권사가 지정되지 않은 레거시 거래 그룹이면 null입니다.",
        example = "264",
        pattern = "^[0-9]{3}$",
        nullable = true,
    )
    val brokerageCode: String?,
    @field:Schema(
        description = "증권사명. 증권사가 지정되지 않은 레거시 거래 그룹이면 null이며 화면에는 '미지정 증권사'로 표시합니다.",
        example = "키움증권",
        nullable = true,
    )
    val brokerageName: String?,
    @field:Schema(description = "해당 증권사의 보유 종목 목록")
    val positions: List<DashboardPositionResponseDto>,
    @field:Schema(description = "해당 증권사의 보유 종목 합계")
    val totals: OwnerTotalsResponseDto,
)
