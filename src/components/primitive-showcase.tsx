import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { StatusMessage } from "@/components/ui/status-message";
import { Surface } from "@/components/ui/surface";

export function PrimitiveShowcase() {
  return (
    <section aria-labelledby="primitive-showcase-title" className="primitive-showcase">
      <header className="page-header">
        <p className="page-kicker">개발용 상태 하네스</p>
        <h1 className="page-title" id="primitive-showcase-title">
          공통 UI 프리미티브
        </h1>
        <p className="page-description">
          제품 화면을 추가하기 전에 밝기, 상태, 포커스와 숫자 표현을 확인합니다.
        </p>
      </header>

      <Surface aria-labelledby="showcase-actions-title">
        <h2 id="showcase-actions-title">버튼과 상태</h2>
        <div className="primitive-showcase__row">
          <Button>기록 저장</Button>
          <Button variant="secondary">검색 적용</Button>
          <Button variant="ghost">초기화</Button>
          <Button variant="danger">기록 삭제</Button>
          <Button isBusy busyLabel="저장 중">
            기록 저장
          </Button>
        </div>
        <div className="primitive-showcase__stack">
          <StatusMessage>현재가는 페이지를 열 때 새로 조회합니다.</StatusMessage>
          <StatusMessage tone="success">매수 기록이 저장되었습니다.</StatusMessage>
          <StatusMessage tone="warning">일부 종목의 현재가를 가져오지 못했습니다.</StatusMessage>
          <StatusMessage tone="error">저장하지 못했습니다. 입력값을 확인해 주세요.</StatusMessage>
        </div>
      </Surface>

      <Surface aria-labelledby="showcase-inputs-title">
        <h2 id="showcase-inputs-title">입력과 숫자</h2>
        <div className="primitive-showcase__fields">
          <Field htmlFor="showcase-stock" label="종목명" required>
            <input className="control" id="showcase-stock" value="삼성전자" readOnly />
          </Field>
          <Field htmlFor="showcase-price" hint="원 단위 양의 정수" label="당시 단가">
            <input className="control" id="showcase-price" value="72,100" readOnly />
          </Field>
          <Field error="수량은 1주 이상 입력해 주세요." htmlFor="showcase-error" label="수량">
            <input
              aria-describedby="showcase-error-error"
              aria-invalid="true"
              className="control"
              id="showcase-error"
              value="0"
              readOnly
            />
          </Field>
        </div>
        <dl className="primitive-showcase__numbers">
          <div>
            <dt>평가손익</dt>
            <dd className="money positive">+630,000원</dd>
          </div>
          <div>
            <dt>실현손익</dt>
            <dd className="money negative">-255,000원</dd>
          </div>
          <div>
            <dt>조회 실패</dt>
            <dd className="money">-</dd>
          </div>
        </dl>
      </Surface>
    </section>
  );
}
