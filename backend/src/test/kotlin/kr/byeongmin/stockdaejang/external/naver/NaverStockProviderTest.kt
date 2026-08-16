package kr.byeongmin.stockdaejang.external.naver

import ch.qos.logback.classic.Level
import ch.qos.logback.classic.Logger
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.core.read.ListAppender
import com.sun.net.httpserver.HttpServer
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import kr.byeongmin.stockdaejang.external.naver.config.NaverRestClientConfig
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.slf4j.LoggerFactory
import org.springframework.http.HttpMethod
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.client.ClientHttpRequest
import org.springframework.http.client.ClientHttpRequestFactory
import org.springframework.test.web.client.ExpectedCount
import org.springframework.test.web.client.MockRestServiceServer
import org.springframework.test.web.client.match.MockRestRequestMatchers.method
import org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo
import org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess
import org.springframework.test.web.client.response.MockRestResponseCreators.withStatus
import org.springframework.web.client.RestClient
import org.springframework.web.util.UriComponentsBuilder
import java.io.IOException
import java.net.InetSocketAddress
import java.net.URI
import java.time.Duration
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class NaverStockProviderTest {
    private val logCaptures = mutableListOf<LogCapture>()

    @AfterEach
    fun tearDown() {
        logCaptures.forEach(LogCapture::close)
    }

    @Test
    fun `requests the exact search URI and translates vendor fields without applying domain filters`() {
        val fixture = Fixture()
        fixture.server.expect(ExpectedCount.once(), requestTo(fixture.searchUri("삼성")))
            .andExpect(method(org.springframework.http.HttpMethod.GET))
            .andRespond(withSuccess(searchResponse(), MediaType.APPLICATION_JSON))

        val results = fixture.provider.search("삼성")

        assertEquals(2, results.size)
        assertTrue(results[0].isStock)
        assertTrue(results[0].isKorean)
        assertTrue(results[0].hasDomesticStockPage)
        assertEquals(false, results[0].isEtf)
        assertTrue(results[1].isStock)
        assertFalse(results[1].isKorean)
        assertFalse(results[1].hasDomesticStockPage)
        assertNull(results[1].isEtf)
        fixture.server.verify()
    }

    @Test
    fun `makes one market-price request and translates all price candidates and sessions`() {
        val fixture = Fixture()
        fixture.server.expect(ExpectedCount.once(), requestTo(fixture.marketPriceUri("005930,000660,035420,051910")))
            .andExpect(method(org.springframework.http.HttpMethod.GET))
            .andRespond(withSuccess(marketPriceResponse(), MediaType.APPLICATION_JSON))

        val snapshots = fixture.provider.fetchMarketPrices(listOf("005930", "000660", "035420", "051910"))

        assertEquals(50, fixture.provider.maxBatchSize)
        assertEquals(4, snapshots.size)
        assertEquals(240000, snapshots[0].regularPrice)
        assertEquals(239000, snapshots[0].overPrice)
        assertEquals(MarketSession.REGULAR_MARKET, snapshots[0].session)
        assertEquals(234500, snapshots[1].overPrice)
        assertEquals(MarketSession.PRE_MARKET, snapshots[1].session)
        assertEquals(178500, snapshots[2].overPrice)
        assertEquals(MarketSession.AFTER_MARKET, snapshots[2].session)
        assertEquals(255500, snapshots[3].regularPrice)
        assertEquals(999999, snapshots[3].overPrice)
        assertEquals(MarketSession.PREOPEN, snapshots[3].session)
        fixture.server.verify()
    }

    @Test
    fun `maps missing over-market information to a regular snapshot`() {
        val fixture = Fixture()
        fixture.server.expect(requestTo(fixture.marketPriceUri("005930")))
            .andRespond(withSuccess(regularPriceResponse(), MediaType.APPLICATION_JSON))

        val snapshot = fixture.provider.fetchMarketPrices(listOf("005930")).single()

        assertEquals(MarketSession.REGULAR_MARKET, snapshot.session)
        assertNull(snapshot.overPrice)
        assertNull(snapshot.overTradedAt)
        fixture.server.verify()
    }

    @Test
    fun `turns invalid payload prices and sessions into the typed external API error`() {
        val invalidPriceFixture = Fixture()
        invalidPriceFixture.server.expect(requestTo(invalidPriceFixture.marketPriceUri("005930")))
            .andRespond(withSuccess(regularPriceResponse("invalid"), MediaType.APPLICATION_JSON))

        val invalidPrice = assertThrows<BusinessException> {
            invalidPriceFixture.provider.fetchMarketPrices(listOf("005930"))
        }

        assertEquals("EXT_000", invalidPrice.errorType.statusCode)
        invalidPriceFixture.server.verify()

        val invalidSessionFixture = Fixture()
        invalidSessionFixture.server.expect(requestTo(invalidSessionFixture.marketPriceUri("005930")))
            .andRespond(withSuccess(unknownSessionResponse(), MediaType.APPLICATION_JSON))

        val invalidSession = assertThrows<BusinessException> {
            invalidSessionFixture.provider.fetchMarketPrices(listOf("005930"))
        }

        assertEquals("EXT_000", invalidSession.errorType.statusCode)
        invalidSessionFixture.server.verify()
    }

    @Test
    fun `turns an invalid Naver response envelope into the typed external API error`() {
        val fixture = Fixture()
        fixture.server.expect(requestTo(fixture.searchUri("삼성")))
            .andRespond(withSuccess("{\"isSuccess\":true}", MediaType.APPLICATION_JSON))

        val exception = assertThrows<BusinessException> { fixture.provider.search("삼성") }

        assertEquals("EXT_000", exception.errorType.statusCode)
        fixture.server.verify()
    }

    @Test
    fun `turns Naver HTTP 500 into the typed external API error and logs response details`() {
        val fixture = Fixture()
        val logCapture = captureLogs(NaverRestClientConfig::class.java)
        fixture.server.expect(requestTo(fixture.searchUri("삼성")))
            .andRespond(
                withStatus(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body("{\"message\":\"temporary outage\"}"),
            )

        val exception = assertThrows<BusinessException> { fixture.provider.search("삼성") }

        assertEquals(CommonError.EXTERNAL_API_ERROR, exception.errorType)
        assertTrue(
            logCapture.events.any { event ->
                event.formattedMessage.contains("method=GET") &&
                    event.formattedMessage.contains("status=500") &&
                    event.formattedMessage.contains("temporary outage")
            },
        )
        fixture.server.verify()
    }

    @Test
    fun `turns Naver transport exceptions into the typed external API error`() {
        val builder = RestClient.builder().requestFactory(FailingRequestFactory())
        val provider = NaverStockProvider(NaverRestClientConfig().configureNaverRestClient(builder, BASE_URL))

        val exception = assertThrows<BusinessException> { provider.search("삼성") }

        assertEquals(CommonError.EXTERNAL_API_ERROR, exception.errorType)
    }

    @Test
    fun `turns delayed Naver responses into the typed external API error and logs the timeout`() {
        val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        server.createContext("/front-api/search") { exchange ->
            delayResponse()
            val response = searchResponse().toByteArray()
            exchange.sendResponseHeaders(HttpStatus.OK.value(), response.size.toLong())
            exchange.responseBody.use { body -> body.write(response) }
        }
        server.start()

        try {
            val config = NaverRestClientConfig()
            val provider = NaverStockProvider(
                config.configureNaverRestClient(
                    builder = RestClient.builder(),
                    baseUrl = "http://127.0.0.1:${server.address.port}/front-api",
                    requestFactory = config.naverRequestFactory(
                        connectTimeout = Duration.ofMillis(100),
                        readTimeout = Duration.ofMillis(100),
                    ),
                ),
            )
            val logCapture = captureLogs(NaverStockProvider::class.java)

            val exception = assertThrows<BusinessException> { provider.search("삼성") }

            assertEquals(CommonError.EXTERNAL_API_ERROR, exception.errorType)
            assertTrue(
                logCapture.events.any { event ->
                    event.formattedMessage.contains("Naver request failed: operation=search") &&
                        event.throwableProxy != null
                },
            )
        } finally {
            server.stop(0)
        }
    }

    @Test
    fun `turns an empty Naver 200 response body into the typed external API error`() {
        val fixture = Fixture()
        fixture.server.expect(requestTo(fixture.searchUri("삼성")))
            .andRespond(withSuccess("", MediaType.APPLICATION_JSON))

        val exception = assertThrows<BusinessException> { fixture.provider.search("삼성") }

        assertEquals(CommonError.EXTERNAL_API_ERROR, exception.errorType)
        fixture.server.verify()
    }

    @Test
    fun `turns Naver vendor failure envelopes into the typed external API error`() {
        val fixture = Fixture()
        fixture.server.expect(requestTo(fixture.searchUri("삼성")))
            .andRespond(withSuccess("{\"isSuccess\":false,\"result\":{\"items\":[]}}", MediaType.APPLICATION_JSON))

        val exception = assertThrows<BusinessException> { fixture.provider.search("삼성") }

        assertEquals(CommonError.EXTERNAL_API_ERROR, exception.errorType)
        fixture.server.verify()
    }

    private class Fixture {
        private val builder = RestClient.builder()
        val server: MockRestServiceServer = MockRestServiceServer.bindTo(builder).build()
        val provider = NaverStockProvider(NaverRestClientConfig().configureNaverRestClient(builder, BASE_URL))

        fun searchUri(query: String): java.net.URI {
            return UriComponentsBuilder.fromUriString("$BASE_URL/search")
                .queryParam("page", 1)
                .queryParam("q", query)
                .queryParam("size", 20)
                .queryParam("target", "stock,index,marketindicator,coin,ipo,fund")
                .build()
                .encode()
                .toUri()
        }

        fun marketPriceUri(itemCodes: String): java.net.URI {
            return UriComponentsBuilder.fromUriString("$BASE_URL/realTime/marketPrice")
                .queryParam("endType", "stock")
                .queryParam("itemCodes", itemCodes)
                .queryParam("stockType", "domestic")
                .build()
                .encode()
                .toUri()
        }

        private companion object {
            const val BASE_URL = "https://naver.test/front-api"
        }
    }

    private companion object {
        const val BASE_URL = "https://naver.test/front-api"
        const val RESPONSE_DELAY_MILLIS = 500L

        fun searchResponse(): String {
            return """
                {"isSuccess":true,"result":{"items":[
                  {"category":"stock","code":"005930","isEtf":false,"name":"삼성전자","nationCode":"KOR","typeCode":"KOSPI","typeName":"코스피","url":"/domestic/stock/005930/total"},
                  {"category":"stock","code":"AAPL","name":"Apple","nationCode":"USA","typeCode":"NASDAQ","typeName":"나스닥","url":"/worldstock/stock/AAPL/total"}
                ]}}
            """.trimIndent()
        }

        fun marketPriceResponse(): String {
            return """
                {"isSuccess":true,"result":{"datas":[
                  ${priceItem("005930", "240000", "2026-08-12T10:00:00+09:00", "239,000", "2026-08-12T10:00:00+09:00", "REGULAR_MARKET")},
                  ${priceItem("000660", "230000", "2026-08-11T15:30:00+09:00", "234,500", "2026-08-12T08:20:00+09:00", "PRE_MARKET")},
                  ${priceItem("035420", "175000", "2026-08-12T15:30:00+09:00", "178,500", "2026-08-12T19:45:00+09:00", "AFTER_MARKET")},
                  ${priceItem("051910", "255500", "2026-08-11T15:30:00+09:00", "999,999", "2026-08-12T07:32:54+09:00", "", "PREOPEN")}
                ]}}
            """.trimIndent()
        }

        fun regularPriceResponse(price: String = "255500"): String {
            return """
                {"isSuccess":true,"result":{"datas":[{
                  "closePriceRaw":"$price","itemCode":"005930","localTradedAt":"2026-08-11T15:30:00+09:00",
                  "marketStatus":"CLOSE","stockName":"삼성전자"
                }]}}
            """.trimIndent()
        }

        fun unknownSessionResponse(): String {
            return """
                {"isSuccess":true,"result":{"datas":[
                  ${priceItem("005930", "255500", "2026-08-11T15:30:00+09:00", "258000", "2026-08-11T20:00:00+09:00", "UNKNOWN")}
                ]}}
            """.trimIndent()
        }

        fun priceItem(
            itemCode: String,
            regularPrice: String,
            regularAt: String,
            overPrice: String,
            overAt: String,
            session: String,
            status: String? = null,
        ): String {
            val overMarketStatus = status?.let { "\"overMarketStatus\":\"$it\"," } ?: ""
            return """{
              "closePriceRaw":"$regularPrice","itemCode":"$itemCode","localTradedAt":"$regularAt",
              "marketStatus":"CLOSE","stockName":"종목","overMarketPriceInfo":{
                "localTradedAt":"$overAt",$overMarketStatus"overPrice":"$overPrice","tradingSessionType":"$session"
              }
            }"""
        }
    }

    private fun captureLogs(loggerClass: Class<*>): LogCapture {
        val logger = LoggerFactory.getLogger(loggerClass) as Logger
        return LogCapture(logger).also(logCaptures::add)
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

    private class FailingRequestFactory : ClientHttpRequestFactory {
        override fun createRequest(uri: URI, httpMethod: HttpMethod): ClientHttpRequest {
            throw IOException("Naver connection refused")
        }
    }

    private fun delayResponse() {
        try {
            Thread.sleep(RESPONSE_DELAY_MILLIS)
        } catch (exception: InterruptedException) {
            Thread.currentThread().interrupt()
            throw IOException("Delayed Naver test server was interrupted", exception)
        }
    }
}
