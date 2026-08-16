package kr.byeongmin.stockdaejang.domain.trade.repository

import com.querydsl.jpa.impl.JPAQuery
import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.LockModeType
import kr.byeongmin.stockdaejang.domain.brokerage.entity.QBrokerage.brokerage
import kr.byeongmin.stockdaejang.domain.stock.entity.QSecurity.security
import kr.byeongmin.stockdaejang.domain.trade.entity.QTrade.trade
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import org.springframework.stereotype.Repository
import java.time.Instant
import java.time.ZoneOffset

@Repository
class TradeLedgerRepository(private val queryFactory: JPAQueryFactory) {
    fun lock(itemCodes: List<String>) {
        val sortedItemCodes = itemCodes.distinct().sorted()
        queryFactory
            .select(security.id)
            .from(security)
            .where(security.itemCode.`in`(sortedItemCodes))
            .orderBy(security.itemCode.asc())
            .setLockMode(LockModeType.PESSIMISTIC_WRITE)
            .fetch()
    }

    fun findEntriesBefore(
        ownerId: Short,
        brokerageId: Long?,
        itemCode: String,
        beforeExclusive: Instant,
    ): List<Trade> {
        return findEntries(ownerId, brokerageId, itemCode, beforeExclusive)
    }

    fun findTradesFrom(
        ownerId: Short,
        brokerageId: Long?,
        itemCode: String,
        fromInclusive: Instant,
    ): List<Trade> {
        return baseLedgerQuery(ownerId, brokerageId, itemCode)
            .where(trade.executedAt.goe(fromInclusive.atOffset(ZoneOffset.UTC)))
            .orderBy(trade.executedAt.asc(), trade.id.asc())
            .fetch()
    }

    fun findCurrentEntries(
        ownerId: Short,
        brokerageCode: String,
        itemCode: String,
    ): List<Trade> {
        return queryFactory
            .selectFrom(trade)
            .join(trade.security, security)
            .join(trade.brokerage, brokerage)
            .where(
                trade.owner.id.eq(ownerId),
                brokerage.code.eq(brokerageCode),
                security.itemCode.eq(itemCode),
            )
            .orderBy(trade.executedAt.asc(), trade.id.asc())
            .fetch()
    }

    private fun findEntries(
        ownerId: Short,
        brokerageId: Long?,
        itemCode: String,
        beforeExclusive: Instant,
    ): List<Trade> {
        return baseLedgerQuery(ownerId, brokerageId, itemCode)
            .where(trade.executedAt.lt(beforeExclusive.atOffset(ZoneOffset.UTC)))
            .orderBy(trade.executedAt.asc(), trade.id.asc())
            .fetch()
    }

    private fun baseLedgerQuery(ownerId: Short, brokerageId: Long?, itemCode: String): JPAQuery<Trade> {
        return queryFactory
            .selectFrom(trade)
            .join(trade.security, security)
            .where(
                trade.owner.id.eq(ownerId),
                security.itemCode.eq(itemCode),
                brokerageId?.let { trade.brokerage.id.eq(it) } ?: trade.brokerage.isNull,
            )
    }
}
