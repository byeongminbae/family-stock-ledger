package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.trade.dto.ParsedTradeDto
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.global.util.ifNullThrow

internal data class LedgerKey(
    val ownerId: Long,
    val brokerageId: Long,
    val itemCode: String,
) {
    fun lockText(): String {
        return "[$ownerId,\"$brokerageId\",\"$itemCode\"]"
    }

    companion object {
        fun from(parsedTrade: ParsedTradeDto, brokerage: Brokerage): LedgerKey {
            return LedgerKey(
                ownerId = parsedTrade.ownerId,
                brokerageId = brokerage.id.ifNullThrow(),
                itemCode = parsedTrade.itemCode,
            )
        }

        fun from(trade: Trade): LedgerKey {
            return LedgerKey(
                ownerId = trade.owner.id,
                brokerageId = trade.brokerage.id.ifNullThrow(),
                itemCode = trade.security.itemCode,
            )
        }
    }
}
