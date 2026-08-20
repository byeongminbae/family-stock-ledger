package kr.byeongmin.stockdaejang.domain.owner.service

import kr.byeongmin.stockdaejang.domain.owner.dto.OwnerResponseDto
import kr.byeongmin.stockdaejang.domain.owner.repository.OwnerRepository
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class OwnerService(
    private val ownerRepository: OwnerRepository,
) {
    @Transactional(readOnly = true)
    fun getList(): SuccessDataResponse<List<OwnerResponseDto>> {
        return SuccessDataResponse(
            ownerRepository.findAll().map(OwnerResponseDto::from),
        )
    }
}
