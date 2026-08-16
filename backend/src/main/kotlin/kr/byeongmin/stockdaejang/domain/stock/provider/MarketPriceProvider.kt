package kr.byeongmin.stockdaejang.domain.stock.provider

import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceSnapshotDto

interface MarketPriceProvider {
    val maxBatchSize: Int

    fun fetchMarketPrices(itemCodes: List<String>): List<MarketPriceSnapshotDto>
}
