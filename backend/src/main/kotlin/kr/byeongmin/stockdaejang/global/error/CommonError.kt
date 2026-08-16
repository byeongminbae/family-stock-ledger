package kr.byeongmin.stockdaejang.global.error

import org.springframework.http.HttpStatus

enum class CommonError(
    override val statusCode: String,
    override val message: String,
    override val httpStatus: HttpStatus,
) : ErrorType {
    INVALID_REQUEST("REQ_000", "잘못된 요청입니다.", HttpStatus.BAD_REQUEST),
    INVALID_INPUT_VALUE("REQ_001", "입력값이 올바르지 않습니다.", HttpStatus.BAD_REQUEST),
    RESOURCE_NOT_FOUND("RES_001", "리소스를 찾을 수 없습니다.", HttpStatus.NOT_FOUND),
    RESOURCE_CONFLICT("RES_002", "이미 존재하는 리소스입니다.", HttpStatus.CONFLICT),
    EXTERNAL_API_ERROR("EXT_000", "외부 API에서 오류가 발생했습니다.", HttpStatus.BAD_GATEWAY),
    INTERNAL_SERVER_ERROR("SER_000", "서버 내부 오류가 발생했습니다.", HttpStatus.INTERNAL_SERVER_ERROR),
    NULL_CASTING_ERROR("SER_001", "NULL 캐스팅 오류입니다.", HttpStatus.INTERNAL_SERVER_ERROR),
}
