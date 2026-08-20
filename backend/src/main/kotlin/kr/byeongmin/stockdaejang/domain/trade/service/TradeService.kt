package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.trade.dto.DeleteTradesRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.DeleteTradesResponseDto
import kr.byeongmin.stockdaejang.domain.trade.dto.PositionAverageResponseDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradeIdResponseDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradePreviewRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradePreviewResponseDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradeRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.UpdateTradeRequestDto
import kr.byeongmin.stockdaejang.domain.trade.repository.TradeCommandRepository
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
class TradeService(
    private val tradeReferenceResolver: TradeReferenceResolver,
    private val tradeCommandRepository: TradeCommandRepository,
    private val tradeLedgerManager: TradeLedgerManager,
    private val tradePreviewCalculator: TradePreviewCalculator,
) {
    @Transactional
    fun createTrade(request: TradeRequestDto): SuccessDataResponse<TradeIdResponseDto> {
        val parsedTrade = TradeInputParser.trade(request)
        val resolvedTradeReferences = tradeReferenceResolver.resolve(parsedTrade)
        val ledgerKey = LedgerKey.from(parsedTrade, resolvedTradeReferences.brokerage)
        tradeLedgerManager.lock(listOf(ledgerKey))
        val createdTrade = tradeCommandRepository.create(
            parsedTrade.toEntity(
                resolvedTradeReferences.owner,
                resolvedTradeReferences.brokerage,
                resolvedTradeReferences.security,
            ),
        )
        tradeLedgerManager.replay(ledgerKey, parsedTrade.executedAt)
        return SuccessDataResponse(TradeIdResponseDto.of(createdTrade.id.ifNullThrow()))
    }

    @Transactional
    fun updateTrade(request: UpdateTradeRequestDto): SuccessDataResponse<TradeIdResponseDto> {
        val parsedUpdate = TradeInputParser.update(request)
        val parsedTrade = parsedUpdate.trade
        val resolvedTradeReferences = tradeReferenceResolver.resolve(parsedTrade)
        tradeCommandRepository.lockIds(listOf(parsedUpdate.id))
        val selectedTrade = tradeCommandRepository
            .find(listOf(parsedUpdate.id), parsedTrade.side)
            .singleOrNull()
            ?: throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
        val previousLedgerKey = LedgerKey.from(selectedTrade)
        val updatedLedgerKey = LedgerKey.from(parsedTrade, resolvedTradeReferences.brokerage)
        val affectedLedgers = earliestByLedger(
            listOf(
                previousLedgerKey to selectedTrade.executedAt.toInstant(),
                updatedLedgerKey to parsedTrade.executedAt,
            ),
        )
        tradeLedgerManager.lock(affectedLedgers.map(AffectedLedger::key))
        if (tradeCommandRepository.find(listOf(parsedUpdate.id), parsedTrade.side).size != 1) {
            throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
        }
        val updatedTradeCount = tradeCommandRepository.update(
            parsedUpdate.id,
            parsedTrade.toEntity(
                resolvedTradeReferences.owner,
                resolvedTradeReferences.brokerage,
                resolvedTradeReferences.security,
            ),
        )
        if (updatedTradeCount != 1) throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
        affectedLedgers.forEach { tradeLedgerManager.replay(it.key, it.updateFrom) }
        return SuccessDataResponse(TradeIdResponseDto.of(parsedUpdate.id))
    }

    @Transactional
    fun deleteTrades(request: DeleteTradesRequestDto): SuccessDataResponse<DeleteTradesResponseDto> {
        val parsedDelete = TradeInputParser.delete(request)
        tradeCommandRepository.lockIds(parsedDelete.ids)
        val selectedTrades = tradeCommandRepository.find(parsedDelete.ids, parsedDelete.side)
        if (selectedTrades.size != parsedDelete.ids.size) throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
        val affectedLedgers = earliestByLedger(
            selectedTrades.map { LedgerKey.from(it) to it.executedAt.toInstant() },
        )
        tradeLedgerManager.lock(affectedLedgers.map(AffectedLedger::key))
        if (
            tradeCommandRepository.find(parsedDelete.ids, parsedDelete.side).size !=
            parsedDelete.ids.size
        ) {
            throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
        }
        val deletedTradeCount = tradeCommandRepository.delete(parsedDelete.ids, parsedDelete.side)
        if (deletedTradeCount != parsedDelete.ids.size) throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
        affectedLedgers.forEach { tradeLedgerManager.replay(it.key, it.updateFrom) }
        return SuccessDataResponse(DeleteTradesResponseDto.of(deletedTradeCount))
    }

    @Transactional(readOnly = true)
    fun getPositionAverage(
        ownerId: Long?,
        brokerageCode: String?,
        itemCode: String?,
    ): SuccessDataResponse<PositionAverageResponseDto> {
        val parsedPosition = TradeInputParser.position(ownerId, brokerageCode, itemCode)
        tradeReferenceResolver.requireOwner(parsedPosition.ownerId)
        return SuccessDataResponse(
            tradePreviewCalculator.positionAverage(tradeLedgerManager.current(parsedPosition)),
        )
    }

    @Transactional(readOnly = true)
    fun previewTrade(request: TradePreviewRequestDto): SuccessDataResponse<TradePreviewResponseDto> {
        val parsedPreview = TradeInputParser.preview(request)
        tradeReferenceResolver.requireOwner(parsedPreview.ownerId)
        return SuccessDataResponse(
            tradePreviewCalculator.preview(parsedPreview, tradeLedgerManager.current(parsedPreview)),
        )
    }

    private fun earliestByLedger(entries: List<Pair<LedgerKey, Instant>>): List<AffectedLedger> {
        return entries.groupBy { it.first.lockText() }
            .values
            .map { ledgerEntries ->
                AffectedLedger(
                    key = ledgerEntries.first().first,
                    updateFrom = ledgerEntries.minOf { it.second },
                )
            }
            .sortedBy { it.key.lockText() }
    }

    private data class AffectedLedger(val key: LedgerKey, val updateFrom: Instant)
}
