package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import org.springframework.stereotype.Component
import java.math.BigDecimal

internal data class DashboardHolding(
    val owner: Owner,
    val brokerage: Brokerage,
    val security: Security,
    val boughtQuantity: BigDecimal,
    val soldQuantity: BigDecimal,
    val grossBuyAmount: BigDecimal,
)

@Component
class DashboardHoldingAggregator {
    internal fun aggregate(trades: List<Trade>): List<DashboardHolding> {
        val holdingsByIdentity = linkedMapOf<HoldingIdentity, DashboardHolding>()
        trades.forEach { trade ->
            val brokerage = trade.brokerage
            val brokerageId = brokerage.id.ifNullThrow()
            val identity = HoldingIdentity(
                ownerId = trade.owner.id,
                brokerageId = brokerageId,
                brokerageCode = brokerage.code.trimEnd(),
                stockCode = trade.security.itemCode,
            )
            val current = holdingsByIdentity[identity] ?: DashboardHolding(
                owner = trade.owner,
                brokerage = brokerage,
                security = trade.security,
                boughtQuantity = BigDecimal.ZERO,
                soldQuantity = BigDecimal.ZERO,
                grossBuyAmount = BigDecimal.ZERO,
            )
            val quantity = BigDecimal.valueOf(trade.quantity)
            holdingsByIdentity[identity] = when (trade.side) {
                TradeSide.BUY -> current.copy(
                    boughtQuantity = current.boughtQuantity + quantity,
                    grossBuyAmount = current.grossBuyAmount + quantity * BigDecimal.valueOf(trade.unitPrice),
                )

                TradeSide.SELL -> current.copy(soldQuantity = current.soldQuantity + quantity)
            }
        }
        return holdingsByIdentity.values.filter { it.boughtQuantity > it.soldQuantity }
    }

    private data class HoldingIdentity(
        val ownerId: Long,
        val brokerageId: Long,
        val brokerageCode: String,
        val stockCode: String,
    )
}
