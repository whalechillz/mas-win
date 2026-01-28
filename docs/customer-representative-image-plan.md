# 고객 대표 이미지 설정 기능 개발 계획 (수정)

## ⚠️ 중요: SQL 실행 방법

**Supabase SQL Editor에서 실행 시**:
- 마크다운 코드 블록(```sql)을 포함하지 마세요
- 순수 SQL만 복사하여 실행하세요
- 전체 SQL은 `database/add-customer-representative-image.sql` 파일 참조

## 현재 상황 분석

### 썸네일 기능 (Thumbnail)
- **위치**: 고객 관리 페이지 (`/admin/customers`)
- **용도**: 고객 목록 테이블에 표시되는 작은 이미지
- **DB 사용**: 
  - `image_assets` 테이블의 `is_customer_representative` 필드
  - `customers` 테이블에는 `thumbnailUrl` 필드 없음 (동적 조회)
- **현재 로직** (이미 구현됨):
  1. `is_customer_representative = true`인 이미지 우선 조회 ✅
  2. 없으면 최신 이미지 10개 중 첫 번째 사용 ✅
- **특징**: 고객 관리 페이지 전용 기능

### 대표 이미지 기능 (Representative) - 현재 작동 안 함
- **위치**: 고객 이미지 관리 모달 (`CustomerImageModal`)
- **용도**: 고객 목록 썸네일로 사용될 이미지 지정
- **DB 사용**: 
  - `image_assets` 테이블의 `is_customer_representative` 필드 (BOOLEAN)
  - 고객당 하나만 `true`로 설정 가능
- **API**: `/api/admin/set-customer-representative-image.ts` ✅ (존재함)
- **UI**: "🏠 썸네일" 배지 (파란색) ✅ (존재함)
- **핸들러**: `handleSetCustomerRepresentative`, `handleUnsetCustomerRepresentative` ✅ (존재함)
- **문제**: 현재 작동하지 않음 ❌

### 장면 대표 이미지 기능 (Scene Representative)
- **위치**: 고객 스토리 관리 모달 (`CustomerStoryModal`)
- **용도**: 각 장면(S1-S7)별 대표 이미지 지정 (스토리보드용)
- **DB 사용**: 
  - `image_assets` 테이블의 `is_scene_representative` 필드
- **UI**: "⭐ 대표" 배지 (노란색)
- **특징**: 스토리보드 전용 기능 (썸네일과 별개)

## 기능 관계 정리

### 같은 DB 사용 여부
- ✅ **같은 DB 사용**: `image_assets` 테이블
- ✅ **같은 목적**: 고객 목록 썸네일 표시
- ❌ **다른 용도**: 
  - 썸네일: 자동 선택 (최신 이미지)
  - 대표 이미지: 수동 선택 (사용자 지정)

### 권장 방안: 대표 이미지 기능만 사용 ⭐

**이유**:
1. 이미 구현되어 있음 (API, UI, 핸들러 모두 존재)
2. 썸네일과 대표 이미지가 같은 목적 (고객 목록 썸네일)
3. 사용자가 직접 선택할 수 있어 더 나은 UX
4. 썸네일 자동 선택은 fallback으로만 사용

## 개발 목표 (수정)

1. **대표 이미지 기능 수정 및 활성화** (우선순위: 높음)
2. **DB 스키마 확인 및 수정** (필요시)
3. **API 디버깅 및 에러 처리 개선**
4. **UI 피드백 개선** (배지 표시, 에러 메시지)

## 데이터베이스 설계

### 옵션 1: `image_assets` 테이블에 필드 추가 (권장)

**SQL 쿼리** (마크다운 코드 블록 없이 순수 SQL만 사용):
- `ALTER TABLE image_assets ADD COLUMN IF NOT EXISTS is_customer_representative BOOLEAN DEFAULT FALSE;`
- `CREATE INDEX IF NOT EXISTS idx_image_assets_is_customer_representative ON image_assets(is_customer_representative);`
- `COMMENT ON COLUMN image_assets.is_customer_representative IS '고객 목록 썸네일로 사용되는 대표 이미지';`

**전체 SQL은 `database/add-customer-representative-image.sql` 파일 참조**

**장점**:
- `image_assets` 테이블에 모든 이미지 정보가 있음
- 쿼리가 간단함
- 기존 구조와 일관성 유지

**단점**:
- 고객당 여러 이미지 중 하나만 `true`로 설정해야 함 (애플리케이션 로직 필요)

### 옵션 2: `customers` 테이블에 필드 추가

**SQL 쿼리** (참고용, 옵션 1 사용으로 미적용):
- `ALTER TABLE customers ADD COLUMN IF NOT EXISTS representative_image_id UUID REFERENCES image_assets(id) ON DELETE SET NULL;`
- `CREATE INDEX IF NOT EXISTS idx_customers_representative_image_id ON customers(representative_image_id);`
- `COMMENT ON COLUMN customers.representative_image_id IS '고객 목록 썸네일로 사용되는 대표 이미지 ID';`

**장점**:
- 고객당 하나의 대표 이미지만 보장 (DB 제약조건)
- 명확한 관계

**단점**:
- `customers` 테이블이 `image_assets`에 의존하게 됨
- 이미지 삭제 시 처리 필요

## 권장 방안: 옵션 1 (`image_assets` 테이블 확장)

### 이유
1. 이미지 중심의 데이터 구조
2. 기존 `is_scene_representative` 패턴과 일관성
3. 쿼리 단순화

## 구현 계획 (수정)

### Phase 1: DB 스키마 확인 및 수정 (우선순위: 높음)

**파일**: `database/add-customer-representative-image.sql`

**확인 사항**:
1. `image_assets` 테이블에 `is_customer_representative` 컬럼 존재 여부 확인
2. 인덱스 존재 여부 확인
3. RLS 정책 확인 (업데이트 권한)

**실행 방법**:
1. Supabase 대시보드 > SQL Editor 접속
2. 아래 SQL 쿼리를 복사하여 실행

**SQL 쿼리 내용**:
- `image_assets` 테이블에 `is_customer_representative` 필드 추가 (BOOLEAN, 기본값 FALSE)
- 대표 이미지 조회를 위한 인덱스 추가
- ai_tags 기반 부분 인덱스 추가 (성능 최적화)

**⚠️ 주의사항**: 
- 마크다운 코드 블록(```sql) 없이 순수 SQL만 복사하여 실행하세요.
- 파일 내용은 `database/add-customer-representative-image.sql`에 저장되어 있습니다.

### Phase 2: API 디버깅 및 수정 (우선순위: 높음)

**파일**: `pages/api/admin/set-customer-representative-image.ts`

**현재 상태**: ✅ 이미 구현되어 있음

**확인 및 수정 사항**:
1. **이미지 소유권 확인 로직 강화**:
   - `ai_tags`에 `customer-{id}` 태그 확인
   - `file_path`로도 확인 (이중 체크)
   - 에러 메시지 개선

2. **고객의 다른 대표 이미지 해제 로직 확인**:
   - `file_path` 기반 필터링이 정확한지 확인
   - `ai_tags` 기반 필터링 추가 고려

3. **상세한 로그 추가**:
   - 각 단계별 로그 추가
   - 에러 발생 시 상세 정보 로깅

4. **에러 핸들링 개선**:
   - 구체적인 에러 메시지 반환
   - 클라이언트에서 에러 표시 가능하도록

### Phase 3: 고객 목록 API 확인 (우선순위: 낮음)

**파일**: `pages/api/admin/customers/index.ts`

**현재 상태**: ✅ 이미 대표 이미지 우선 조회 로직 구현됨 (393-433번 줄)

**확인 사항**:
1. 쿼리가 정상 작동하는지 확인
2. 로그 추가로 디버깅 가능하도록
3. 대표 이미지 없을 때 fallback 로직 확인

**수정 내용** (필요시):
- 로그 추가
- 에러 처리 개선

### Phase 4: UI 개선 (우선순위: 중간)

**파일**: `pages/admin/customers/index.tsx`

**현재 상태**: ✅ UI 요소 모두 존재
- "🏠 썸네일" 배지 존재 (3332-3352번 줄)
- `handleSetCustomerRepresentative` 핸들러 존재 (2500번 줄)
- `handleUnsetCustomerRepresentative` 핸들러 존재 (2534번 줄)

**개선 내용**:
1. **배지 표시 개선**:
   - 현재: 호버 시만 표시 (`opacity-0 group-hover:opacity-100`)
   - 수정: 대표 이미지로 설정된 경우 항상 표시
   - 호버 시에만 표시하는 것은 "일반" 상태일 때만

2. **피드백 개선**:
   - 설정/해제 성공 시 토스트 메시지 표시
   - 에러 발생 시 명확한 에러 메시지 표시
   - 로딩 상태 표시

3. **배지 위치 조정**:
   - 장면 대표 이미지 배지와 겹치지 않도록 위치 조정 (이미 구현됨)

### Phase 5: 이벤트 처리 확인 (우선순위: 낮음)

**현재 상태**: ✅ 이미 구현되어 있음
- 대표 이미지 설정/해제 시 `customerImagesUpdated` 이벤트 발생 (2522번 줄)
- 고객 목록 자동 새로고침 (453-464번 줄)

**확인 사항**:
- 이벤트가 정상적으로 발생하는지
- 고객 목록이 자동으로 새로고침되는지

## UI/UX 설계

### 이미지 카드 레이아웃

```
┌─────────────────────┐
│                     │
│     이미지 썸네일    │
│                     │
│  [⭐ 대표] [🏠 썸네일] │  ← 배지 영역
│                     │
│   파일명.jpg         │
└─────────────────────┘
```

### 버튼 동작

1. **"🏠 썸네일" 배지가 없는 경우**:
   - 호버 시 "대표이미지로 설정" 버튼 표시
   - 클릭 시 대표 이미지로 설정

2. **"🏠 썸네일" 배지가 있는 경우**:
   - 배지 클릭 시 해제 확인 다이얼로그
   - 확인 시 대표 이미지 해제

### 상태 표시

- **대표 이미지**: "🏠 썸네일" 배지 표시 (파란색 배경)
- **장면 대표 이미지**: "⭐ 대표" 배지 표시 (기존)
- **둘 다**: 두 배지 모두 표시

## 마이그레이션 전략

### 기존 데이터 처리

1. **기존 썸네일 유지**: 마이그레이션 스크립트 불필요
2. **점진적 전환**: 사용자가 직접 대표 이미지를 설정할 때까지 기존 로직 사용
3. **자동 설정 옵션**: 필요 시 기존 썸네일을 자동으로 대표 이미지로 설정하는 스크립트 제공

## 테스트 계획

1. **대표 이미지 설정**: 이미지 선택 → 대표 이미지로 설정 → 고객 목록에서 확인
2. **대표 이미지 해제**: 대표 이미지 해제 → 고객 목록에서 썸네일 변경 확인
3. **대표 이미지 변경**: 다른 이미지를 대표 이미지로 설정 → 기존 대표 이미지 자동 해제 확인
4. **이미지 삭제**: 대표 이미지 삭제 → 고객 목록 썸네일 자동 업데이트 확인
5. **대표 이미지 없는 경우**: 대표 이미지가 없는 고객 → 최신 이미지로 썸네일 표시 확인

## 파일 목록

### 새로 생성할 파일
1. `database/add-customer-representative-image.sql` - DB 스키마
2. `pages/api/admin/set-customer-representative-image.ts` - API 엔드포인트
3. `scripts/migrate-existing-thumbnails-to-representative.js` - 기존 데이터 마이그레이션 (선택)

### 수정할 파일
1. `pages/api/admin/customers/index.ts` - 썸네일 조회 로직 수정
2. `pages/admin/customers/index.tsx` - UI 추가 및 핸들러 구현

## 예상 작업 시간

- 데이터베이스 스키마: 30분
- API 엔드포인트: 1시간
- 고객 목록 API 수정: 30분
- UI 구현: 2시간
- 테스트: 1시간
- **총 예상 시간: 5시간**

## 우선순위 및 작업 순서

### 즉시 작업 (우선순위: 높음)
1. **DB 스키마 확인 및 수정** (30분)
   - `is_customer_representative` 컬럼 존재 여부 확인
   - 없으면 추가
   - 인덱스 확인 및 추가

2. **API 디버깅 및 수정** (1-2시간)
   - 상세한 로그 추가
   - 에러 핸들링 개선
   - 이미지 소유권 확인 로직 강화

### 다음 작업 (우선순위: 중간)
3. **UI 개선** (1시간)
   - 배지 표시 개선
   - 피드백 메시지 추가
   - 에러 메시지 표시

### 확인 작업 (우선순위: 낮음)
4. **고객 목록 API 확인** (30분)
   - 대표 이미지 우선 조회 로직 확인
   - 로그 추가

5. **이벤트 처리 확인** (30분)
   - 이벤트 발생 확인
   - 자동 새로고침 확인

## 예상 작업 시간

- DB 스키마 확인/수정: 30분
- API 디버깅 및 수정: 1-2시간
- UI 개선: 1시간
- 테스트: 1시간
- **총 예상 시간: 3-4시간**

## 기능 사용 권장 사항

### 최종 권장: 대표 이미지 기능만 사용 ⭐

**이유**:
1. ✅ 이미 구현되어 있음 (API, UI, 핸들러 모두 존재)
2. ✅ 썸네일과 대표 이미지가 같은 목적 (고객 목록 썸네일)
3. ✅ 사용자가 직접 선택할 수 있어 더 나은 UX
4. ✅ 썸네일 자동 선택은 fallback으로만 사용 (이미 구현됨)

**작업 내용**:
- 썸네일 기능 제거 ❌ (불필요)
- 대표 이미지 기능 수정 및 활성화 ✅ (필요)
- 썸네일 자동 선택 로직은 fallback으로 유지 ✅ (이미 구현됨)

## 기능 비교표

| 기능 | 위치 | DB 필드 | 용도 | 상태 | 권장 |
|------|------|---------|------|------|------|
| **썸네일** | 고객 목록 | 없음 (동적 조회) | 고객 목록 표시 | ✅ 작동 중 | Fallback으로 유지 |
| **대표 이미지** | 이미지 관리 모달 | `is_customer_representative` | 고객 목록 썸네일 지정 | ❌ 작동 안 함 | ✅ **수정 및 활성화** |
| **장면 대표** | 스토리 관리 모달 | `is_scene_representative` | 장면별 대표 이미지 | ✅ 작동 중 | 유지 (별도 기능) |

## 결론

**최종 권장**: 대표 이미지 기능 수정 및 활성화

- 썸네일 기능은 제거하지 않고 fallback으로 유지
- 대표 이미지 기능을 메인으로 사용
- 사용자가 직접 선택할 수 있어 더 나은 UX 제공
