package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.trade.dto.ParsedPositionDto
import kr.byeongmin.stockdaejang.domain.trade.dto.ParsedPreviewDto
import kr.byeongmin.stockdaejang.domain.trade.repository.TradeLedgerRepository
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.stereotype.Component
import java.time.Instant

@Component
class TradeLedgerManager(
    private val tradeLedgerRepository: TradeLedgerRepository,
    private val stateCalculator: LedgerStateCalculator,
) {
    internal fun lock(keys: List<LedgerKey>) {
        tradeLedgerRepository.lock(keys.map(LedgerKey::itemCode))
    }

    internal fun replay(key: LedgerKey, updateFrom: Instant): LedgerState {
        val initialLedgerState = stateCalculator.calculate(
            tradeLedgerRepository.findEntriesBefore(key.ownerId, key.brokerageId, key.itemCode, updateFrom)
                .map(LedgerStateCalculator.PersistedLedgerEntryDto::from),
        )
        val managedTrades = tradeLedgerRepository.findTradesFrom(
            key.ownerId,
            key.brokerageId,
            key.itemCode,
            updateFrom,
        )
        val ledgerTrades = managedTrades.map(LedgerReplayCalculator.LedgerTradeDto::from)
        val replayResult = LedgerReplayCalculator.replay(
            initialLedgerState,
            ledgerTrades,
        )
        val managedTradesById = managedTrades.zip(ledgerTrades).associate { (trade, ledgerTrade) ->
            ledgerTrade.id to trade
        }
        replayResult.updates.forEach { update ->
            val managedTrade = managedTradesById[update.tradeId]
                ?: throw BusinessException(CommonError.INTERNAL_SERVER_ERROR)
            managedTrade.realizedProfit = update.realizedProfit
        }
        return replayResult.state
    }

    internal fun current(parsedPosition: ParsedPositionDto): LedgerState {
        return stateCalculator.calculate(
            tradeLedgerRepository.findCurrentEntries(
                parsedPosition.ownerId,
                parsedPosition.brokerageCode,
                parsedPosition.itemCode,
            )
                .map(LedgerStateCalculator.PersistedLedgerEntryDto::from),
        )
    }

    internal fun current(parsedPreview: ParsedPreviewDto): LedgerState {
        return stateCalculator.calculate(
            tradeLedgerRepository.findCurrentEntries(
                parsedPreview.ownerId,
                parsedPreview.brokerageCode,
                parsedPreview.itemCode,
            )
                .map(LedgerStateCalculator.PersistedLedgerEntryDto::from),
        )
    }
}
