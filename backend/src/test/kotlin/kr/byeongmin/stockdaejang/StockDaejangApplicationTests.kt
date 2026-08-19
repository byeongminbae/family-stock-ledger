package kr.byeongmin.stockdaejang

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.postgresql.PostgreSQLContainer
import tools.jackson.databind.ObjectMapper
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
class StockDaejangApplicationTests {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:17-alpine")
    }

    @Test
    fun contextLoads() {
    }

    @Test
    fun `공개 API의 모든 동작과 파라미터는 구체적인 Swagger 설명을 제공한다`() {
        val document = openApiDocument()
        val operations = mapOf(
            "/api/v1/brokerages" to mapOf("get" to "200"),
            "/api/v1/dashboard" to mapOf("get" to "200"),
            "/api/v1/trades/history" to mapOf("get" to "200"),
            "/api/v1/stocks/purchased" to mapOf("get" to "200"),
            "/api/v1/owners" to mapOf("get" to "200"),
            "/api/v1/stocks/search" to mapOf("get" to "200"),
            "/api/v1/positions/average" to mapOf("get" to "200"),
            "/api/v1/trades" to mapOf("post" to "201", "patch" to "200", "delete" to "200"),
            "/api/v1/trades/preview" to mapOf("post" to "200"),
        )

        assertEquals(11, operations.values.sumOf(Map<String, String>::size))
        operations.forEach { (path, methods) ->
            methods.forEach { (method, successStatus) ->
                val operation = document.path("paths").path(path).path(method)
                assertFalse(operation.isMissingNode, "$method $path 동작이 OpenAPI 문서에 없습니다.")
                assertTrue(operation.path("summary").asString().isNotBlank(), "$method $path summary가 비어 있습니다.")
                assertTrue(
                    operation.path("description").asString().isNotBlank(),
                    "$method $path description이 비어 있습니다.",
                )
                assertTrue(operation.path("tags").isArray && operation.path("tags").size() == 1)
                val responses = operation.path("responses")
                assertTrue(
                    responses.path(successStatus).path("description").asString().isNotBlank(),
                    "$method $path 성공 응답 설명이 비어 있습니다.",
                )
                responses.properties().forEach { (statusCode, response) ->
                    val content = response.path("content")
                    assertFalse(content.path("application/json").isMissingNode, "$method $path $statusCode 응답의 JSON 미디어 타입이 없습니다.")
                    assertTrue(content.path("*/*").isMissingNode, "$method $path $statusCode 응답이 모호한 */* 미디어 타입을 사용합니다.")
                }
                operation.path("parameters").forEach { parameter ->
                    val parameterName = parameter.path("name").asString()
                    assertTrue(
                        parameter.path("description").asString().isNotBlank(),
                        "$method $path 파라미터 $parameterName 설명이 비어 있습니다.",
                    )
                    assertFalse(
                        parameter.path("example").isMissingNode,
                        "$method $path 파라미터 $parameterName 예시가 없습니다.",
                    )
                }
                val requestBody = operation.path("requestBody")
                if (!requestBody.isMissingNode) {
                    assertTrue(requestBody.path("required").asBoolean())
                    assertTrue(
                        requestBody.path("description").asString().isNotBlank(),
                        "$method $path 요청 본문 설명이 비어 있습니다.",
                    )
                    assertFalse(
                        requestBody.path("content").path("application/json").isMissingNode,
                        "$method $path 요청 본문의 JSON 미디어 타입이 없습니다.",
                    )
                }
            }
        }
    }

    @Test
    fun `공개 응답과 요청 DTO의 모든 필드는 Swagger에서 의미를 설명한다`() {
        val document = openApiDocument()
        val schemas = document.path("components").path("schemas")
        val schemasWithIsEtf = listOf(
            "PurchasedStockResponseDto",
            "StockSearchItemResponseDto",
            "TradeHistoryRowResponseDto",
            "TradeRequestDto",
            "UpdateTradeRequestDto",
        )
        schemasWithIsEtf.forEach { schemaName ->
            val properties = schemas.path(schemaName).path("properties")
            assertFalse(properties.path("isEtf").isMissingNode, "$schemaName.isEtf가 OpenAPI 문서에 없습니다.")
            assertTrue(properties.path("etf").isMissingNode, "$schemaName.isEtf가 etf라는 잘못된 이름으로 문서화되었습니다.")
        }

        val publicSchemas = listOf(
            "BrokerageResponseDto",
            "BrokeragePositionGroupResponseDto",
            "DashboardOwnerResponseDto",
            "DashboardPositionResponseDto",
            "DashboardSnapshotResponseDto",
            "DashboardSummaryTotalsResponseDto",
            "OwnerTotalsResponseDto",
            "HistoryFiltersResponseDto",
            "PurchasedStockResponseDto",
            "TradeHistoryResponseDto",
            "TradeHistoryRowResponseDto",
            "OwnerResponseDto",
            "StockSearchItemResponseDto",
            "DeleteTradesRequestDto",
            "DeleteTradesResponseDto",
            "PositionAverageResponseDto",
            "TradeIdResponseDto",
            "TradePreviewRequestDto",
            "TradePreviewResponseDto",
            "TradeRequestDto",
            "UpdateTradeRequestDto",
        )

        publicSchemas.forEach { schemaName ->
            val schema = schemas.path(schemaName)
            assertFalse(schema.isMissingNode, "$schemaName 스키마가 OpenAPI 문서에 없습니다.")
        }

        schemas.properties().forEach { (schemaName, schema) ->
            assertTrue(schema.path("description").asString().isNotBlank(), "$schemaName 설명이 비어 있습니다.")
            assertTrue(schema.path("properties").size() > 0, "$schemaName 필드가 OpenAPI 문서에 없습니다.")
            schema.path("properties").properties().forEach { (propertyName, property) ->
                assertTrue(
                    property.path("description").asString().isNotBlank(),
                    "$schemaName.$propertyName 설명이 비어 있습니다.",
                )
            }
        }

        assertEquals("240", schemas.path("BrokerageResponseDto").path("properties").path("code").path("example").asString())
        assertEquals("264", schemas.path("DashboardPositionResponseDto").path("properties").path("brokerageCode").path("example").asString())
        assertEquals("키움증권", schemas.path("DashboardPositionResponseDto").path("properties").path("brokerageName").path("example").asString())
        assertFalse(schemas.toString().contains("KIWOOM"), "존재하지 않는 영문 증권사 코드 KIWOOM이 문서에 남아 있습니다.")

        val tradeRequest = schemas.path("TradeRequestDto")
        assertEquals("2026-08-20T09:30", tradeRequest.path("properties").path("executedAt").path("example").asString())
        assertEquals("005930", tradeRequest.path("properties").path("itemCode").path("example").asString())
        assertEquals("10", tradeRequest.path("properties").path("quantity").path("example").asString())
        val requiredTradeFields = tradeRequest.path("required").values().map { it.asString() }.toSet()
        assertEquals(
            setOf("brokerageCode", "executedAt", "isEtf", "itemCode", "market", "ownerId", "quantity", "securityName", "side", "unitPrice"),
            requiredTradeFields,
        )

        val currentPrice = schemas.path("OwnerTotalsResponseDto").path("properties").path("currentPrice")
        assertFalse(currentPrice.isMissingNode, "OwnerTotalsResponseDto.currentPrice가 OpenAPI 문서에 없습니다.")
        val currentPriceType = currentPrice.path("type")
        assertTrue(
            currentPriceType.asString() == "null" ||
                currentPriceType.isArray && currentPriceType.size() == 1 && currentPriceType.first().asString() == "null",
            "OwnerTotalsResponseDto.currentPrice는 항상 null인 스키마여야 합니다.",
        )

        val historySideParameter = document
            .path("paths")
            .path("/api/v1/trades/history")
            .path("get")
            .path("parameters")
            .values()
            .single { it.path("name").asString() == "side" }
        val tradeSideValues = historySideParameter.path("schema").path("enum").values().map { it.asString() }
        assertEquals(
            listOf("BUY", "SELL"),
            tradeSideValues,
            "TradeSide 허용값은 BUY와 SELL이 한 번씩만 노출되어야 합니다.",
        )
        val valuationSessions = schemas.path("DashboardSnapshotResponseDto").path("properties").path("valuationSessions")
        assertTrue(valuationSessions.path("enum").isMissingNode, "valuationSessions 배열 자체에 enum이 지정되어서는 안 됩니다.")
        val valuationSessionValues = valuationSessions.path("items").path("enum").values().map { it.asString() }
        assertEquals(
            listOf("PREOPEN", "PRE_MARKET", "REGULAR_MARKET", "AFTER_MARKET"),
            valuationSessionValues,
        )
        val pageSize = schemas.path("TradeHistoryResponseDto").path("properties").path("pageSize")
        assertEquals(25, pageSize.path("minimum").intValue())
        assertEquals(25, pageSize.path("maximum").intValue())
    }

    private fun openApiDocument() = objectMapper.readTree(
        mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk)
            .andReturn()
            .response
            .contentAsByteArray,
    )

}
