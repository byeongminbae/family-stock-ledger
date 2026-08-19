package kr.byeongmin.stockdaejang.domain.owner.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import kr.byeongmin.stockdaejang.domain.owner.dto.OwnerResponseDto
import kr.byeongmin.stockdaejang.domain.owner.service.OwnerService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping(value = ["/api/v1/owners"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "소유주", description = "보유 종목과 거래의 소유주 목록")
class OwnerController(
    private val ownerService: OwnerService,
) {
    @GetMapping
    @Operation(summary = "소유주 목록 조회", description = "거래와 보유 종목에 지정할 수 있는 소유주 목록을 조회합니다.")
    fun getList(): SuccessDataResponse<List<OwnerResponseDto>> {
        return ownerService.getList()
    }
}
