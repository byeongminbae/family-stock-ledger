package kr.byeongmin.stockdaejang.domain.trade.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.EntityManager
import jakarta.persistence.LockModeType
import kr.byeongmin.stockdaejang.domain.trade.entity.QTrade.trade
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import org.springframework.stereotype.Repository
import java.math.BigInteger

@Repository
class TradeCommandRepository(
    private val queryFactory: JPAQueryFactory,
    private val entityManager: EntityManager,
) {
    fun create(tradeEntity: Trade): Trade {
        entityManager.persist(tradeEntity)
        entityManager.flush()
        return tradeEntity
    }

    fun update(tradeId: Long, replacementTrade: Trade): Int {
        val updateClause = queryFactory
            .update(trade)
            .set(trade.owner, replacementTrade.owner)
            .set(trade.security, replacementTrade.security)
            .set(trade.brokerage, replacementTrade.brokerage)
            .set(trade.executedAt, replacementTrade.executedAt)
            .set(trade.quantity, replacementTrade.quantity)
            .set(trade.unitPrice, replacementTrade.unitPrice)
            .where(trade.id.eq(tradeId), trade.side.eq(replacementTrade.side))

        if (replacementTrade.side == TradeSide.SELL) {
            updateClause.set(trade.realizedProfit, BigInteger.ZERO)
        } else {
            updateClause.setNull(trade.realizedProfit)
        }
        val updatedTradeCount = updateClause.execute().toInt()
        entityManager.clear()
        return updatedTradeCount
    }

    fun delete(tradeIds: List<Long>, side: TradeSide): Int {
        return queryFactory
            .delete(trade)
            .where(trade.id.`in`(tradeIds), trade.side.eq(side))
            .execute()
            .toInt()
    }

    fun lockIds(tradeIds: List<Long>) {
        queryFactory
            .select(trade.id)
            .from(trade)
            .where(trade.id.`in`(tradeIds))
            .orderBy(trade.id.asc())
            .setLockMode(LockModeType.PESSIMISTIC_WRITE)
            .fetch()
    }

    fun find(tradeIds: List<Long>, side: TradeSide): List<Trade> {
        return queryFactory
            .selectFrom(trade)
            .where(trade.id.`in`(tradeIds), trade.side.eq(side))
            .orderBy(trade.id.asc())
            .fetch()
    }
}
