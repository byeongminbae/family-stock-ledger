package kr.byeongmin.stockdaejang.domain.dashboard.dto

import java.math.BigDecimal
import java.math.MathContext

data class DashboardAggregateRowDto(
    val ownerId: Short,
    val ownerName: String,
    val brokerageCode: String?,
    val brokerageName: String?,
    val itemCode: String,
    val stockName: String,
    val boughtQuantity: BigDecimal,
    val soldQuantity: BigDecimal,
    val totalBuyAmount: BigDecimal,
) {
    data class PositionBaseDto(
        val aggregateRow: DashboardAggregateRowDto,
        val heldQuantity: BigDecimal,
        val averageBuyPrice: BigDecimal,
        val costBasis: BigDecimal,
    )

    fun toPositionBase(mathContext: MathContext): PositionBaseDto {
        val heldQuantity = boughtQuantity.subtract(soldQuantity, mathContext)
        val averageBuyPrice = totalBuyAmount.divide(boughtQuantity, mathContext)
        return PositionBaseDto(
            aggregateRow = this,
            heldQuantity = heldQuantity,
            averageBuyPrice = averageBuyPrice,
            costBasis = heldQuantity.multiply(averageBuyPrice, mathContext),
        )
    }
}
