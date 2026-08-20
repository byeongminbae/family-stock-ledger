package kr.byeongmin.stockdaejang.domain.owner.dto

import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner

@Schema(description = "거래 입력, 내역 필터와 대시보드에서 사용하는 소유주 정보")
data class OwnerResponseDto(
    @field:Schema(
        description = "소유주 ID",
        example = "1",
        minimum = "1",
    )
    val id: Long,
    @field:Schema(
        description = "소유주명",
        example = "병민",
    )
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
