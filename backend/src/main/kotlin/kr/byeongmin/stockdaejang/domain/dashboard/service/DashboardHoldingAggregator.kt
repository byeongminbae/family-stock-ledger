package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardAggregateRowDto
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import org.springframework.stereotype.Component
import java.math.BigDecimal

@Component
class DashboardHoldingAggregator {
    fun aggregate(tradeRows: List<TradeRowDto>): List<DashboardAggregateRowDto> {
        val holdingAmountsByKey = linkedMapOf<HoldingKey, HoldingAmounts>()
        tradeRows.forEach { tradeRow ->
            val holdingKey = HoldingKey.from(tradeRow)
            val holdingAmounts = holdingAmountsByKey.getOrPut(holdingKey, ::HoldingAmounts)
            val tradeQuantity = BigDecimal.valueOf(tradeRow.quantity)
            when (tradeRow.side) {
                TradeSide.BUY -> {
                    holdingAmounts.boughtQuantity += tradeQuantity
                    holdingAmounts.totalBuyAmount += tradeQuantity * BigDecimal.valueOf(tradeRow.unitPrice)
                }

                TradeSide.SELL -> holdingAmounts.soldQuantity += tradeQuantity
            }
        }

        return holdingAmountsByKey.mapNotNull { (holdingKey, holdingAmounts) ->
            if (holdingAmounts.boughtQuantity <= holdingAmounts.soldQuantity) return@mapNotNull null
            holdingKey.toAggregateRow(holdingAmounts)
        }
    }

    data class TradeRowDto(
        val ownerId: Short,
        val ownerName: String,
        val brokerageId: Long?,
        val brokerageCode: String?,
        val brokerageName: String?,
        val itemCode: String,
        val stockName: String,
        val side: TradeSide,
        val quantity: Long,
        val unitPrice: Long,
    ) {
        companion object {
            fun from(trade: Trade): TradeRowDto {
                return TradeRowDto(
                    ownerId = trade.owner.id,
                    ownerName = trade.owner.name,
                    brokerageId = trade.brokerage?.id,
                    brokerageCode = trade.brokerage?.code?.trimEnd(),
                    brokerageName = trade.brokerage?.name,
                    itemCode = trade.security.itemCode,
                    stockName = trade.security.stockName,
                    side = trade.side,
                    quantity = trade.quantity,
                    unitPrice = trade.unitPrice,
                )
            }
        }
    }

    private data class HoldingKey(
        val ownerId: Short,
        val ownerName: String,
        val brokerageId: Long?,
        val brokerageCode: String?,
        val brokerageName: String?,
        val itemCode: String,
        val stockName: String,
    ) {
        fun toAggregateRow(holdingAmounts: HoldingAmounts): DashboardAggregateRowDto {
            return DashboardAggregateRowDto(
                ownerId = ownerId,
                ownerName = ownerName,
                brokerageCode = brokerageCode,
                brokerageName = brokerageName,
                itemCode = itemCode,
                stockName = stockName,
                boughtQuantity = holdingAmounts.boughtQuantity,
                soldQuantity = holdingAmounts.soldQuantity,
                totalBuyAmount = holdingAmounts.totalBuyAmount,
            )
        }

        companion object {
            fun from(tradeRow: TradeRowDto): HoldingKey {
                return HoldingKey(
                    ownerId = tradeRow.ownerId,
                    ownerName = tradeRow.ownerName,
                    brokerageId = tradeRow.brokerageId,
                    brokerageCode = tradeRow.brokerageCode,
                    brokerageName = tradeRow.brokerageName,
                    itemCode = tradeRow.itemCode,
                    stockName = tradeRow.stockName,
                )
            }
        }
    }

    private class HoldingAmounts(
        var boughtQuantity: BigDecimal = BigDecimal.ZERO,
        var soldQuantity: BigDecimal = BigDecimal.ZERO,
        var totalBuyAmount: BigDecimal = BigDecimal.ZERO,
    )
}
