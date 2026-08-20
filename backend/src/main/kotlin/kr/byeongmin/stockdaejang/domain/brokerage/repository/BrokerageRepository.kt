package kr.byeongmin.stockdaejang.domain.brokerage.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.brokerage.entity.QBrokerage.brokerage
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
class BrokerageRepository(private val queryFactory: JPAQueryFactory) {
    @Transactional(readOnly = true)
    fun findAll(): List<Brokerage> {
        return queryFactory
            .selectFrom(brokerage)
            .orderBy(brokerage.code.asc())
            .fetch()
    }

    fun findByCode(code: String): Brokerage? {
        return queryFactory
            .selectFrom(brokerage)
            .where(brokerage.code.eq(code))
            .fetchOne()
    }
}
