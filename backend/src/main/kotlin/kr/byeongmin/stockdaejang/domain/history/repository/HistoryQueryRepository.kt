package kr.byeongmin.stockdaejang.domain.history.repository

import com.querydsl.core.BooleanBuilder
import com.querydsl.jpa.impl.JPAQueryFactory
import kr.byeongmin.stockdaejang.domain.brokerage.entity.QBrokerage.brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.QOwner.owner
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.domain.stock.entity.QSecurity.security
import kr.byeongmin.stockdaejang.domain.trade.entity.QTrade.trade
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

@Repository
class HistoryQueryRepository(private val queryFactory: JPAQueryFactory) {
    @Transactional(readOnly = true)
    fun count(
        side: TradeSide,
        searchQuery: String?,
        fromInclusive: OffsetDateTime?,
        toExclusive: OffsetDateTime?,
        ownerId: Short?,
        brokerageCode: String?,
    ): Long {
        return queryFactory
            .select(trade.count())
            .from(trade)
            .join(trade.owner, owner)
            .join(trade.security, security)
            .leftJoin(trade.brokerage, brokerage)
            .where(predicate(side, searchQuery, fromInclusive, toExclusive, ownerId, brokerageCode))
            .fetchOne() ?: 0
    }

    @Transactional(readOnly = true)
    fun countAll(side: TradeSide): Long {
        return queryFactory
            .select(trade.count())
            .from(trade)
            .where(trade.side.eq(side))
            .fetchOne() ?: 0
    }

    @Transactional(readOnly = true)
    fun findPage(
        side: TradeSide,
        searchQuery: String?,
        fromInclusive: OffsetDateTime?,
        toExclusive: OffsetDateTime?,
        ownerId: Short?,
        brokerageCode: String?,
        offset: Long,
        limit: Long,
    ): List<Trade> {
        return queryFactory
            .selectFrom(trade)
            .join(trade.owner, owner).fetchJoin()
            .join(trade.security, security).fetchJoin()
            .leftJoin(trade.brokerage, brokerage).fetchJoin()
            .where(predicate(side, searchQuery, fromInclusive, toExclusive, ownerId, brokerageCode))
            .orderBy(trade.executedAt.desc(), trade.id.desc())
            .offset(offset)
            .limit(limit)
            .fetch()
    }

    @Transactional(readOnly = true)
    fun findPurchasedStocks(): List<Security> {
        return queryFactory
            .select(security)
            .distinct()
            .from(trade)
            .join(trade.security, security)
            .where(trade.side.eq(TradeSide.BUY))
            .orderBy(security.stockName.asc(), security.itemCode.asc())
            .fetch()
    }

    private fun predicate(
        side: TradeSide,
        searchQuery: String?,
        fromInclusive: OffsetDateTime?,
        toExclusive: OffsetDateTime?,
        ownerId: Short?,
        brokerageCode: String?,
    ): BooleanBuilder {
        return BooleanBuilder(trade.side.eq(side)).apply {
            searchQuery?.let { normalizedSearchQuery ->
                and(
                    security.stockName.containsIgnoreCase(normalizedSearchQuery)
                        .or(security.itemCode.containsIgnoreCase(normalizedSearchQuery)),
                )
            }
            fromInclusive?.let { and(trade.executedAt.goe(it)) }
            toExclusive?.let { and(trade.executedAt.lt(it)) }
            ownerId?.let { and(owner.id.eq(it)) }
            brokerageCode?.let { and(brokerage.code.eq(it)) }
        }
    }
}
