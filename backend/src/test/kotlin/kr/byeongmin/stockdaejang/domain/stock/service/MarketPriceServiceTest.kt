package kr.byeongmin.stockdaejang.domain.stock.service

import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceSnapshotDto
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketPriceProvider
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.Clock
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneOffset
import kotlin.test.assertEquals

class MarketPriceServiceTest {
    @Test
    fun `validates request count and item codes before calling the provider`() {
        val provider = FakeMarketPriceProvider()
        val service = MarketPriceService(provider)

        val invalidCode = assertThrows<BusinessException> { service.getMarketPrices(listOf("invalid")) }
        val tooMany = assertThrows<BusinessException> {
            service.getMarketPrices((0..500).map { itemCode -> "%06d".format(itemCode) })
        }

        assertEquals(CommonError.INVALID_INPUT_VALUE, invalidCode.errorType)
        assertEquals(CommonError.INVALID_INPUT_VALUE, tooMany.errorType)
        assertEquals(emptyList(), provider.requestedBatches)
    }

    @Test
    fun `rejects a non-positive provider batch capability as an internal error`() {
        val provider = FakeMarketPriceProvider(maxBatchSize = 0)

        val exception = assertThrows<BusinessException> {
            MarketPriceService(provider).getMarketPrices(listOf("005930"))
        }

        assertEquals(CommonError.INTERNAL_SERVER_ERROR, exception.errorType)
    }

    @Test
    fun `returns every normalized requested code in request order when every batch succeeds`() {
        val provider = FakeMarketPriceProvider(maxBatchSize = 2) { itemCodes ->
            itemCodes.asReversed().map { itemCode -> snapshot(itemCode, MarketSession.REGULAR_MARKET) }
        }
        val service = MarketPriceService(provider)

        val prices = service.getMarketPrices(listOf("005930", "000660", "005930", "035420"))

        assertEquals(listOf(listOf("005930", "000660"), listOf("035420")), provider.requestedBatches)
        assertEquals(listOf("005930", "000660", "035420"), prices.keys.toList())
        assertEquals(100, prices.getValue("005930").price)
        assertEquals(100, prices.getValue("000660").price)
        assertEquals(100, prices.getValue("035420").price)
    }

    @Test
    fun `fails the whole batch when the provider reports an external API error`() {
        val provider = FakeMarketPriceProvider(maxBatchSize = 2) { itemCodes ->
            if (itemCodes == listOf("035420")) {
                throw BusinessException(CommonError.EXTERNAL_API_ERROR)
            }
            itemCodes.map { itemCode -> snapshot(itemCode, MarketSession.REGULAR_MARKET) }
        }

        val exception = assertThrows<BusinessException> {
            MarketPriceService(provider).getMarketPrices(listOf("005930", "000660", "035420"))
        }

        assertEquals(CommonError.EXTERNAL_API_ERROR, exception.errorType)
        assertEquals(listOf(listOf("005930", "000660"), listOf("035420")), provider.requestedBatches)
    }

    @Test
    fun `propagates non-external provider errors and rejects invalid provider response codes`() {
        val invalidInputProvider = FakeMarketPriceProvider {
            throw BusinessException(CommonError.INVALID_INPUT_VALUE)
        }
        val invalidInput = assertThrows<BusinessException> {
            MarketPriceService(invalidInputProvider).getMarketPrices(listOf("005930"))
        }
        assertEquals(CommonError.INVALID_INPUT_VALUE, invalidInput.errorType)

        val unexpectedCodeProvider = FakeMarketPriceProvider {
            listOf(snapshot("000660", MarketSession.REGULAR_MARKET))
        }
        val unexpectedCode = assertThrows<BusinessException> {
            MarketPriceService(unexpectedCodeProvider).getMarketPrices(listOf("005930"))
        }
        assertEquals(CommonError.EXTERNAL_API_ERROR, unexpectedCode.errorType)
    }

    @Test
    fun `rejects a provider response that omits a requested code`() {
        val provider = FakeMarketPriceProvider {
            listOf(snapshot("005930", MarketSession.REGULAR_MARKET))
        }

        val exception = assertThrows<BusinessException> {
            MarketPriceService(provider).getMarketPrices(listOf("005930", "000660"))
        }

        assertEquals(CommonError.EXTERNAL_API_ERROR, exception.errorType)
    }

    @Test
    fun `rejects a non-positive selected market price`() {
        val provider = FakeMarketPriceProvider {
            listOf(snapshot("005930", MarketSession.REGULAR_MARKET).copy(regularPrice = 0))
        }

        val exception = assertThrows<BusinessException> {
            MarketPriceService(provider).getMarketPrices(listOf("005930"))
        }

        assertEquals(CommonError.EXTERNAL_API_ERROR, exception.errorType)
    }

    @Test
    fun `returns an empty map without calling the provider for an empty request`() {
        val provider = FakeMarketPriceProvider(maxBatchSize = 0)

        val prices = MarketPriceService(provider).getMarketPrices(emptyList())

        assertEquals(emptyMap(), prices)
        assertEquals(emptyList(), provider.requestedBatches)
    }

    @Test
    fun `selects regular and over-market candidates by translated session`() {
        val provider = FakeMarketPriceProvider { itemCodes ->
            itemCodes.map { itemCode ->
                when (itemCode) {
                    "005930" -> snapshot(itemCode, MarketSession.PREOPEN)
                    "000660" -> snapshot(itemCode, MarketSession.REGULAR_MARKET)
                    "035420" -> snapshot(itemCode, MarketSession.PRE_MARKET)
                    else -> snapshot(itemCode, MarketSession.AFTER_MARKET)
                }
            }
        }
        val service = MarketPriceService(provider, fixedClock("2026-08-11T17:59:59Z"))

        val prices = service.getMarketPrices(listOf("005930", "000660", "035420", "051910"))

        assertEquals(100, prices.getValue("005930").price)
        assertEquals(MarketSession.PREOPEN, prices.getValue("005930").session)
        assertEquals(100, prices.getValue("000660").price)
        assertEquals(110, prices.getValue("035420").price)
        assertEquals("2026-08-11T20:00+09:00", prices.getValue("035420").localTradedAt.toString())
        assertEquals(110, prices.getValue("051910").price)
        assertEquals(MarketSession.AFTER_MARKET, prices.getValue("051910").session)
    }

    @Test
    fun `expires after-market at local traded date start plus twenty-seven hours`() {
        val provider = FakeMarketPriceProvider {
            listOf(snapshot("005930", MarketSession.AFTER_MARKET))
        }
        val service = MarketPriceService(provider, fixedClock("2026-08-11T18:00:00Z"))

        val price = service.getMarketPrices(listOf("005930")).getValue("005930")

        assertEquals(100, price.price)
        assertEquals("2026-08-11T15:30+09:00", price.localTradedAt.toString())
        assertEquals(MarketSession.REGULAR_MARKET, price.session)
    }

    @Test
    fun `rejects an off-market snapshot whose selected candidate is missing`() {
        val provider = FakeMarketPriceProvider {
            listOf(snapshot("005930", MarketSession.PRE_MARKET).copy(overPrice = null))
        }

        val exception = assertThrows<BusinessException> {
            MarketPriceService(provider).getMarketPrices(listOf("005930"))
        }

        assertEquals(CommonError.EXTERNAL_API_ERROR, exception.errorType)
    }

    private fun snapshot(itemCode: String, session: MarketSession): MarketPriceSnapshotDto {
        return MarketPriceSnapshotDto(
            itemCode = itemCode,
            marketStatus = "CLOSE",
            stockName = "종목",
            regularPrice = 100,
            regularTradedAt = OffsetDateTime.parse("2026-08-11T15:30:00+09:00"),
            overPrice = 110,
            overTradedAt = OffsetDateTime.parse("2026-08-11T20:00:00+09:00"),
            session = session,
        )
    }

    private fun fixedClock(instant: String): Clock {
        return Clock.fixed(Instant.parse(instant), ZoneOffset.UTC)
    }

    private class FakeMarketPriceProvider(
        override val maxBatchSize: Int = 50,
        private val fetch: (List<String>) -> List<MarketPriceSnapshotDto> = { emptyList() },
    ) : MarketPriceProvider {
        val requestedBatches = mutableListOf<List<String>>()

        override fun fetchMarketPrices(itemCodes: List<String>): List<MarketPriceSnapshotDto> {
            requestedBatches += itemCodes
            return fetch(itemCodes)
        }
    }
}
