package kr.byeongmin.stockdaejang.global.config

import org.junit.jupiter.api.Test
import kotlin.test.assertNull

class OpenApiConfigTest {
    @Test
    fun `전역 OpenAPI는 인증 보안 스킴이나 요구사항을 등록하지 않는다`() {
        val openApi = OpenApiConfig().openApi()

        assertNull(openApi.components)
        assertNull(openApi.security)
    }
}
