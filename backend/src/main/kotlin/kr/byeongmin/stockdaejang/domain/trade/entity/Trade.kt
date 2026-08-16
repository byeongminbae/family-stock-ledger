package kr.byeongmin.stockdaejang.domain.trade.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import java.math.BigInteger
import java.time.OffsetDateTime

@Entity
@Table(name = "trades")
class Trade(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    var owner: Owner,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "security_id", nullable = false)
    var security: Security,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brokerage_id")
    var brokerage: Brokerage? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "side", nullable = false)
    var side: TradeSide,

    @Column(name = "executed_at", nullable = false)
    var executedAt: OffsetDateTime,

    @Column(name = "quantity", nullable = false)
    var quantity: Long,

    @Column(name = "unit_price", nullable = false)
    var unitPrice: Long,

    @Column(name = "realized_profit", precision = 38, scale = 0)
    var realizedProfit: BigInteger? = null,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: OffsetDateTime = OffsetDateTime.now(),
)
