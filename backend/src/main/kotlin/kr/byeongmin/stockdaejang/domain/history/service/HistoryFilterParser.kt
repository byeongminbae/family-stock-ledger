package kr.byeongmin.stockdaejang.domain.history.service

import kr.byeongmin.stockdaejang.domain.history.dto.HistoryFiltersResponseDto
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.time.format.ResolverStyle

object HistoryFilterParser {
    private val seoulZone = ZoneId.of("Asia/Seoul")
    private val dateFormatter = DateTimeFormatter.ofPattern("uuuu-MM-dd").withResolverStyle(ResolverStyle.STRICT)
    private val minuteFormatter = DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm").withResolverStyle(ResolverStyle.STRICT)
    private val secondFormatter = DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ss").withResolverStyle(ResolverStyle.STRICT)
    private val brokerageCodePattern = Regex("^[0-9]{3}$")

    fun parse(
        searchQuery: String?,
        fromBoundary: String?,
        toBoundary: String?,
        ownerId: String?,
        brokerageCode: String?,
        page: String?,
    ): HistoryFiltersResponseDto {
        val validFromBoundary = validBoundaryText(fromBoundary)
        val validToBoundary = validBoundaryText(toBoundary)
        val validOwnerId = ownerId?.trim()?.toLongOrNull()?.takeIf { it > 0 }
        val validBrokerageCode = brokerageCode?.trim()?.takeIf(brokerageCodePattern::matches)
        val validPage = page?.trim()?.toIntOrNull()?.takeIf { it > 0 } ?: 1
        return HistoryFiltersResponseDto(
            q = searchQuery?.trim()?.takeIf(String::isNotEmpty)?.take(120),
            from = validFromBoundary,
            to = validToBoundary,
            ownerId = validOwnerId,
            brokerageCode = validBrokerageCode,
            page = validPage,
        )
    }

    fun startInstant(boundaryText: String?): Instant? {
        return boundaryInstant(boundaryText, exclusiveEnd = false)
    }

    fun endExclusiveInstant(boundaryText: String?): Instant? {
        return boundaryInstant(boundaryText, exclusiveEnd = true)
    }

    private fun validBoundaryText(boundaryText: String?): String? {
        val normalizedBoundary = boundaryText?.trim()?.takeIf(String::isNotEmpty) ?: return null
        return normalizedBoundary.takeIf { boundaryInstant(it, exclusiveEnd = false) != null }
    }

    private fun boundaryInstant(boundaryText: String?, exclusiveEnd: Boolean): Instant? {
        boundaryText ?: return null
        return try {
            when (boundaryText.length) {
                10 -> LocalDate.parse(boundaryText, dateFormatter)
                    .atStartOfDay(seoulZone)
                    .let { if (exclusiveEnd) it.plusDays(1) else it }
                    .toInstant()

                16 -> LocalDateTime.parse(boundaryText, minuteFormatter)
                    .atZone(seoulZone)
                    .let { if (exclusiveEnd) it.plusMinutes(1) else it }
                    .toInstant()

                19 -> LocalDateTime.parse(boundaryText, secondFormatter)
                    .atZone(seoulZone)
                    .let { if (exclusiveEnd) it.plusSeconds(1) else it }
                    .toInstant()

                else -> null
            }
        } catch (_: DateTimeParseException) {
            null
        }
    }
}
