package kr.byeongmin.stockdaejang.domain.dashboard.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import kr.byeongmin.stockdaejang.domain.brokerage.entity.QBrokerage.brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.QOwner.owner
import kr.byeongmin.stockdaejang.domain.stock.entity.QSecurity.security
import kr.byeongmin.stockdaejang.domain.trade.entity.QTrade.trade
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
class DashboardRepository(private val queryFactory: JPAQueryFactory) {
    @Transactional(readOnly = true)
    fun findAll(): List<Trade> {
        return queryFactory
            .selectFrom(trade)
            .join(trade.owner, owner).fetchJoin()
            .join(trade.security, security).fetchJoin()
            .join(trade.brokerage, brokerage).fetchJoin()
            .orderBy(
                owner.id.asc(),
                brokerage.name.asc(),
                brokerage.code.asc(),
                security.stockName.asc(),
                security.itemCode.asc(),
                trade.executedAt.asc(),
                trade.id.asc(),
            )
            .fetch()
    }
}
