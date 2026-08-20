package kr.byeongmin.stockdaejang.global.response

import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import java.time.LocalDateTime

@Schema(description = "요청 처리에 실패했을 때 반환하는 공통 오류 응답")
class ErrorResponse(exception: BusinessException) : Response {
    @get:Schema(
        description = "요청 처리 실패를 나타내는 고정값",
        example = "false",
    )
    override val success: Boolean = false

    @field:Schema(
        description = "오류 종류를 식별하는 애플리케이션 오류 코드",
        example = "REQ_001",
        allowableValues = ["REQ_000", "REQ_001", "RES_001", "RES_002", "EXT_000", "SER_000", "SER_001", "TRADE_002"],
    )
    val statusCode: String = exception.errorType.statusCode

    @field:Schema(
        description = "사용자에게 표시할 수 있는 오류 설명",
        example = "입력값이 올바르지 않습니다.",
    )
    val message: String = exception.errorType.message

    @field:Schema(
        description = "필드별 오류 메시지. 필드 단위 오류가 없으면 null입니다.",
        example = "{\"quantity\":\"해당 거래 시점의 보유 수량보다 많이 매도할 수 없습니다.\"}",
        nullable = true,
    )
    val fieldErrors: Map<String, String>? = exception.fieldErrors.ifEmpty { null }

    override val timestamp: LocalDateTime = exception.timestamp
}
