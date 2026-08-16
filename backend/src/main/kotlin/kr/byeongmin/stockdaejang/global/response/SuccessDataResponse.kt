package kr.byeongmin.stockdaejang.global.response

import java.time.LocalDateTime

class SuccessDataResponse<T>(
    val data: T,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
) : Response {
    override val success: Boolean = true
}
