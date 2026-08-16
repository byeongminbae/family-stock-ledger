package kr.byeongmin.stockdaejang.domain.trade.dto

data class DeleteTradesResponseDto(val deletedCount: Int) {
    companion object {
        fun of(deletedCount: Int): DeleteTradesResponseDto {
            return DeleteTradesResponseDto(deletedCount)
        }
    }
}
