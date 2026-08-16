package kr.byeongmin.stockdaejang.global.config

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.read.ListAppender
import com.sun.net.httpserver.HttpServer
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.junit.jupiter.api.Test
import org.slf4j.LoggerFactory
import java.net.InetSocketAddress
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class RestClientConfigTest {
    @Test
    fun `외부 API가 오류를 반환하는 상황에서 응답을 처리하면 외부 API 예외로 변환한다`() {
        val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        server.createContext("/always-fail") { exchange ->
            val body = "외부 서비스 실패".toByteArray()
            exchange.sendResponseHeaders(500, body.size.toLong())
            exchange.responseBody.use { it.write(body) }
        }
        server.start()

        try {
            val exception = assertFailsWith<BusinessException> {
                RestClientConfig().restClient()
                    .get()
                    .uri("http://127.0.0.1:${server.address.port}/always-fail")
                    .retrieve()
                    .toBodilessEntity()
            }

            assertEquals(CommonError.EXTERNAL_API_ERROR, exception.errorType)
        } finally {
            server.stop(0)
        }
    }

    @Test
    fun `외부 API 오류 로그에서 민감한 헤더를 가리고 응답 본문을 제한한다`() {
        val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        server.createContext("/always-fail") { exchange ->
            val body = ("a".repeat(4_096) + "BODY-END").toByteArray()
            exchange.responseHeaders.add("Set-Cookie", "response-secret")
            exchange.sendResponseHeaders(500, body.size.toLong())
            exchange.responseBody.use { it.write(body) }
        }
        val logCapture = captureLogs(RestClientConfig::class.java)
        server.start()

        try {
            assertFailsWith<BusinessException> {
                RestClientConfig().restClient()
                    .get()
                    .uri("http://127.0.0.1:${server.address.port}/always-fail")
                    .header("Authorization", "Bearer request-secret")
                    .retrieve()
                    .toBodilessEntity()
            }

            val logMessage = logCapture.events.single().formattedMessage
            assertTrue(logMessage.lowercase().contains("authorization"))
            assertTrue(logMessage.lowercase().contains("set-cookie"))
            assertEquals(2, Regex("\\[REDACTED]").findAll(logMessage).count())
            assertTrue(logMessage.contains("a".repeat(4_096)))
            assertFalse(logMessage.contains("request-secret"))
            assertFalse(logMessage.contains("response-secret"))
            assertFalse(logMessage.contains("BODY-END"))
        } finally {
            server.stop(0)
            logCapture.close()
        }
    }

    private fun captureLogs(loggerClass: Class<*>): LogCapture {
        val logger = LoggerFactory.getLogger(loggerClass) as Logger
        return LogCapture(logger)
    }

    private class LogCapture(private val logger: Logger) : AutoCloseable {
        private val originalLevel = logger.level
        private val appender = ListAppender<ILoggingEvent>()

        init {
            appender.start()
            logger.addAppender(appender)
            logger.level = Level.DEBUG
        }

        val events: List<ILoggingEvent>
            get() {
                return appender.list
            }

        override fun close() {
            logger.detachAppender(appender)
            logger.level = originalLevel
            appender.stop()
        }
    }
}
