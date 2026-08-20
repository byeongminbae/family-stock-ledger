package kr.byeongmin.stockdaejang.domain.owner.entity

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "owners")
@Schema(description = "소유주 정보")
class Owner(
    @Id
    @Column(name = "id", nullable = false)
    @field:Schema(description = "소유주 내부 대리키", example = "1", minimum = "1")
    val id: Long,

    @Column(name = "name", nullable = false, unique = true)
    @field:Schema(description = "소유주명", example = "병민")
    val name: String,
)
