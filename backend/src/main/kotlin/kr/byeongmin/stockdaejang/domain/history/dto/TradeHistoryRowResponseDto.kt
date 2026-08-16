package kr.byeongmin.stockdaejang.domain.history.dto

import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import java.time.Instant

data class TradeHistoryRowResponseDto(
    val id: String,
    val executedAt: Instant,
    val stockName: String,
    val itemCode: String,
    val quantity: String,
    val unitPrice: String,
    val amount: String,
    val ownerId: Short,
    val ownerName: String,
    val brokerageCode: String?,
    val brokerageName: String?,
    val market: String,
    val isEtf: Boolean,
    val profit: String?,
) {
    companion object {
        fun from(trade: Trade): TradeHistoryRowResponseDto {
            val tradeQuantity = trade.quantity
            val tradeUnitPrice = trade.unitPrice
            return TradeHistoryRowResponseDto(
                id = trade.id.ifNullThrow().toString(),
                executedAt = trade.executedAt.toInstant(),
                stockName = trade.security.stockName,
                itemCode = trade.security.itemCode,
                quantity = tradeQuantity.toString(),
                unitPrice = tradeUnitPrice.toString(),
                amount = tradeQuantity.toBigInteger().multiply(tradeUnitPrice.toBigInteger()).toString(),
                ownerId = trade.owner.id,
                ownerName = trade.owner.name,
                brokerageCode = trade.brokerage?.code,
                brokerageName = trade.brokerage?.name,
                market = trade.security.market,
                isEtf = trade.security.isEtf,
                profit = trade.realizedProfit?.toString(),
            )
        }
    }
}
