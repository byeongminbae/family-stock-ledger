package kr.byeongmin.stockdaejang.global.exception

import kr.byeongmin.stockdaejang.global.error.ErrorType
import java.time.LocalDateTime

class BusinessException(
    val errorType: ErrorType,
    val fieldErrors: Map<String, String> = emptyMap(),
    val timestamp: LocalDateTime = LocalDateTime.now(),
) : RuntimeException(errorType.message)
