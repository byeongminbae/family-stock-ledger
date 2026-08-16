package kr.byeongmin.stockdaejang.global.exception

import jakarta.validation.ConstraintViolationException
import jakarta.validation.Validation
import jakarta.validation.constraints.Positive
import org.hamcrest.Matchers.notNullValue
import org.junit.jupiter.api.Test
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

class GlobalExceptionHandlerTest {
    private val mockMvc: MockMvc = MockMvcBuilders
        .standaloneSetup(TestController())
        .setControllerAdvice(GlobalExceptionHandler())
        .build()

    @Test
    fun `JSON 형식이 잘못되었을 때 입력값 오류를 반환한다`() {
        mockMvc.perform(
            post("/test/body")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{"),
        )
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.statusCode").value("REQ_001"))
            .andExpect(jsonPath("$.message").value("입력값이 올바르지 않습니다."))
            .andExpect(jsonPath("$.fieldErrors.request").value("입력값이 올바르지 않습니다."))
            .andExpect(jsonPath("$.timestamp", notNullValue()))
    }

    @Test
    fun `요청 본문이 없을 때 입력값 오류를 반환한다`() {
        mockMvc.perform(post("/test/body").contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.statusCode").value("REQ_001"))
            .andExpect(jsonPath("$.fieldErrors.request").exists())
    }

    @Test
    fun `쿼리 파라미터 타입이 다를 때 해당 필드 오류를 반환한다`() {
        mockMvc.perform(get("/test/number").param("value", "not-a-number"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.statusCode").value("REQ_001"))
            .andExpect(jsonPath("$.fieldErrors.value").exists())
    }

    @Test
    fun `필수 쿼리 파라미터가 없을 때 해당 필드 오류를 반환한다`() {
        mockMvc.perform(get("/test/number"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.statusCode").value("REQ_001"))
            .andExpect(jsonPath("$.fieldErrors.value").exists())
    }

    @Test
    fun `제약 조건을 위반했을 때 해당 필드 오류를 반환한다`() {
        mockMvc.perform(get("/test/constraint"))
            .andExpect(status().isBadRequest)
            .andExpect(jsonPath("$.statusCode").value("REQ_001"))
            .andExpect(jsonPath("$.fieldErrors.quantity").value("양수여야 합니다."))
    }

    @RestController
    private class TestController {
        @PostMapping("/test/body")
        fun body(@RequestBody request: TestRequest): TestRequest {
            return request
        }

        @GetMapping("/test/number")
        fun number(@RequestParam value: Long): Long {
            return value
        }

        @GetMapping("/test/constraint")
        fun constraint(): Nothing {
            val validator = Validation.buildDefaultValidatorFactory().validator
            throw ConstraintViolationException(validator.validate(InvalidQuantity(0)))
        }
    }

    private data class TestRequest(val name: String)

    private data class InvalidQuantity(
        @field:Positive(message = "양수여야 합니다.")
        val quantity: Int,
    )
}
