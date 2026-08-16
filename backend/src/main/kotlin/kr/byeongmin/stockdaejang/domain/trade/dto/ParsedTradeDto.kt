package kr.byeongmin.stockdaejang.domain.trade.dto

import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import java.math.BigInteger
import java.time.Instant
import java.time.ZoneOffset

internal data class ParsedTradeDto(
    val brokerageCode: String,
    val executedAt: Instant,
    val isEtf: Boolean,
    val itemCode: String,
    val market: String,
    val ownerId: Short,
    val quantity: BigInteger,
    val securityName: String,
    val side: TradeSide,
    val unitPrice: BigInteger,
) {
    fun toEntity(owner: Owner, brokerage: Brokerage, security: Security): Trade {
        return Trade(
            owner = owner,
            security = security,
            brokerage = brokerage,
            side = side,
            executedAt = executedAt.atOffset(ZoneOffset.UTC),
            quantity = quantity.longValueExact(),
            unitPrice = unitPrice.longValueExact(),
            realizedProfit = if (side == TradeSide.SELL) BigInteger.ZERO else null,
        )
    }
}
