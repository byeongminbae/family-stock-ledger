package kr.byeongmin.stockdaejang.external.naver.dto

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonProperty
import kr.byeongmin.stockdaejang.domain.stock.dto.StockSearchResultDto

@JsonIgnoreProperties(ignoreUnknown = true)
internal data class NaverSearchResponseDto(
    @JsonProperty("isSuccess") val isSuccess: Boolean,
    @JsonProperty("result") val result: ResultDto,
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    internal data class ResultDto(
        @JsonProperty("items") val items: List<ItemDto>,
    )

    @JsonIgnoreProperties(ignoreUnknown = true)
    internal data class ItemDto(
        @JsonProperty("category") val category: String,
        @JsonProperty("code") val code: String,
        @JsonProperty("isEtf") val isEtf: Boolean?,
        @JsonProperty("name") val name: String,
        @JsonProperty("nationCode") val nationCode: String?,
        @JsonProperty("typeCode") val typeCode: String,
        @JsonProperty("typeName") val typeName: String,
        @JsonProperty("url") val url: String,
    ) {
        fun toStockSearchResultDto(): StockSearchResultDto {
            return StockSearchResultDto(
                code = code,
                isEtf = isEtf,
                isStock = category == "stock",
                isKorean = nationCode == "KOR",
                hasDomesticStockPage = url.startsWith("/domestic/stock/"),
                market = typeName,
                name = name,
            )
        }
    }
}
