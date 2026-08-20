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
import tools.jackson.databind.JsonNode
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
        // Given

        // When
        val document = openApiDocument()
        val schemas = document.path("components").path("schemas")

        // Then
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
            "DashboardBrokerageResponseDto",
            "DashboardOwnerResponseDto",
            "DashboardResponseDto",
            "DashboardStockResponseDto",
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

        val dashboardSchemas = buildSet {
            schemas.properties().forEach { (schemaName, _) ->
                if (schemaName.startsWith("Dashboard") && schemaName.endsWith("ResponseDto")) {
                    add(schemaName)
                }
            }
        }
        assertEquals(
            setOf(
                "DashboardResponseDto",
                "DashboardOwnerResponseDto",
                "DashboardBrokerageResponseDto",
                "DashboardStockResponseDto",
            ),
            dashboardSchemas,
            "공개 대시보드 응답 스키마는 새 네 종류만 존재해야 합니다.",
        )
        listOf(
            "DashboardSnapshotResponseDto",
            "DashboardPositionResponseDto",
            "DashboardSummaryTotalsResponseDto",
            "BrokeragePositionGroupResponseDto",
            "OwnerTotalsResponseDto",
        ).forEach { obsoleteSchemaName ->
            assertTrue(
                schemas.path(obsoleteSchemaName).isMissingNode,
                "$obsoleteSchemaName 스키마는 OpenAPI 문서에서 제거되어야 합니다.",
            )
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
        val tradeHistoryRow = schemas.path("TradeHistoryRowResponseDto")
        assertTrue(tradeHistoryRow.path("required").values().map { it.asString() }.toSet().containsAll(setOf("brokerageCode", "brokerageName")))
        assertFalse(tradeHistoryRow.path("properties").path("brokerageCode").path("nullable").asBoolean())
        assertFalse(tradeHistoryRow.path("properties").path("brokerageName").path("nullable").asBoolean())
        assertDashboardOpenApiContract(schemas)
        assertFalse(schemas.toString().contains("KIWOOM"), "존재하지 않는 영문 증권사 코드 KIWOOM이 문서에 남아 있습니다.")

        val tradeRequest = schemas.path("TradeRequestDto")
        assertEquals("2026-08-20T09:30", tradeRequest.path("properties").path("executedAt").path("example").asString())
        assertEquals("005930", tradeRequest.path("properties").path("itemCode").path("example").asString())
        assertEquals("10", tradeRequest.path("properties").path("quantity").path("example").asString())
        val intQuantityPattern = "^(?:[1-9][0-9]{0,8}|1[0-9]{9}|20[0-9]{8}|21[0-3][0-9]{7}|214[0-6][0-9]{6}|2147[0-3][0-9]{5}|21474[0-7][0-9]{4}|214748[0-2][0-9]{3}|2147483[0-5][0-9]{2}|21474836[0-3][0-9]|214748364[0-7])$"
        listOf("UpdateTradeRequestDto", "TradePreviewRequestDto").forEach { requestSchemaName ->
            val quantity = schemas.path(requestSchemaName).path("properties").path("quantity")
            assertEquals("거래 수량. 1 이상 2147483647 이하의 정수 문자열", quantity.path("description").asString())
            assertEquals(10, quantity.path("maxLength").asInt())
            assertEquals(intQuantityPattern, quantity.path("pattern").asString())
        }
        assertEquals("거래 수량. 1 이상 2147483647 이하의 정수 문자열", tradeRequest.path("properties").path("quantity").path("description").asString())
        assertEquals(10, tradeRequest.path("properties").path("quantity").path("maxLength").asInt())
        assertEquals(intQuantityPattern, tradeRequest.path("properties").path("quantity").path("pattern").asString())
        val requiredTradeFields = tradeRequest.path("required").values().map { it.asString() }.toSet()
        assertEquals(
            setOf("brokerageCode", "executedAt", "isEtf", "itemCode", "market", "ownerId", "quantity", "securityName", "side", "unitPrice"),
            requiredTradeFields,
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
        val valuationSession = schemas.path("DashboardResponseDto").path("properties").path("valuationSession")
        assertNullable(valuationSession, "string")
        val valuationSessionValues = valuationSession.path("enum").values().map { it.asString() }
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

    private fun assertDashboardOpenApiContract(schemas: JsonNode) {
        assertDashboardSchema(
            schemas.path("DashboardResponseDto"),
            setOf("stockCount", "checkedStockCount", "totalBuyAmount", "valuation", "unrealizedProfit", "owners", "quoteFetchedAt", "valuationSession"),
            setOf("stockCount", "checkedStockCount", "totalBuyAmount", "valuation", "unrealizedProfit", "owners", "quoteFetchedAt", "valuationSession"),
        )
        assertDashboardSchema(
            schemas.path("DashboardOwnerResponseDto"),
            setOf("ownerId", "ownerName", "stockCount", "totalBuyAmount", "valuation", "unrealizedProfit", "brokerages"),
            setOf("ownerId", "ownerName", "stockCount", "totalBuyAmount", "valuation", "unrealizedProfit", "brokerages"),
        )
        assertDashboardSchema(
            schemas.path("DashboardBrokerageResponseDto"),
            setOf("brokerageCode", "brokerageName", "stockCount", "totalBuyAmount", "valuation", "unrealizedProfit", "stocks"),
            setOf("brokerageCode", "brokerageName", "stockCount", "totalBuyAmount", "valuation", "unrealizedProfit", "stocks"),
        )
        assertDashboardSchema(
            schemas.path("DashboardStockResponseDto"),
            setOf("stockCode", "stockName", "quantity", "averageBuyPrice", "totalBuyAmount", "brokerageWeight", "currentPrice", "valuation", "unrealizedProfit", "returnRate"),
            setOf("stockCode", "stockName", "quantity", "averageBuyPrice", "totalBuyAmount", "brokerageWeight", "currentPrice", "valuation", "unrealizedProfit", "returnRate"),
        )

        val root = schemas.path("DashboardResponseDto").path("properties")
        assertInteger(root.path("stockCount"), "int32")
        assertInteger(root.path("checkedStockCount"), "int32")
        assertNumber(root.path("totalBuyAmount"))
        assertNumber(root.path("valuation"))
        assertNumber(root.path("unrealizedProfit"))
        assertNullable(root.path("quoteFetchedAt"), "string")
        assertNullable(root.path("valuationSession"), "string")

        val owner = schemas.path("DashboardOwnerResponseDto").path("properties")
        assertInteger(owner.path("ownerId"), "int64")
        assertInteger(owner.path("stockCount"), "int32")
        assertNumber(owner.path("totalBuyAmount"))
        assertNumber(owner.path("valuation"))
        assertNumber(owner.path("unrealizedProfit"))

        val brokerage = schemas.path("DashboardBrokerageResponseDto").path("properties")
        assertInteger(brokerage.path("stockCount"), "int32")
        assertNumber(brokerage.path("totalBuyAmount"))
        assertNumber(brokerage.path("valuation"))
        assertNumber(brokerage.path("unrealizedProfit"))
        assertFalse(brokerage.path("brokerageCode").path("nullable").asBoolean(), "DashboardBrokerageResponseDto.brokerageCode은 null일 수 없습니다.")
        assertFalse(brokerage.path("brokerageName").path("nullable").asBoolean(), "DashboardBrokerageResponseDto.brokerageName은 null일 수 없습니다.")

        val stock = schemas.path("DashboardStockResponseDto").path("properties")
        assertInteger(stock.path("quantity"), "int32")
        listOf("averageBuyPrice", "totalBuyAmount", "brokerageWeight", "currentPrice", "valuation", "unrealizedProfit", "returnRate").forEach {
            assertNumber(stock.path(it))
        }
    }

    private fun assertDashboardSchema(schema: JsonNode, propertyNames: Set<String>, requiredPropertyNames: Set<String>) {
        val documentedProperties = schema.path("properties").properties().map { it.key }.toSet()
        assertEquals(propertyNames, documentedProperties, "${schema.path("title").asString()} 필드 계약이 일치하지 않습니다.")
        assertEquals(requiredPropertyNames, schema.path("required").values().map { it.asString() }.toSet(), "${schema.path("title").asString()} 필수 필드 계약이 일치하지 않습니다.")
    }

    private fun assertInteger(property: JsonNode, format: String) {
        assertEquals("integer", property.path("type").asString())
        assertEquals(format, property.path("format").asString())
    }

    private fun assertNumber(property: JsonNode) {
        assertEquals("number", property.path("type").asString())
        assertFalse(property.path("nullable").asBoolean(), "${property.path("name").asString()}은 null일 수 없습니다.")
    }

    private fun assertNullable(property: JsonNode, valueType: String) {
        val documentedTypes = property.path("type")
        if (documentedTypes.isArray) {
            assertEquals(setOf(valueType, "null"), documentedTypes.values().map { it.asString() }.toSet())
        } else {
            assertEquals(valueType, documentedTypes.asString())
            assertTrue(property.path("nullable").asBoolean(), "$valueType 필드는 null일 수 있어야 합니다.")
        }
    }

}
