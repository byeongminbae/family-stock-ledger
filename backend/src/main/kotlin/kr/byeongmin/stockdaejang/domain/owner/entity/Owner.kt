package kr.byeongmin.stockdaejang.domain.owner.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "owners")
class Owner(
    @Id
    @Column(name = "id", nullable = false)
    val id: Short,

    @Column(name = "name", nullable = false, unique = true)
    val name: String,
)
