package kr.byeongmin.stockdaejang.global.response

import kr.byeongmin.stockdaejang.global.exception.BusinessException
import java.time.LocalDateTime

class ErrorResponse(exception: BusinessException) : Response {
    override val success: Boolean = false
    val statusCode: String = exception.errorType.statusCode
    val message: String = exception.errorType.message
    val fieldErrors: Map<String, String>? = exception.fieldErrors.ifEmpty { null }
    override val timestamp: LocalDateTime = exception.timestamp
}
