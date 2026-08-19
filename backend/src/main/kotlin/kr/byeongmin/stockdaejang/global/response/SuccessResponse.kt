package kr.byeongmin.stockdaejang.global.response

import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDateTime

@Schema(description = "별도의 응답 데이터 없이 처리 성공 여부만 반환하는 응답")
class SuccessResponse(
    override val timestamp: LocalDateTime = LocalDateTime.now(),
) : Response {
    @field:Schema(
        description = "요청이 성공적으로 처리되었음을 나타내는 고정값",
        example = "true",
        requiredMode = Schema.RequiredMode.REQUIRED,
    )
    override val success: Boolean = true
}
