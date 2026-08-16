package kr.byeongmin.stockdaejang.global.config

import io.github.oshai.kotlinlogging.KotlinLogging
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpRequest
import org.springframework.http.client.ClientHttpResponse
import org.springframework.web.client.RestClient

@Configuration
class RestClientConfig {
    private val logger = KotlinLogging.logger {}

    private fun buildErrorLogMessage(
        request: HttpRequest,
        response: ClientHttpResponse,
    ): String {
        return StringBuilder().append("\n")
            .append("==================== 외부 API 요청 ====================").append("\n")
            .append("requestMethod: ${request.method}").append("\n")
            .append("requestUri: ${request.uri}").append("\n")
            .append("requestHeaders: ${safeHeaders(request.headers)}").append("\n")
            .append("responseHeaders: ${safeHeaders(response.headers)}").append("\n")
            .append("responseBody: ${responseBody(response)}").append("\n")
            .append("==================== 외부 API 요청 ====================").append("\n")
            .toString()
    }

    private fun safeHeaders(headers: HttpHeaders): HttpHeaders {
        val safeHeaders = HttpHeaders()
        headers.forEach { name, values ->
            if (name.lowercase() in SENSITIVE_HEADERS) {
                safeHeaders.set(name, REDACTED_VALUE)
            } else {
                safeHeaders.addAll(name, values)
            }
        }
        return safeHeaders
    }

    private fun responseBody(response: ClientHttpResponse): String {
        val body = response.body.bufferedReader().use { it.readText() }
        return body.take(MAX_LOGGED_RESPONSE_BODY_LENGTH)
    }

    @Bean
    fun restClient(): RestClient {
        return RestClient.builder()
            .defaultStatusHandler(
                { status -> status.isError },
                { request, response ->
                    val errorLogMessage = buildErrorLogMessage(request, response)
                    logger.debug { errorLogMessage }
                    throw BusinessException(CommonError.EXTERNAL_API_ERROR)
                },
            )
            .build()
    }

    private companion object {
        const val MAX_LOGGED_RESPONSE_BODY_LENGTH = 4_096
        const val REDACTED_VALUE = "[REDACTED]"
        val SENSITIVE_HEADERS = setOf("authorization", "cookie", "set-cookie", "proxy-authorization")
    }
}
