package kr.byeongmin.stockdaejang.domain.trade.dto

import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "선택한 매수 또는 매도 거래 삭제 요청. 두 필드는 모두 필수이며 누락하거나 null이면 400 오류가 발생합니다.")
data class DeleteTradesRequestDto(
    @field:ArraySchema(
        arraySchema = Schema(
            description = "삭제할 거래 ID 목록. 중복 없이 1건 이상 25건 이하로 입력합니다.",
            example = "[\"1\", \"2\"]",
        ),
        minItems = 1,
        maxItems = 25,
        uniqueItems = true,
        schema = Schema(
            description = "거래 ID. 1 이상 9223372036854775807 이하의 정수 문자열",
            minLength = 1,
            maxLength = 19,
            pattern = "^[1-9][0-9]{0,18}$",
            example = "1",
        ),
    )
    val ids: List<String>,
    @field:Schema(
        description = "삭제할 거래 구분",
        allowableValues = ["BUY", "SELL"],
        example = "BUY",
    )
    val side: String,
)
