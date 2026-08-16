package kr.byeongmin.stockdaejang.support

import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.EntityManager
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.QSecurity.security
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.domain.trade.entity.QTrade.trade
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeSide
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

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
    open fun createTradeWithoutBrokerage(
        itemCode: String,
        stockName: String,
        executedAt: OffsetDateTime,
    ): Long {
        val securityEntity = Security(
            itemCode = itemCode,
            stockName = stockName,
            market = "KRX",
        )
        entityManager.persist(securityEntity)
        val tradeEntity = Trade(
            owner = entityManager.getReference(Owner::class.java, 1.toShort()),
            security = securityEntity,
            brokerage = null,
            side = TradeSide.BUY,
            executedAt = executedAt,
            quantity = 1,
            unitPrice = 100,
        )
        entityManager.persist(tradeEntity)
        entityManager.flush()
        return tradeEntity.id ?: throw BusinessException(CommonError.INTERNAL_SERVER_ERROR)
    }

    @Transactional
    open fun createOwner(id: Short, name: String) {
        entityManager.persist(Owner(id, name))
        entityManager.flush()
    }
}
