package kr.byeongmin.stockdaejang.domain.stock.entity

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "종목 기준 정보 갱신 잠금 이름")
enum class SecurityCatalogLockName {
    @Schema(description = "종목 기준정보 갱신을 직렬화하는 내부 잠금 이름")
    CATALOG,
}
