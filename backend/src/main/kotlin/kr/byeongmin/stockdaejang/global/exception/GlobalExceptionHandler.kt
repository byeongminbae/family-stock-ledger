package kr.byeongmin.stockdaejang.global.exception

import jakarta.validation.ConstraintViolationException
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.response.ErrorResponse
import org.springframework.http.ResponseEntity
import org.springframework.http.converter.HttpMessageNotReadableException
import org.springframework.web.bind.MissingServletRequestParameterException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException

@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException::class)
    fun handleBusinessException(exception: BusinessException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(exception.errorType.httpStatus).body(ErrorResponse(exception))
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(exception: MethodArgumentNotValidException): ResponseEntity<ErrorResponse> {
        val fieldErrors = exception.bindingResult.fieldErrors.associate { fieldError ->
            fieldError.field to (fieldError.defaultMessage ?: CommonError.INVALID_INPUT_VALUE.message)
        }
        return invalidInput(fieldErrors)
    }

    @ExceptionHandler(HttpMessageNotReadableException::class)
    fun handleUnreadableMessage(exception: HttpMessageNotReadableException): ResponseEntity<ErrorResponse> {
        return invalidInput(mapOf("request" to CommonError.INVALID_INPUT_VALUE.message))
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException::class)
    fun handleTypeMismatch(exception: MethodArgumentTypeMismatchException): ResponseEntity<ErrorResponse> {
        return invalidInput(mapOf(exception.name to CommonError.INVALID_INPUT_VALUE.message))
    }

    @ExceptionHandler(MissingServletRequestParameterException::class)
    fun handleMissingParameter(exception: MissingServletRequestParameterException): ResponseEntity<ErrorResponse> {
        return invalidInput(mapOf(exception.parameterName to CommonError.INVALID_INPUT_VALUE.message))
    }

    @ExceptionHandler(ConstraintViolationException::class)
    fun handleConstraintViolation(exception: ConstraintViolationException): ResponseEntity<ErrorResponse> {
        val fieldErrors = exception.constraintViolations.associate { violation ->
            violation.propertyPath.last().name to violation.message
        }
        return invalidInput(fieldErrors)
    }

    private fun invalidInput(fieldErrors: Map<String, String>): ResponseEntity<ErrorResponse> {
        val exception = BusinessException(CommonError.INVALID_INPUT_VALUE, fieldErrors)
        return ResponseEntity.status(exception.errorType.httpStatus).body(ErrorResponse(exception))
    }
}
