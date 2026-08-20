package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.trade.dto.DeleteTradesRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradePreviewRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradeRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.UpdateTradeRequestDto
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.Instant
import kotlin.test.assertEquals

class TradeInputParserTest {
    @Test
    fun `한국 로컬 거래일시는 서울 시간의 실제 존재하는 분 단위 시각만 허용한다`() {
        val parsedTrade = TradeInputParser.trade(validRequest(executedAt = "2024-02-29T23:59"))

        assertEquals(Instant.parse("2024-02-29T14:59:00Z"), parsedTrade.executedAt)
        assertThrows<BusinessException> {
            TradeInputParser.trade(validRequest(executedAt = "2023-02-29T12:00"))
        }
        assertThrows<BusinessException> {
            TradeInputParser.trade(validRequest(executedAt = "2024-02-29T23:59:00"))
        }
    }

    @Test
    fun `수량은 등록 수정 미리보기에서 Int 최댓값까지만 허용한다`() {
        TradeInputParser.trade(validRequest(quantity = Int.MAX_VALUE.toString()))
        TradeInputParser.update(validUpdateRequest(quantity = Int.MAX_VALUE.toString()))
        TradeInputParser.preview(validPreviewRequest(quantity = Int.MAX_VALUE.toString()))

        assertThrows<BusinessException> {
            TradeInputParser.trade(validRequest(quantity = (Int.MAX_VALUE.toLong() + 1).toString()))
        }
        assertThrows<BusinessException> {
            TradeInputParser.update(validUpdateRequest(quantity = (Int.MAX_VALUE.toLong() + 1).toString()))
        }
        assertThrows<BusinessException> {
            TradeInputParser.preview(validPreviewRequest(quantity = (Int.MAX_VALUE.toLong() + 1).toString()))
        }
        assertThrows<BusinessException> {
            TradeInputParser.trade(validRequest(unitPrice = "0"))
        }
    }

    @Test
    fun `Short 최댓값을 넘는 소유주 ID를 거래 입력으로 해석한다`() {
        val parsedTrade = TradeInputParser.trade(validRequest(ownerId = 40_000L))

        assertEquals(40_000L, parsedTrade.ownerId)
    }

    @Test
    fun `등록 형식이 아닌 증권사와 중복 삭제 ID를 거부한다`() {
        val invalidBrokerageException = assertThrows<BusinessException> {
            TradeInputParser.trade(validRequest(brokerageCode = "12A"))
        }
        val duplicateTradeIdException = assertThrows<BusinessException> {
            TradeInputParser.delete(DeleteTradesRequestDto(listOf("1", "1"), "BUY"))
        }

        assertEquals(CommonError.INVALID_INPUT_VALUE, invalidBrokerageException.errorType)
        assertEquals(CommonError.INVALID_INPUT_VALUE, duplicateTradeIdException.errorType)
    }

    private fun validRequest(
        brokerageCode: String = "264",
        executedAt: String = "2026-08-14T12:30",
        ownerId: Long = 1,
        quantity: String = "3",
        unitPrice: String = "70000",
    ): TradeRequestDto {
        return TradeRequestDto(
            brokerageCode = brokerageCode,
            executedAt = executedAt,
            isEtf = false,
            itemCode = "005930",
            market = "KOSPI",
            ownerId = ownerId,
            quantity = quantity,
            securityName = "삼성전자",
            side = "BUY",
            unitPrice = unitPrice,
        )
    }

    private fun validUpdateRequest(quantity: String): UpdateTradeRequestDto {
        return UpdateTradeRequestDto(
            id = "1",
            brokerageCode = "264",
            executedAt = "2026-08-14T12:30",
            isEtf = false,
            itemCode = "005930",
            market = "KOSPI",
            ownerId = 1,
            quantity = quantity,
            securityName = "삼성전자",
            side = "BUY",
            unitPrice = "70000",
        )
    }

    private fun validPreviewRequest(quantity: String): TradePreviewRequestDto {
        return TradePreviewRequestDto(
            brokerageCode = "264",
            itemCode = "005930",
            ownerId = 1,
            quantity = quantity,
            side = "BUY",
            unitPrice = "70000",
        )
    }
}
