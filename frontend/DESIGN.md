# 주식 매매일지 디자인 시스템

## 0. Research log

- 제품 성격: 세 가족 구성원이 함께 쓰는 고밀도 재무 운영 화면이다. 장식보다 비교 속도, 숫자 정렬, 오류 회복을 우선한다.
- 임베디드 레퍼런스: Airtable, Wise, Linear를 비교했다. Airtable의 밝은 데이터 표면과 명확한 행 구분을 기본으로 삼고, Wise의 신뢰감 있는 녹색 신호와 Linear의 간결한 상태 피드백만 차용한다.
- UI-UX DB: 반응형 표-카드 전환, 300ms 자동완성, 항상 보이는 라벨, 제출 상태 피드백을 채택했다. 한국어 숫자 화면에는 Noto Sans KR 계열 시스템 폰트가 가장 안정적이었다.
- beui.dev: StatefulButton의 `aria-live`, `aria-busy`, 중복 제출 차단을 CSS 상태로 재구성한다. Table/Select 예제의 명시적 정렬 상태와 키보드 포커스를 채택하고 무거운 모션 의존성은 제외한다.
- Imagen: `design-references/statement-bands.png`를 포함한 세 시안을 만들었다. 상단 3탭, 소유주별 statement band, 단색에 가까운 표면을 가진 세 번째 시안을 선택했다.
- Lazyweb: 위임한 실서비스 화면 수집이 중단되어 이 lane은 사용하지 못했다. 대신 임베디드 브랜드 레퍼런스, UI-UX DB, beui.dev, 세 개의 생성 시안을 교차 검토했다.

## 1. Direction and signature

- 방향: `Family statement bands`. 가족별 원장을 종이 명세서처럼 연속 배치한다.
- 시그니처: 병민, 할머니, 아빠 섹션의 왼쪽 owner rail과 같은 위치의 독립 정렬 컨트롤이다.
- 정보 계층: 페이지 제목 -> 전체 요약 -> 소유주 band -> 종목 행 -> 보조 코드/갱신 상태 순서다.
- 밀도 다이얼: visual variance 4/10, motion 3/10, density 8/10.

## 2. Tokens

모든 제품 화면은 `src/app/globals.css`의 토큰만 사용한다.

- 색상: canvas, surface, surface-muted, text, text-muted, line, brand, positive, negative, warning.
- 소유주 색: owner-byeongmin, owner-grandmother, owner-father. 색은 구분 보조 수단이며 이름을 항상 함께 쓴다.
- 간격: 4, 8, 12, 16, 24, 32, 48px.
- 반경: control 8px, panel 12px. 과도한 pill은 상태 표시 외에 쓰지 않는다.
- 그림자: 기본 패널은 경계선만 사용하고, 자동완성 팝오버와 sticky header에만 낮은 그림자를 쓴다.

## 3. Typography

- 본문: `Noto Sans KR`, `Apple SD Gothic Neo`, `Malgun Gothic`, sans-serif 시스템 폴백.
- 숫자: 같은 서체의 `font-variant-numeric: tabular-nums`.
- 페이지 제목 32/40, 섹션 제목 22/30, 본문 15/24, 보조 13/20.
- 영문 전용 장식 폰트나 원격 폰트 다운로드는 사용하지 않는다.

## 4. Layout and responsive rules

- 최대 본문 폭 1440px, wide 좌우 32px, medium 24px, compact 16px.
- `wide >= 1120px`: 실제 table. `compact < 1120px`: 모든 필드를 보존한 `article + dl` 카드.
- 768px에서 카드는 2열, 375px에서 1열이다. 문서가 유일한 세로 스크롤 소유자다.
- 상단 내비게이션은 sticky다. 375px에서도 세 탭을 유지하고 44px 터치 영역과 줄바꿈 없는 짧은 이름을 쓴다.
- 자동완성 목록만 최대 40dvh 내부 스크롤을 가진다. 페이지 전체 가로 스크롤은 허용하지 않는다.

## 5. Components and states

- AppHeader: 제품명, 세 페이지 링크, 현재 위치 `aria-current`.
- SummaryStrip: 보유 종목 수, 전체 매입액, 전체 평가액, 평가손익, 가격 갱신 시각.
- OwnerSection: owner rail, 독립 sort field/direction, table/card, empty state.
- TradeEntryForm: 지속 라벨, datetime, StockCombobox, owner, quantity, price, 계산 금액, 저장 상태.
- HistoryFilters: 날짜 범위, 종목명/코드, owner, 모든 숫자 필드 최소/최대, 적용/초기화.
- 상태: pristine, invalid, submitting, success, error를 텍스트와 ARIA로 전달한다. 가격 실패는 0원이 아닌 `-`와 이유로 표시한다.
- 데이터가 전혀 없을 때도 세 owner section을 유지하고 첫 매수 CTA를 제공한다.

## 6. Interaction and motion

- 자동완성은 300ms debounce, stale request 취소, ArrowUp/ArrowDown/Enter/Escape, IME composition 보호를 지원한다.
- 저장 버튼은 busy 동안 비활성화하고 텍스트를 바꾸며 완료 상태를 `aria-live`로 전달한다.
- hover/focus/press는 120-180ms 색·변위 전환만 사용한다. 스크롤 연출, 장식적 spring, 지속 애니메이션은 없다.
- `prefers-reduced-motion: reduce`에서는 모든 전환을 즉시 처리한다.

## 7. Accessibility

- `<html lang="ko">`, skip link, landmark, heading hierarchy, 실제 table caption/th, 카드의 dl/dt/dd를 사용한다.
- 모든 입력은 보이는 label과 오류 연결을 가진다. focus ring은 3:1 이상, 주요 터치 대상은 44px 이상이다.
- 이익/손실은 부호와 한국어 텍스트를 함께 제공해 색에만 의존하지 않는다.
- 라이트/다크 자동 테마 모두 일반 텍스트 4.5:1을 목표로 한다.
- 저장·검색·정렬 결과는 polite live region, 치명 오류는 alert로 알린다.

## 8. Constraints and debt

- 네이버 모바일 front API는 공식 공개 계약이 아니므로 서버 프록시에서 Zod로 응답을 검증하고 부분 실패를 허용한다.
- 현재 손익은 수수료, 거래세, 배당을 제외한 gross 값이다.
- 사용자가 요청한 lifetime 매수평균을 사용하므로 미래 매수가 과거 매도 손익 표시를 바꿀 수 있다.
- 인증 요구가 없어 로컬/신뢰 네트워크용으로 제한한다. 공개 배포 전 인증과 CSRF/접근 통제가 필요하다.
- PostgreSQL init SQL은 빈 public schema가 아니라 새 PGDATA volume을 최초 생성할 때 한 번 실행된다.
