package kr.byeongmin.stockdaejang.domain.stock.entity

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
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
@Schema(description = "종목 기준 정보")
class Security(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    @field:Schema(description = "종목 내부 대리키", example = "1")
    val id: Long? = null,

    @Column(name = "item_code", nullable = false, unique = true)
    @field:Schema(description = "종목코드. 영문 대문자 또는 숫자 6자리이며 중복되지 않습니다.", example = "005930", pattern = "^[0-9A-Z]{6}$")
    val itemCode: String,

    @Column(name = "stock_name", nullable = false)
    @field:Schema(description = "종목명", example = "삼성전자")
    var stockName: String,

    @Column(name = "market", nullable = false)
    @field:Schema(description = "시장", example = "코스피")
    var market: String,

    @Column(name = "is_etf", nullable = false)
    @get:JsonProperty("isEtf")
    @get:Schema(name = "isEtf", description = "ETF 여부", example = "false")
    var isEtf: Boolean = false,

    @Column(name = "created_at", nullable = false, updatable = false)
    @field:Schema(description = "종목 기준 정보 생성 일시", example = "2026-08-20T09:30:00+09:00")
    val createdAt: OffsetDateTime = OffsetDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    @field:Schema(description = "종목 기준 정보 수정 일시", example = "2026-08-20T09:30:00+09:00")
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
