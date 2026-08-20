package kr.byeongmin.stockdaejang.domain.trade.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "거래 입력 전 매수액·매도액, 보유 수량, 매수평균단가와 예상 손익을 확인하는 요청. 모든 필드는 필수이며 누락하거나 null이면 400 오류가 발생합니다.")
data class TradePreviewRequestDto(
    @field:Schema(
        description = "선택한 증권사 코드. 숫자 3자리이며 240은 삼성증권입니다.",
        pattern = "^\\d{3}$",
        example = "240",
    )
    val brokerageCode: String,
    @field:Schema(
        description = "종목코드. 영문 대문자 또는 숫자 6자리",
        pattern = "^[0-9A-Z]{6}$",
        example = "005930",
    )
    val itemCode: String,
    @field:Schema(
        description = "소유주 ID. 1 이상의 정수",
        minimum = "1",
        example = "1",
    )
    val ownerId: Long,
    @field:Schema(
        description = "거래 수량. 1 이상 2147483647 이하의 정수 문자열",
        minLength = 1,
        maxLength = 10,
        pattern = "^(?:[1-9][0-9]{0,8}|1[0-9]{9}|20[0-9]{8}|21[0-3][0-9]{7}|214[0-6][0-9]{6}|2147[0-3][0-9]{5}|21474[0-7][0-9]{4}|214748[0-2][0-9]{3}|2147483[0-5][0-9]{2}|21474836[0-3][0-9]|214748364[0-7])$",
        example = "10",
    )
    val quantity: String,
    @field:Schema(
        description = "거래 구분",
        allowableValues = ["BUY", "SELL"],
        example = "SELL",
    )
    val side: String,
    @field:Schema(
        description = "당시 단가. 1 이상 9223372036854775807 이하의 정수 문자열",
        minLength = 1,
        maxLength = 19,
        pattern = "^[1-9][0-9]{0,18}$",
        example = "75000",
    )
    val unitPrice: String,
)
