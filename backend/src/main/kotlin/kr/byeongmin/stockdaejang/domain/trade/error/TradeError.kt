package kr.byeongmin.stockdaejang.domain.trade.error

import kr.byeongmin.stockdaejang.global.error.ErrorType
import org.springframework.http.HttpStatus

enum class TradeError(
    override val statusCode: String,
    override val message: String,
    override val httpStatus: HttpStatus,
) : ErrorType {
    INSUFFICIENT_HOLDING(
        "TRADE_002",
        "해당 거래 시점의 보유 수량보다 많이 매도할 수 없습니다.",
        HttpStatus.CONFLICT,
    ),
}
