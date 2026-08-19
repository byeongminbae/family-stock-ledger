package kr.byeongmin.stockdaejang.global.response

import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDateTime

@Schema(description = "조회 또는 처리 결과 데이터를 포함하는 성공 응답")
class SuccessDataResponse<T>(
    @field:Schema(
        description = "API별 응답 데이터. 구체적인 구조는 각 API의 성공 응답 스키마를 따릅니다.",
        requiredMode = Schema.RequiredMode.REQUIRED,
    )
    val data: T,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
) : Response {
    @field:Schema(
        description = "요청이 성공적으로 처리되었음을 나타내는 고정값",
        example = "true",
        requiredMode = Schema.RequiredMode.REQUIRED,
    )
    override val success: Boolean = true
}
