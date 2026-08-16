package kr.byeongmin.stockdaejang.domain.brokerage.service

import kr.byeongmin.stockdaejang.domain.brokerage.dto.BrokerageResponseDto
import kr.byeongmin.stockdaejang.domain.brokerage.repository.BrokerageQueryRepository
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BrokerageService(
    private val brokerageQueryRepository: BrokerageQueryRepository,
) {
    @Transactional(readOnly = true)
    fun getList(): SuccessDataResponse<List<BrokerageResponseDto>> {
        return SuccessDataResponse(
            brokerageQueryRepository.findAll().map(BrokerageResponseDto::from),
        )
    }
}
