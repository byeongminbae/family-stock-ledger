package kr.byeongmin.stockdaejang.support

import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.EntityManager
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.QSecurity.security
import kr.byeongmin.stockdaejang.domain.trade.entity.QTrade.trade
import org.springframework.transaction.annotation.Transactional

open class QueryDslTestData(
    private val queryFactory: JPAQueryFactory,
    private val entityManager: EntityManager,
) {
    @Transactional
    open fun clearTrades() {
        queryFactory.delete(trade).execute()
        queryFactory.delete(security).execute()
    }

    @Transactional
    open fun createOwner(id: Long, name: String) {
        entityManager.persist(Owner(id, name))
        entityManager.flush()
    }
}
