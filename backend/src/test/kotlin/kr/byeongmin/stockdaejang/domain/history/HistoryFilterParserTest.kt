package kr.byeongmin.stockdaejang.domain.history

import kr.byeongmin.stockdaejang.domain.history.service.HistoryFilterParser
import org.junit.jupiter.api.Test
import java.time.Instant
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class HistoryFilterParserTest {
    @Test
    fun `필터 값이 잘못되면 기본값과 미선택 상태가 된다`() {
        val parsedFilters = HistoryFilterParser.parse("  ", "2026-02-30", "x", "0", "12", "0")

        assertNull(parsedFilters.q)
        assertNull(parsedFilters.from)
        assertNull(parsedFilters.to)
        assertNull(parsedFilters.ownerId)
        assertNull(parsedFilters.brokerageCode)
        assertEquals(1, parsedFilters.page)
        assertFalse(parsedFilters.hasFilters)
    }

    @Test
    fun `소유주 ID는 고정 목록이 아니라 양수 DB 식별자로 해석한다`() {
        val parsedFilters = HistoryFilterParser.parse(null, null, null, "4", null, null)

        assertEquals(4L, parsedFilters.ownerId)
    }

    @Test
    fun `Short 최댓값을 넘는 소유주 ID도 DB 식별자로 해석한다`() {
        val parsedFilters = HistoryFilterParser.parse(null, null, null, "40000", null, null)

        assertEquals(40_000L, parsedFilters.ownerId)
    }

    @Test
    fun `검색어와 유효한 선택값을 정규화한다`() {
        val parsedFilters = HistoryFilterParser.parse("  삼성전자  ", null, null, "2", "264", "3")

        assertEquals("삼성전자", parsedFilters.q)
        assertEquals(2L, parsedFilters.ownerId)
        assertEquals("264", parsedFilters.brokerageCode)
        assertEquals(3, parsedFilters.page)
        assertTrue(parsedFilters.hasFilters)
    }

    @Test
    fun `한국 날짜 종료 경계는 다음 날 자정 미만이다`() {
        assertEquals(Instant.parse("2026-08-13T15:00:00Z"), HistoryFilterParser.startInstant("2026-08-14"))
        assertEquals(Instant.parse("2026-08-14T15:00:00Z"), HistoryFilterParser.endExclusiveInstant("2026-08-14"))
    }

    @Test
    fun `분과 초 입력의 종료 경계는 입력 정밀도 한 단위 뒤다`() {
        assertEquals(Instant.parse("2026-08-14T01:31:00Z"), HistoryFilterParser.endExclusiveInstant("2026-08-14T10:30"))
        assertEquals(Instant.parse("2026-08-14T01:30:46Z"), HistoryFilterParser.endExclusiveInstant("2026-08-14T10:30:45"))
    }
}
