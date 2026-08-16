package kr.byeongmin.stockdaejang.domain.brokerage.entity

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes

@Entity
@Table(name = "brokerages")
class Brokerage(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    val id: Long? = null,

    @Column(name = "code", nullable = false, unique = true)
    @JdbcTypeCode(SqlTypes.CHAR)
    val code: String,

    @Column(name = "name", nullable = false, unique = true)
    val name: String,
)
