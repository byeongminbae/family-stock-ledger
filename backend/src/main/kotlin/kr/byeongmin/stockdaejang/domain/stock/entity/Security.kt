package kr.byeongmin.stockdaejang.domain.stock.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.PreUpdate
import jakarta.persistence.Table
import java.time.OffsetDateTime

@Entity
@Table(name = "securities")
class Security(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    val id: Long? = null,

    @Column(name = "item_code", nullable = false, unique = true)
    val itemCode: String,

    @Column(name = "stock_name", nullable = false)
    var stockName: String,

    @Column(name = "market", nullable = false)
    var market: String,

    @Column(name = "is_etf", nullable = false)
    var isEtf: Boolean = false,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: OffsetDateTime = OffsetDateTime.now(),
) {
    @PreUpdate
    fun updateTimestamp() {
        updatedAt = OffsetDateTime.now()
    }

    companion object {
        fun of(
            itemCode: String,
            stockName: String,
            market: String,
            isEtf: Boolean,
        ): Security {
            return Security(
                itemCode = itemCode,
                stockName = stockName,
                market = market,
                isEtf = isEtf,
            )
        }
    }
}
