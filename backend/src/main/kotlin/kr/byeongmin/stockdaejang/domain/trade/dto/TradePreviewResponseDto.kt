package kr.byeongmin.stockdaejang.domain.trade.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "거래 입력값으로 계산한 매수액·매도액, 보유 수량, 매수평균단가와 예상 손익")
data class TradePreviewResponseDto(
    @field:Schema(description = "수량 × 당시 단가로 계산한 매수액 또는 매도액의 정수 문자열", example = "750000")
    val amount: String,
    @field:Schema(description = "현재 보유 수량을 나타내는 정수 문자열", example = "10")
    val heldQuantity: String,
    @field:Schema(
        description = "매수평균단가. 보유 수량이 0이면 null입니다.",
        nullable = true,
        example = "71200",
    )
    val averageBuyPrice: String?,
    @field:Schema(
        description = "매도이고 보유 수량이 충분할 때만 계산되는 예상 손익의 정수 문자열. 그 밖의 경우 null입니다.",
        nullable = true,
        example = "38000",
    )
    val expectedProfit: String?,
    @field:Schema(
        description = "수량 검증 실패 시 화면에 그대로 표시할 메시지. 성공 시 null입니다. \"선택한 증권사에 보유 수량이 없습니다.\" 또는 \"보유 수량 {현재 보유 수량}주를 초과할 수 없습니다.\"입니다.",
        nullable = true,
        example = "보유 수량 10주를 초과할 수 없습니다.",
    )
    val quantityError: String?,
)
