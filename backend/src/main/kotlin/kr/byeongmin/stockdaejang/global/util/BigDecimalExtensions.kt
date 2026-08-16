package kr.byeongmin.stockdaejang.global.util

import java.math.BigDecimal
import java.math.MathContext

fun <T> Iterable<T>.sumOfDecimal(
    mathContext: MathContext,
    selector: (T) -> BigDecimal,
): BigDecimal {
    return fold(BigDecimal.ZERO) { total, element -> total.add(selector(element), mathContext) }
}
