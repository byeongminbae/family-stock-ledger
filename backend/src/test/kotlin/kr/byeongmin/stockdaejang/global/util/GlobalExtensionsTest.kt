package kr.byeongmin.stockdaejang.global.util

import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertSame

class GlobalExtensionsTest {
    @Test
    fun `값이 널이 아니면 원본 객체를 반환한다`() {
        val expectedList = mutableListOf("값")

        val actualList = expectedList.ifNullThrow()

        assertSame(expectedList, actualList)
    }

    @Test
    fun `값이 널이면 널 캐스팅 오류를 던진다`() {
        val nullableText: String? = null

        val exception = assertFailsWith<BusinessException> {
            nullableText.ifNullThrow()
        }

        assertEquals(CommonError.NULL_CASTING_ERROR, exception.errorType)
    }
}
