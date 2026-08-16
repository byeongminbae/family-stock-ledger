package kr.byeongmin.stockdaejang.domain.owner.controller

import kr.byeongmin.stockdaejang.domain.owner.dto.OwnerResponseDto
import kr.byeongmin.stockdaejang.domain.owner.service.OwnerService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/owners")
class OwnerController(
    private val ownerService: OwnerService,
) {
    @GetMapping
    fun getList(): SuccessDataResponse<List<OwnerResponseDto>> {
        return ownerService.getList()
    }
}
