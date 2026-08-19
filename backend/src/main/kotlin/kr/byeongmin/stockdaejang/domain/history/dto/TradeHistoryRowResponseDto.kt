package kr.byeongmin.stockdaejang.domain.history.dto

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import java.time.Instant

@Schema(description = "거래 내역")
data class TradeHistoryRowResponseDto(
    @field:Schema(description = "거래 ID", example = "1")
    val id: String,
    @field:Schema(description = "매수/매도 일시", example = "2026-08-20T09:30:00Z", format = "date-time")
    val executedAt: Instant,
    @field:Schema(description = "종목명", example = "삼성전자")
    val stockName: String,
    @field:Schema(description = "종목코드", example = "005930", pattern = "^[0-9A-Z]{6}$")
    val itemCode: String,
    @field:Schema(description = "수량", example = "10")
    val quantity: String,
    @field:Schema(description = "당시 단가", example = "70000")
    val unitPrice: String,
    @field:Schema(description = "매수액/매도액 (수량 × 당시 단가)", example = "700000")
    val amount: String,
    @field:Schema(description = "소유주 ID", example = "1", minimum = "1", maximum = "32767")
    val ownerId: Short,
    @field:Schema(description = "소유주", example = "병민")
    val ownerName: String,
    @field:Schema(
        description = "증권사 코드. 증권사가 지정되지 않은 레거시 거래이면 null입니다.",
        example = "240",
        pattern = "^[0-9]{3}$",
        nullable = true,
    )
    val brokerageCode: String?,
    @field:Schema(
        description = "증권사명. 증권사가 지정되지 않은 레거시 거래이면 null이며 화면에는 '미지정 증권사'로 표시합니다.",
        example = "삼성증권",
        nullable = true,
    )
    val brokerageName: String?,
    @field:Schema(description = "시장", example = "코스피")
    val market: String,
    @get:JsonProperty("isEtf")
    @get:Schema(name = "isEtf", description = "ETF 여부", example = "false")
    val isEtf: Boolean,
    @field:Schema(description = "손익. 매도 시 실현 손익이며 매수 시 null", example = "12345", nullable = true)
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
