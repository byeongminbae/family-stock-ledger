package kr.byeongmin.stockdaejang.global.error

import org.springframework.http.HttpStatus

interface ErrorType {
    val statusCode: String
    val message: String
    val httpStatus: HttpStatus
}
