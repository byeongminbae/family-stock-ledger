package kr.byeongmin.stockdaejang.domain.trade.service

import java.math.BigInteger

internal data class LedgerState(
    val heldQuantity: BigInteger,
    val remainingCost: BigInteger,
)
