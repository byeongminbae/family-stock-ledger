package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.brokerage.repository.BrokerageQueryRepository
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.owner.repository.OwnerQueryRepository
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.domain.stock.repository.SecurityCatalogRepository
import kr.byeongmin.stockdaejang.domain.trade.dto.ParsedTradeDto
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.stereotype.Component

@Component
class TradeReferenceResolver(
    private val ownerQueryRepository: OwnerQueryRepository,
    private val brokerageQueryRepository: BrokerageQueryRepository,
    private val securityCatalogRepository: SecurityCatalogRepository,
) {
    internal fun resolve(parsedTrade: ParsedTradeDto): ResolvedTradeReferencesDto {
        val owner = requireOwner(parsedTrade.ownerId)
        val brokerage = brokerageQueryRepository.findByCode(parsedTrade.brokerageCode)
            ?: throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
        val security = securityCatalogRepository.upsert(
            parsedTrade.itemCode,
            parsedTrade.securityName,
            parsedTrade.market,
            parsedTrade.isEtf,
        )
        return ResolvedTradeReferencesDto(owner, brokerage, security)
    }

    fun requireOwner(ownerId: Short): Owner {
        return ownerQueryRepository.findById(ownerId)
            ?: throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
    }

    internal data class ResolvedTradeReferencesDto(
        val owner: Owner,
        val brokerage: Brokerage,
        val security: Security,
    )
}
