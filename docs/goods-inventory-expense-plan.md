# 굿즈 / 사은품, 재고, 비용, 공급업체 통합 관리 계획

## 1. 목표

- **상품/굿즈/사은품을 “상품 마스터(products)”로 일원화**해서 관리
- 설문 / 고객 / 사은품 지급을 한 줄로 연결해 **고객별 선물 히스토리** 추적
- 향후 **재고, 원가, 지출(접대비/비품/고정비)** 까지 한 대시보드에서 볼 수 있도록 기반 설계

---

## 2. 핵심 테이블 개요

### 2.1 products (상품 마스터)

- 역할: 굿즈, 사은품, 일반 판매 상품, 부품까지 모두 하나의 테이블에서 관리
- 주요 컬럼
  - `id` (PK)
  - `name` (예: `MASSGOO 고반발 골프공 6구`, `MASSGOO × MUZIIK 프리미엄 클러치백(베이지)`)
  - `sku` (내부 코드, 예: `BALL6`, `MZ_CAP_BLACK`, `MZ_CLUTCH_BEIGE`)
  - `category` (`ball`, `cap`, `hat`, `weight_pack`, `clutch`, `accessory`, `component` 등)
  - `color` (예: `블랙`, `네이비`, `베이지`, `그레이`)
  - `size` (예: `L`, `FREE`, `-`)
  - `legacy_name` (기존 설문/기록에서 쓰던 이름 메모)
  - `is_gift` (BOOLEAN) — 사은품/굿즈로 사용하는지
  - `is_sellable` (BOOLEAN) — 실제 판매용 상품인지
  - `is_active` (BOOLEAN) — 사용 중/단종 여부
  - `normal_price` (INT) — 정상가
  - `sale_price` (INT, NULL 가능) — 할인가

> 색상/사이즈까지 재고/비용을 따로 보고 싶으면 **옵션별로 각각 1개 상품**으로 등록하는 것을 원칙으로 함  
> 예: `MZ_CLUTCH_BEIGE`, `MZ_CLUTCH_GRAY` 두 개.

### 2.2 customer_gifts (고객 선물 기록)

- 역할: 고객에게 어떤 선물을 언제, 어떤 방식으로 줬는지 기록
- 컬럼
  - `id` (PK)
  - `customer_id` (bigint, FK → `customers.id`)
  - `survey_id` (uuid, FK → `surveys.id`) — 설문과 연결
  - `product_id` (bigint, FK → `products.id`) — 선택한 굿즈
  - `gift_text` (TEXT, NULL 가능) — 원래 제품명/색/사이즈/특이사항 메모
  - `quantity` (INT, 기본 1)
  - `delivery_type` (`in_person`, `courier`, `etc`)
  - `delivery_status` (`pending`, `sent`, `canceled`)
  - `delivery_date` (DATE, NULL 가능)
  - `note` (TEXT, NULL 가능)
  - `created_at`, `updated_at`
- 인덱스
  - `customer_id`, `product_id`

### 2.3 suppliers (공급업체)

- 역할: 굿즈/부품/소모품/접대비 관련 업체 관리
- 컬럼 (예시)
  - `id`
  - `name` (예: `마플`, `은성인쇄`, `GSI coffee`, `TDG사업자몰`, `원투스포츠`, `쿠팡`, `로젠택배`, `KT`, `SKT`, `LGU+`)
  - `category` (`goods_maker`, `printing`, `online_mall`, `coffee`, `courier`, `utility`, 등)
  - `contact_info` (전화번호, 카카오채널, URL)
  - `default_order_method` (`online_mall`, `kakao`, `phone`, `email` 등)
  - `memo` (재주문 방법, 담당자 이름 등)

### 2.4 inventory_transactions (재고 입출고 이력)

- 역할: 입고/출고/반품/조정 이력 기록, 현재 재고는 집계로 계산
- 컬럼
  - `id`
  - `product_id` (FK → `products.id`)
  - `location` (예: `main_room`, `warehouse`, `rack-A3`, `쇼룸 선반2`)
  - `tx_type` (`inbound`, `outbound`, `return`, `adjustment`)
  - `tx_date`
  - `quantity` (입출고 수량, 입고는 +, 출고는 -)
  - `unit_cost` (단가 — 사은품이라도 원가 기록)
  - `supplier_id` (FK → `suppliers.id`, 없으면 NULL)
  - `related_customer_id` / `related_gift_id` (사은품 출고와 연결)
  - `note`

> “입고일, 입고수량, 출고일, 반품일, 상태(신상품/중고), 보관위치” 등의 정보를  
> 한 레코드가 아니라 **여러 트랜잭션의 조합**으로 관리.

### 2.5 expense_categories / expenses (지출 관리)

- `expense_categories`
  - 예: `rent`, `utility`, `telecom`, `office_supply`, `hospitality`, `shipping`, `marketing` 등
- `expenses`
  - `id`
  - `date` (지불일)
  - `category_id` (FK)
  - `supplier_id` (예: 임대인, GSI커피, 쿠팡, 로젠, KT 등)
  - `amount`
  - `description` (예: “GSI 원두 2kg”, “로젠택배비 20건”, “8월 전기요금”)
  - `payment_method` (`card`, `transfer`, `cash` 등)
  - `memo`

> 이를 통해 **월임대료, 전기값, 인터넷/전화, 핸드폰비, 접대비, 택배비** 등  
> 월별 지출 대시보드를 만들 수 있음.

### 2.6 product_bom (완제품 ↔ 부품 구성표, BOM)

- 역할: 완제품 1개를 구성하는 부품들을 정의
- 예: `MASSGOO 고반발 골프공(12구)`  = `3구박스 4개 + 12구박스 1개 + 공12개 + 스펙스티커`
- 컬럼
  - `id`
  - `parent_product_id` (완제품)
  - `component_product_id` (부품/자재)
  - `quantity` (완제품 1개당 필요한 수량)

> 드라이버 완제품 = 헤드(시리얼), 샤프트(시리얼), 그립, 헤드커버, 페럴 등도  
> 장기적으로는 BOM으로 표현할 수 있음 (단, 현재는 별도 시스템 + 엑셀 유지 계획).

---

## 3. 설문 ↔ 고객 ↔ 선물 히스토리 연동

### 3.1 동작 시나리오

1. 고객이 설문을 작성하면 `surveys` 에 저장.
2. 관리자가 `/admin/surveys` 에서 설문을 수정하면서 **사은품 상품**을 선택:
   - `gift_product_id` + `gift_text` 입력.
3. 수정 모달 내 버튼: **“🎁 고객 선물 기록으로 저장”**
   - 설문에 적힌 전화번호로 `customers` 에서 고객 검색.
   - 없으면 **신규 고객 생성** (이름/전화/주소 기준).
   - `customer_gifts` 에 `{ customer_id, survey_id, product_id, gift_text, ... }` 레코드 생성.
4. `/admin/customers` 의 `🎁 선물` 모달에서 해당 기록을 한눈에 확인.

### 3.2 구현 포인트

- `/admin/surveys/index.tsx`
  - 수정 모달의 “사은품 / 굿즈 정보” 아래에 버튼 추가:
    - `onClick` → `/api/admin/customers` GET 으로 전화번호 검색 (`q=010...`).
    - 결과가 없으면 `/api/admin/customers` POST 로 고객 생성.
    - 이후 `/api/admin/customer-gifts` POST 호출.
- `/admin/customers/index.tsx`
  - 각 고객 행에 `🎁 선물` 버튼 → `CustomerGiftsModal`
  - 상단: 선물 지급 이력 테이블
  - 하단: 새로운 선물 지급 기록 추가 폼

---

## 4. 굿즈 / 사은품 관리: 복제 + 재고

### 4.1 상품 복제(클론)

- 사용 예:
  - `MASSGOO × MUZIIK 프리미엄 클러치백(베이지)` → 복제 → `... (그레이)` 로 수정.
- UI 설계:
  - `/admin/products` 액션 컬럼에 **`복제` 버튼** 추가.
  - 클릭 시:
    - 기존 상품 데이터를 폼에 채워 넣고
    - `name` 을 `"(복제)"` 혹은 색상/사이즈만 수정
    - `sku` 는 비운 상태로 모달 오픈 → 새 SKU/색상/사이즈 입력 후 저장.

### 4.2 재고 관리 1단계

- 목표: “현재 몇 개 있는지 / 어디에 있는지 / 언제 들어오고 나갔는지” 정도를 관리.
- 구현 흐름:
  - 입고 시:
    - `/admin/products` 상세에서 “입고 등록” 버튼 → `inventory_transactions` 에 `tx_type='inbound'`.
  - 출고 시:
    - 선물 지급과 연동: `customer_gifts` 저장과 동시에 `inventory_transactions` 에 `tx_type='outbound'` 추가 (선물 개수만큼).
  - 현재 재고:
    - `SELECT SUM(quantity) FROM inventory_transactions WHERE product_id=... GROUP BY location`
  - UI:
    - `/admin/products` 에 “재고 요약” 열 또는 상세 패널:
      - 예: `현재 재고: 12 (메인룸 10 / 창고 2)`

---

## 5. 공급업체 / 주문 관리

### 5.1 예시 매핑

- 마플 → 티셔츠/모자/굿즈
- 은성인쇄 → 박스/스티커 등 인쇄물
- 고스타 → 골프공, 헤드커버
- NGS / MUZIIK / ETIMO → 샤프트
- 원투스포츠 → STM 그립
- TDG사업자몰 → 그립테이프, 접착제, 솔벤트
- 쿠팡 → 에비앙, 화장지, 오설록티, 헛개차, 소분용 공병, 수세미 등
- GSI coffee → 원두
- 로젠택배 → 택배비
- 각 통신사, 전기, 임대인 등.

### 5.2 구조

- `suppliers` 에 업체 기본 정보 + 재주문 경로 저장.
- `inventory_transactions.supplier_id` 로 **입고 이력 ↔ 공급업체**를 연결.
- `expenses.supplier_id` 로 **비용 지출 ↔ 공급업체**를 연결.

---

## 6. 월별 지출 / 재고 / 비품 대시보드

### 6.1 월별 지출 ✅ (완료)

- 쿼리 예시
  - `SELECT date_trunc('month', date) AS month, category_id, SUM(amount) ...`
- 화면:
  - `/admin/finance/expenses`
    - ✅ 상단: 월별 합계 그래프 (라인 차트), 카테고리별 막대 그래프, 공급업체별 파이 차트
    - ✅ 하단: 해당 월 상세 리스트 (필터: 카테고리/공급업체)
- 구현:
  - `GET /api/admin/expenses/stats` - 월별/카테고리별/공급업체별 집계 API
  - recharts 라이브러리를 사용한 차트 시각화

### 6.2 재고/비품 현황 ✅ (완료)

- 굿즈/사은품/소모품:
  - ✅ `/admin/inventory/dashboard` - 재고 토탈 대시보드 페이지 생성
  - ✅ 전체 재고 현황 (총 상품 수, 총 재고 수량, 총 재고 가치)
  - ✅ 카테고리별 재고 현황 (상품 수, 수량, 가치)
  - ✅ 재고 부족 알림 (재고 0 이하 상품 목록)
  - ✅ 최근 입고/출고 이력 요약 (최근 20건)
- 접대비품:
  - 커피원두/생수/종이컵/티/헛개차 등은 `products` + `inventory_transactions` + `expenses` 를 같이 보면서  
    소비량과 비용을 한눈에 확인.
- 구현:
  - `GET /api/admin/inventory/dashboard` - 재고 통계 API
  - AdminNav에 "📦 재고 대시보드" 메뉴 추가

---

## 7. 단계별 구현 로드맵

### Phase 1 (완료에 가까움)

- `products`, `customer_gifts` 테이블 및 API
- `/admin/products` 굿즈/사은품 관리 UI
- `/admin/customers` 의 `🎁 선물` 모달 (고객별 선물 히스토리)

### Phase 2 (굿즈 관리 고도화)

- `/admin/products` 기능 확장
  - 검색/필터
    - 이름/sku/기존명 검색 (`q`)
    - 카테고리 필터 (`category`)
    - 사은품만 (`isGift=true`)
    - 판매 가능만/판매용 아님만 (`isSellable=true/false`)
    - 활성/비활성 (`isActive=true/false`) + `includeInactive`
  - 정렬
    - `sortBy` + `sortOrder` (`name`, `sku`, `category`, `normal_price`, `sale_price`)
    - 테이블 헤더 클릭 시 ▲/▼ 토글
  - 일괄 작업
    - 행 선택 체크박스 + 상단 “선택 N개 일괄 작업” 바
    - `POST /api/admin/products/bulk-update` 로 **정상가/할인가 일괄 수정**
- API
  - `GET /api/admin/products`
    - 위 파라미터들을 지원하도록 확장
  - `POST /api/admin/products/bulk-update`
    - `ids: number[]`, `update: { normal_price?, sale_price? }`

### Phase 3

- 설문 편집 모달에서 “고객 선물 기록으로 저장” 버튼
- `customer_gifts` 와 `surveys` 자동 연결

### Phase 4

- `suppliers`, `inventory_transactions` 기본 구현
- 굿즈/사은품/소모품 입고/출고 기록 및 현재 재고 표시

### Phase 5

- `expenses` + 월별 지출 대시보드
- 접대비/고정비/택배비/소모품 지출 통합 관리

### Phase 6 이후

- `product_bom` 을 활용한 부품/BOM 관리
- 드라이버 완제품/부품(시리얼 포함) 시스템과 점진적으로 통합
- 고급 재고 시뮬레이션 (완제품 출고 시 부품 자동 차감 등)


