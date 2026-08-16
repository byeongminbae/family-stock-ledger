package kr.byeongmin.stockdaejang.domain.owner.dto

import kr.byeongmin.stockdaejang.domain.owner.entity.Owner

data class OwnerResponseDto(
    val id: Short,
    val name: String,
) {
    companion object {
        fun from(owner: Owner): OwnerResponseDto {
            return OwnerResponseDto(
                id = owner.id,
                name = owner.name,
            )
        }
    }
}
