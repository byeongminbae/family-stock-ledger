package kr.byeongmin.stockdaejang.domain.owner.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.owner.entity.QOwner.owner
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional

@Repository
class OwnerRepository(private val queryFactory: JPAQueryFactory) {
    @Transactional(readOnly = true)
    fun findAll(): List<Owner> {
        return queryFactory
            .selectFrom(owner)
            .orderBy(owner.id.asc())
            .fetch()
    }

    fun findById(id: Long): Owner? {
        return queryFactory
            .selectFrom(owner)
            .where(owner.id.eq(id))
            .fetchOne()
    }
}
