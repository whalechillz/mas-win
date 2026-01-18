# 고객 관리 시스템 개선 방향

## 📋 개요

고객 관리 시스템의 두 가지 주요 개선 사항:
1. **전화번호 없는 고객 관리** (블로거 체험단 등)
2. **판매대리점 등 업계 관련자 관리**

---

## 1️⃣ 전화번호 없는 고객 관리

### ❌ 현재 문제점
- `customers` 테이블의 `phone` 컬럼이 `UNIQUE NOT NULL`로 설정되어 있음
- 전화번호가 없는 고객(블로거 체험단, 임시 고객 등)을 등록할 수 없음
- 무기명1, 무기명2 같은 임시 전화번호는 데이터 무결성을 해침

### ✅ 해결 방안

#### 1.1 데이터베이스 스키마 변경

```sql
-- customers 테이블 스키마 개선
ALTER TABLE customers 
  -- 전화번호를 nullable로 변경 (UNIQUE는 유지하되 NULL 허용)
  ALTER COLUMN phone DROP NOT NULL,
  -- 고객 타입 필드 추가
  ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'regular',
  -- 고객 카테고리 필드 추가 (더 세분화된 분류)
  ADD COLUMN IF NOT EXISTS customer_category VARCHAR(50),
  -- 메모 필드 추가 (블로거 체험단 등 특수 케이스 메모)
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_category ON customers(customer_category);

-- UNIQUE 제약조건 수정 (NULL 값은 중복 허용)
-- PostgreSQL의 경우 NULL은 UNIQUE 제약에서 제외되므로 별도 처리 불필요
-- 단, phone이 NULL이 아닌 경우에만 UNIQUE 체크 필요
```

**고객 타입 (`customer_type`) 값:**
- `regular`: 일반 고객 (기본값)
- `blogger`: 블로거 체험단
- `temporary`: 임시 고객 (전화번호 없음)
- `partner`: 파트너/협력사
- `dealer`: 판매대리점

**고객 카테고리 (`customer_category`) 값:**
- `blogger-review`: 블로거 리뷰
- `blogger-experience`: 블로거 체험단
- `influencer`: 인플루언서
- `media`: 미디어 관계자
- `dealer-seoul`: 서울 판매대리점
- `dealer-busan`: 부산 판매대리점
- 등등...

#### 1.2 UI 개선

**고객 등록/수정 폼:**
```tsx
// 고객 타입 선택 추가
<select 
  value={customerType} 
  onChange={(e) => setCustomerType(e.target.value)}
>
  <option value="regular">일반 고객</option>
  <option value="blogger">블로거 체험단</option>
  <option value="temporary">임시 고객</option>
  <option value="partner">파트너/협력사</option>
  <option value="dealer">판매대리점</option>
</select>

// 전화번호 입력 (선택사항으로 변경)
<input 
  type="tel"
  placeholder="전화번호 (선택사항)"
  value={phone}
  onChange={(e) => setPhone(e.target.value)}
/>

// 카테고리 선택 (타입에 따라 동적 표시)
{customerType === 'blogger' && (
  <select value={category} onChange={(e) => setCategory(e.target.value)}>
    <option value="blogger-review">블로거 리뷰</option>
    <option value="blogger-experience">블로거 체험단</option>
    <option value="influencer">인플루언서</option>
  </select>
)}

// 메모 필드
<textarea 
  placeholder="특이사항 메모 (예: 체험단 진행 중, 리뷰 예정 등)"
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
/>
```

**고객 목록 테이블:**
- 전화번호 컬럼에 "없음" 표시 또는 배지 표시
- 고객 타입 배지 추가 (블로거, 임시 고객 등)
- 필터링 기능: 고객 타입별 필터 추가

#### 1.3 이미지/스토리 관리

**현재 구현 상태:**
- ✅ `CustomerImageModal`: 이미지 업로드 및 관리 기능 완료
- ✅ `CustomerStoryModal`: 스토리보드 관리 기능 완료
- ✅ `image_metadata` 테이블에 고객 이미지 메타데이터 저장

**추가 개선 사항:**
- 전화번호 없는 고객도 이미지/스토리 관리 가능 (이미 구현됨)
- 고객 폴더명 생성 시 전화번호 대신 고객 ID 사용
- 이미지 업로드 시 고객 타입에 따른 자동 태깅

---

## 2️⃣ 판매대리점 등 업계 관련자 관리

### ✅ 권장 방안: 고객 관리 내 탭 분리

**이유:**
1. **데이터 구조 통일**: 판매대리점도 고객과 유사한 정보 구조 (이름, 연락처, 주소 등)
2. **코드 재사용**: 기존 고객 관리 기능 재활용 가능
3. **통합 검색**: 한 곳에서 모든 관계자 검색 가능
4. **관리 효율성**: 별도 메뉴보다 탭으로 분리하는 것이 더 직관적

### 구현 방안

#### 2.1 UI 구조

```tsx
// pages/admin/customers/index.tsx
const [activeTab, setActiveTab] = useState<'customers' | 'partners' | 'dealers'>('customers');

<div className="border-b">
  <nav className="flex space-x-4">
    <button
      onClick={() => setActiveTab('customers')}
      className={activeTab === 'customers' ? 'border-b-2 border-blue-500' : ''}
    >
      일반 고객
    </button>
    <button
      onClick={() => setActiveTab('partners')}
      className={activeTab === 'partners' ? 'border-b-2 border-blue-500' : ''}
    >
      파트너/협력사
    </button>
    <button
      onClick={() => setActiveTab('dealers')}
      className={activeTab === 'dealers' ? 'border-b-2 border-blue-500' : ''}
    >
      판매대리점
    </button>
  </nav>
</div>

{activeTab === 'customers' && <CustomerList customerType="regular" />}
{activeTab === 'partners' && <CustomerList customerType="partner" />}
{activeTab === 'dealers' && <CustomerList customerType="dealer" />}
```

#### 2.2 데이터베이스 스키마 확장

```sql
-- 판매대리점/파트너 전용 필드 추가
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(200),      -- 회사명/업체명
  ADD COLUMN IF NOT EXISTS business_number VARCHAR(50),     -- 사업자등록번호
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(100),    -- 담당자명
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),     -- 담당자 이메일
  ADD COLUMN IF NOT EXISTS region VARCHAR(50),              -- 지역 (서울, 부산 등)
  ADD COLUMN IF NOT EXISTS dealer_type VARCHAR(50),        -- 대리점 유형
  ADD COLUMN IF NOT EXISTS contract_start_date DATE,        -- 계약 시작일
  ADD COLUMN IF NOT EXISTS contract_end_date DATE,          -- 계약 종료일
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'; -- active, inactive, suspended

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_region ON customers(region);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
```

#### 2.3 판매대리점 전용 필드 UI

```tsx
// 판매대리점/파트너 등록 폼
{customerType === 'dealer' && (
  <>
    <input 
      type="text" 
      placeholder="업체명/회사명" 
      value={companyName}
      onChange={(e) => setCompanyName(e.target.value)}
    />
    <input 
      type="text" 
      placeholder="사업자등록번호" 
      value={businessNumber}
      onChange={(e) => setBusinessNumber(e.target.value)}
    />
    <input 
      type="text" 
      placeholder="담당자명" 
      value={contactPerson}
      onChange={(e) => setContactPerson(e.target.value)}
    />
    <select value={region} onChange={(e) => setRegion(e.target.value)}>
      <option value="">지역 선택</option>
      <option value="seoul">서울</option>
      <option value="busan">부산</option>
      <option value="daegu">대구</option>
      {/* ... */}
    </select>
    <input 
      type="date" 
      placeholder="계약 시작일" 
      value={contractStartDate}
      onChange={(e) => setContractStartDate(e.target.value)}
    />
  </>
)}
```

---

## 3️⃣ 개발 단계별 계획

### Phase 1: 데이터베이스 스키마 변경 (우선순위: 높음)
- [ ] `phone` 컬럼을 nullable로 변경
- [ ] `customer_type` 필드 추가
- [ ] `customer_category` 필드 추가
- [ ] 판매대리점 전용 필드 추가
- [ ] 인덱스 생성
- [ ] 기존 데이터 마이그레이션 (전화번호 없는 고객 식별)

### Phase 2: 고객 등록/수정 폼 개선 (우선순위: 높음)
- [ ] 고객 타입 선택 UI 추가
- [ ] 전화번호를 선택사항으로 변경
- [ ] 카테고리 선택 UI 추가 (타입별 동적 표시)
- [ ] 메모 필드 추가
- [ ] 판매대리점 전용 필드 UI 추가
- [ ] 유효성 검사 로직 수정 (전화번호 없어도 등록 가능)

### Phase 3: 고객 목록 UI 개선 (우선순위: 중간)
- [ ] 탭 분리 (일반 고객 / 파트너 / 판매대리점)
- [ ] 고객 타입 배지 표시
- [ ] 전화번호 없음 표시 개선
- [ ] 고객 타입별 필터 추가
- [ ] 판매대리점 전용 컬럼 표시 (업체명, 지역 등)

### Phase 4: API 개선 (우선순위: 중간)
- [ ] 고객 등록 API 수정 (전화번호 nullable 처리)
- [ ] 고객 조회 API에 타입 필터 추가
- [ ] 판매대리점 전용 필드 저장/조회 로직 추가
- [ ] 검색 기능 개선 (업체명, 담당자명 검색)

### Phase 5: 이미지/스토리 관리 개선 (우선순위: 낮음)
- [ ] 전화번호 없는 고객 이미지 폴더명 생성 로직 개선
- [ ] 고객 타입별 이미지 태깅 자동화
- [ ] 스토리 관리 UI 개선 (타입별 필터)

---

## 4️⃣ 주요 고려사항

### 4.1 전화번호 UNIQUE 제약조건
- PostgreSQL/Supabase에서는 NULL 값은 UNIQUE 제약에서 제외됨
- 따라서 `phone`을 nullable로 변경해도 NULL 값은 중복 가능
- NULL이 아닌 전화번호는 여전히 UNIQUE 제약 적용

### 4.2 기존 데이터 마이그레이션
- 전화번호가 "무기명1", "무기명2" 같은 임시 값인 경우
- `customer_type`을 `temporary` 또는 `blogger`로 설정
- `phone`을 NULL로 변경
- `notes` 필드에 원본 정보 기록

### 4.3 검색 기능
- 전화번호 없는 고객도 이름, 주소, 메모로 검색 가능
- 판매대리점은 업체명, 담당자명으로 검색
- 통합 검색 시 타입별로 구분 표시

### 4.4 권한 관리
- 판매대리점 정보는 민감 정보일 수 있음
- 관리자만 접근 가능하도록 권한 체크
- 일반 에디터는 일반 고객만 조회 가능하도록 설정

---

## 5️⃣ 대안: 별도 메뉴 구성

만약 탭 분리가 아닌 별도 메뉴를 원한다면:

### 구조
```
/admin
  /customers          # 일반 고객 관리
  /partners           # 파트너/협력사 관리
  /dealers            # 판매대리점 관리
```

### 장점
- 각 메뉴가 독립적으로 관리됨
- 권한 분리 용이
- 각 메뉴별 커스터마이징 가능

### 단점
- 코드 중복 가능성
- 통합 검색 어려움
- 개발/유지보수 비용 증가

**권장사항**: 초기에는 탭 분리로 시작하고, 필요시 별도 메뉴로 분리

---

## 6️⃣ 구현 우선순위

1. **즉시 구현 필요**: Phase 1 (데이터베이스 스키마 변경)
2. **단기 (1주일 내)**: Phase 2 (고객 등록/수정 폼 개선)
3. **중기 (2주일 내)**: Phase 3 (고객 목록 UI 개선)
4. **장기 (1개월 내)**: Phase 4, 5 (API 개선, 이미지 관리 개선)

---

## 7️⃣ 참고 파일

- `/pages/admin/customers/index.tsx`: 고객 관리 메인 페이지
- `/components/admin/CustomerImageModal.tsx`: 이미지 관리 모달
- `/components/admin/CustomerStoryModal.tsx`: 스토리 관리 모달
- `/pages/api/admin/customers/index.ts`: 고객 관리 API
- `/pages/api/admin/upload-customer-image.js`: 이미지 업로드 API
