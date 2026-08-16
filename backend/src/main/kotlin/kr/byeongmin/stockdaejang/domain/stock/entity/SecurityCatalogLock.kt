package kr.byeongmin.stockdaejang.domain.stock.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "security_catalog_locks")
class SecurityCatalogLock(
    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "name", nullable = false)
    val name: SecurityCatalogLockName,
)
