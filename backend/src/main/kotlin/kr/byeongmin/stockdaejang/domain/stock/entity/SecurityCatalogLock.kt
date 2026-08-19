package kr.byeongmin.stockdaejang.domain.stock.entity

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "security_catalog_locks")
@Schema(description = "내부 동시성 잠금용이며 공개 API 모델이 아님")
class SecurityCatalogLock(
    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false)
    @field:Schema(description = "종목 기준 정보 갱신 잠금 이름", example = "CATALOG")
    val name: SecurityCatalogLockName,
)
