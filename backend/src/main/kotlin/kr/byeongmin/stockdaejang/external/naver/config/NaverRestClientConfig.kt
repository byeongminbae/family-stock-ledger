package kr.byeongmin.stockdaejang.external.naver.config

import io.github.oshai.kotlinlogging.KotlinLogging
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.http.client.ClientHttpRequestFactory
import org.springframework.http.client.ClientHttpResponse
import org.springframework.http.client.JdkClientHttpRequestFactory
import org.springframework.web.client.RestClient
import java.net.http.HttpClient
import java.time.Duration

@Configuration
class NaverRestClientConfig {
    private val logger = KotlinLogging.logger {}

    @Bean
    @Qualifier("naverRestClient")
    fun naverRestClient(
        builder: RestClient.Builder,
        @Value("\${stock.provider.naver.base-url:https://m.stock.naver.com/front-api}") baseUrl: String,
        @Value("\${stock.provider.naver.connect-timeout:PT3S}") connectTimeout: Duration,
        @Value("\${stock.provider.naver.read-timeout:PT5S}") readTimeout: Duration,
    ): RestClient {
        return configureNaverRestClient(
            builder = builder,
            baseUrl = baseUrl,
            requestFactory = naverRequestFactory(connectTimeout, readTimeout),
        )
    }

    internal fun configureNaverRestClient(
        builder: RestClient.Builder,
        baseUrl: String,
        requestFactory: ClientHttpRequestFactory? = null,
    ): RestClient {
        val configuredBuilder = builder
            .baseUrl(baseUrl)

        if (requestFactory != null) {
            configuredBuilder.requestFactory(requestFactory)
        }

        return configuredBuilder
            .defaultStatusHandler(
                { status -> status.isError },
                { request, response ->
                    logger.debug {
                        "Naver HTTP failure: method=${request.method}, uri=${request.uri}, " +
                            "status=${response.statusCode.value()}, responseHeaders=${safeHeaders(response.headers)}, " +
                            "responseBody=${responseBody(response)}"
                    }
                    throw BusinessException(CommonError.EXTERNAL_API_ERROR)
                },
            )
            .build()
    }

    internal fun naverRequestFactory(
        connectTimeout: Duration,
        readTimeout: Duration,
    ): JdkClientHttpRequestFactory {
        val httpClient = HttpClient.newBuilder()
            .connectTimeout(connectTimeout)
            .build()

        return JdkClientHttpRequestFactory(httpClient).apply {
            setReadTimeout(readTimeout)
        }
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

    private companion object {
        const val MAX_LOGGED_RESPONSE_BODY_LENGTH = 4_096
        const val REDACTED_VALUE = "[REDACTED]"
        val SENSITIVE_HEADERS = setOf("authorization", "cookie", "set-cookie", "proxy-authorization")
    }
}
