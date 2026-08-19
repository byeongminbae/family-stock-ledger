package kr.byeongmin.stockdaejang.domain.trade.entity

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "매수/매도 구분. BUY=매수, SELL=매도")
enum class TradeSide {
    @Schema(description = "매수")
    BUY,

    @Schema(description = "매도")
    SELL,
}
