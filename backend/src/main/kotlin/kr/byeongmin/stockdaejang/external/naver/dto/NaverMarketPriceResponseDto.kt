package kr.byeongmin.stockdaejang.external.naver.dto

import com.fasterxml.jackson.annotation.JsonFormat
import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import java.time.OffsetDateTime

@JsonIgnoreProperties(ignoreUnknown = true)
internal data class NaverMarketPriceResponseDto(
    @JsonProperty("isSuccess") val isSuccess: Boolean,
    @JsonProperty("result") val result: ResultDto,
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    internal data class ResultDto(
        @JsonProperty("datas") val datas: List<ItemDto>,
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    internal data class ItemDto(
        @JsonProperty("closePriceRaw") val closePriceRaw: String,
        @JsonProperty("itemCode") val itemCode: String,
        @JsonFormat(without = [JsonFormat.Feature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE])
        @JsonProperty("localTradedAt") val localTradedAt: OffsetDateTime,
        @JsonProperty("marketStatus") val marketStatus: String,
        @JsonProperty("overMarketPriceInfo") val overMarketPriceInfo: OverMarketPriceInfoDto?,
        @JsonProperty("stockName") val stockName: String,
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    internal data class OverMarketPriceInfoDto(
        @JsonFormat(without = [JsonFormat.Feature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE])
        @JsonProperty("localTradedAt") val localTradedAt: OffsetDateTime,
        @JsonProperty("overMarketStatus") val overMarketStatus: String?,
        @JsonProperty("overPrice") val overPrice: String,
        @JsonProperty("tradingSessionType") val tradingSessionType: String,
    )
}
