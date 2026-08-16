package kr.byeongmin.stockdaejang.domain.dashboard.dto

import kr.byeongmin.stockdaejang.domain.owner.entity.Owner

data class OwnerSummaryDto(
    val id: Short,
    val name: String,
) {
    companion object {
        fun from(owner: Owner): OwnerSummaryDto {
            return OwnerSummaryDto(
                id = owner.id,
                name = owner.name,
            )
        }
    }
}
