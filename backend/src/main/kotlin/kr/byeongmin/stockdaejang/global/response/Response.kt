package kr.byeongmin.stockdaejang.global.response

import java.time.LocalDateTime

interface Response {
    val success: Boolean
    val timestamp: LocalDateTime
}
