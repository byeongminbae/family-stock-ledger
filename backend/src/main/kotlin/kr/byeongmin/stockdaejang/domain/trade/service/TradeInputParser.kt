package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.trade.dto.DeleteTradesRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.ParsedPositionDto
import kr.byeongmin.stockdaejang.domain.trade.dto.ParsedPreviewDto
import kr.byeongmin.stockdaejang.domain.trade.dto.ParsedTradeDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradePreviewRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradeRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.UpdateTradeRequestDto
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import java.math.BigInteger
import java.time.DateTimeException
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.ResolverStyle

internal object TradeInputParser {
    internal data class ParsedDeleteTradesDto(val ids: List<Long>, val side: TradeSide)
    internal data class ParsedUpdateTradeDto(val id: Long, val trade: ParsedTradeDto)

    private val positiveInteger = Regex("^[1-9]\\d*$")
    private val brokerageCode = Regex("^\\d{3}$")
    private val itemCode = Regex("^[0-9A-Z]{6}$")
    private val localDateTime = Regex("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}$")
    private val formatter = DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm")
        .withResolverStyle(ResolverStyle.STRICT)
    private val seoul = ZoneId.of("Asia/Seoul")
    private val maxBigint = BigInteger.valueOf(Long.MAX_VALUE)
    private val maxQuantity = BigInteger.valueOf(Int.MAX_VALUE.toLong())

    fun trade(request: TradeRequestDto): ParsedTradeDto {
        return parseTrade(
            brokerageCode = request.brokerageCode,
            executedAt = request.executedAt,
            isEtf = request.isEtf,
            itemCode = request.itemCode,
            market = request.market,
            ownerId = request.ownerId,
            quantity = request.quantity,
            securityName = request.securityName,
            side = request.side,
            unitPrice = request.unitPrice,
        )
    }

    fun update(request: UpdateTradeRequestDto): ParsedUpdateTradeDto {
        return ParsedUpdateTradeDto(
            id = parsePositiveLong(request.id),
            trade = parseTrade(
                request.brokerageCode,
                request.executedAt,
                request.isEtf,
                request.itemCode,
                request.market,
                request.ownerId,
                request.quantity,
                request.securityName,
                request.side,
                request.unitPrice,
            ),
        )
    }

    fun delete(request: DeleteTradesRequestDto): ParsedDeleteTradesDto {
        val rawIds = request.ids
        if (rawIds.isEmpty() || rawIds.size > 25 || rawIds.toSet().size != rawIds.size) invalid()
        return ParsedDeleteTradesDto(rawIds.map(::parsePositiveLong), parseSide(request.side))
    }

    fun preview(request: TradePreviewRequestDto): ParsedPreviewDto {
        return ParsedPreviewDto(
            brokerageCode = parseBrokerageCode(request.brokerageCode),
            itemCode = parseItemCode(request.itemCode),
            ownerId = parseOwnerId(request.ownerId),
            quantity = parsePositiveQuantity(request.quantity),
            side = parseSide(request.side),
            unitPrice = parsePositiveBigint(request.unitPrice),
        )
    }

    fun position(ownerId: Long?, brokerageCode: String?, itemCode: String?): ParsedPositionDto {
        return ParsedPositionDto(
            ownerId = parseOwnerId(ownerId),
            brokerageCode = parseBrokerageCode(brokerageCode),
            itemCode = parseItemCode(itemCode),
        )
    }

    private fun parseTrade(
        brokerageCode: String,
        executedAt: String,
        isEtf: Boolean,
        itemCode: String,
        market: String,
        ownerId: Long,
        quantity: String,
        securityName: String,
        side: String,
        unitPrice: String,
    ): ParsedTradeDto {
        return ParsedTradeDto(
            brokerageCode = parseBrokerageCode(brokerageCode),
            executedAt = parseExecutedAt(executedAt),
            isEtf = isEtf,
            itemCode = parseItemCode(itemCode),
            market = market.trim().takeIf { it.isNotEmpty() && it.length <= 30 } ?: invalid(),
            ownerId = parseOwnerId(ownerId),
            quantity = parsePositiveQuantity(quantity),
            securityName = securityName.trim().takeIf { it.isNotEmpty() && it.length <= 100 } ?: invalid(),
            side = parseSide(side),
            unitPrice = parsePositiveBigint(unitPrice),
        )
    }

    private fun parseBrokerageCode(rawBrokerageCode: String?): String {
        return rawBrokerageCode?.takeIf(brokerageCode::matches) ?: invalid()
    }

    private fun parseItemCode(rawItemCode: String?): String {
        return rawItemCode?.takeIf(itemCode::matches) ?: invalid()
    }

    private fun parseOwnerId(rawOwnerId: Long?): Long {
        return rawOwnerId?.takeIf { it > 0 } ?: invalid()
    }

    private fun parseSide(rawSide: String?): TradeSide {
        return runCatching { TradeSide.valueOf(rawSide ?: "") }.getOrElse { invalid() }
    }

    private fun parsePositiveLong(rawPositiveInteger: String?): Long {
        return parsePositiveBigint(rawPositiveInteger).longValueExact()
    }

    private fun parsePositiveBigint(rawPositiveInteger: String?): BigInteger {
        if (rawPositiveInteger == null || !positiveInteger.matches(rawPositiveInteger)) invalid()
        val parsedPositiveInteger = rawPositiveInteger.toBigInteger()
        if (parsedPositiveInteger > maxBigint) invalid()
        return parsedPositiveInteger
    }

    private fun parsePositiveQuantity(rawQuantity: String?): BigInteger {
        return parsePositiveBigint(rawQuantity).takeIf { it <= maxQuantity } ?: invalid()
    }

    private fun parseExecutedAt(rawExecutedAt: String?): Instant {
        if (rawExecutedAt == null || !localDateTime.matches(rawExecutedAt)) invalid()
        return try {
            LocalDateTime.parse(rawExecutedAt, formatter).atZone(seoul).toInstant()
        } catch (_: DateTimeException) {
            invalid()
        }
    }

    private fun invalid(): Nothing {
        throw BusinessException(CommonError.INVALID_INPUT_VALUE)
    }
}
