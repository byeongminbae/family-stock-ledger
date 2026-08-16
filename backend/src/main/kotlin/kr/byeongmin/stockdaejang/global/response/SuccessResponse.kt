package kr.byeongmin.stockdaejang.global.response

import java.time.LocalDateTime

class SuccessResponse(
    override val timestamp: LocalDateTime = LocalDateTime.now(),
) : Response {
    override val success: Boolean = true
}
