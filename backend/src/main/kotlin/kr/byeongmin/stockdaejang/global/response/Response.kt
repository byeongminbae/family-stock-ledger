package kr.byeongmin.stockdaejang.global.response

import io.swagger.v3.oas.annotations.media.Schema
import java.time.LocalDateTime

@Schema(description = "모든 API 응답에 공통으로 포함되는 처리 결과와 응답 생성 시각")
interface Response {
    @get:Schema(
        description = "요청 처리 성공 여부. 성공 응답은 true, 오류 응답은 false입니다.",
        example = "true",
    )
    val success: Boolean

    @get:Schema(
        description = "서버가 응답을 생성한 로컬 일시. 시간대 오프셋은 포함하지 않습니다.",
        example = "2026-08-20T14:35:12.123456",
    )
    val timestamp: LocalDateTime
}
