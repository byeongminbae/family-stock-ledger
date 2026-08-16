package kr.byeongmin.stockdaejang.domain.trade.dto

data class TradeIdResponseDto(val id: String) {
    companion object {
        fun of(id: Long): TradeIdResponseDto {
            return TradeIdResponseDto(id.toString())
        }
    }
}
