package kr.byeongmin.stockdaejang.domain.stock.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.EntityManager
import jakarta.persistence.LockModeType
import kr.byeongmin.stockdaejang.domain.stock.entity.QSecurity.security
import kr.byeongmin.stockdaejang.domain.stock.entity.QSecurityCatalogLock.securityCatalogLock
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.domain.stock.entity.SecurityCatalogLockName
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.stereotype.Repository

@Repository
class SecurityCatalogRepository(
    private val queryFactory: JPAQueryFactory,
    private val entityManager: EntityManager,
) {
    fun upsert(itemCode: String, stockName: String, market: String, isEtf: Boolean): Security {
        lockCatalog()
        val existingSecurity = queryFactory
            .selectFrom(security)
            .where(security.itemCode.eq(itemCode))
            .fetchOne()

        if (existingSecurity != null) {
            existingSecurity.market = market
            existingSecurity.isEtf = isEtf
            return existingSecurity
        }

        val newSecurity = Security.of(itemCode, stockName, market, isEtf)
        entityManager.persist(newSecurity)
        entityManager.flush()
        return newSecurity
    }

    private fun lockCatalog() {
        queryFactory
            .select(securityCatalogLock.name)
            .from(securityCatalogLock)
            .where(securityCatalogLock.name.eq(SecurityCatalogLockName.CATALOG))
            .setLockMode(LockModeType.PESSIMISTIC_WRITE)
            .fetchOne()
            ?: throw BusinessException(CommonError.INTERNAL_SERVER_ERROR)
    }
}
