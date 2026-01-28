# 고객 썸네일 및 대표 이미지 기능 분석 및 개선 계획

## 현재 상황 분석

### 1. 썸네일 기능 (Thumbnail)
- **위치**: 고객 관리 페이지 (`/admin/customers`)
- **용도**: 고객 목록 테이블에 표시되는 작은 이미지
- **DB 사용**: 
  - `image_assets` 테이블의 `is_customer_representative` 필드
  - `customers` 테이블에는 `thumbnailUrl` 필드 없음 (동적 조회)
- **현재 로직**:
  1. `is_customer_representative = true`인 이미지 우선 조회
  2. 없으면 최신 이미지 10개 중 첫 번째 사용
- **특징**: 고객 관리 페이지 전용 기능

### 2. 대표 이미지 기능 (Representative)
- **위치**: 고객 이미지 관리 모달 (`CustomerImageModal`)
- **용도**: 고객 목록 썸네일로 사용될 이미지 지정
- **DB 사용**: 
  - `image_assets` 테이블의 `is_customer_representative` 필드 (BOOLEAN)
  - 고객당 하나만 `true`로 설정 가능
- **API**: `/api/admin/set-customer-representative-image.ts` (존재함)
- **UI**: "🏠 썸네일" 배지 (파란색)
- **문제**: 현재 작동하지 않음

### 3. 장면 대표 이미지 기능 (Scene Representative)
- **위치**: 고객 스토리 관리 모달 (`CustomerStoryModal`)
- **용도**: 각 장면(S1-S7)별 대표 이미지 지정 (스토리보드용)
- **DB 사용**: 
  - `image_assets` 테이블의 `is_scene_representative` 필드 (존재 여부 확인 필요)
  - 또는 다른 테이블 사용 가능성
- **UI**: "⭐ 대표" 배지 (노란색)
- **특징**: 스토리보드 전용 기능

## 문제점 분석

### 대표 기능이 작동하지 않는 이유 (추정)
1. **DB 스키마 문제**: `is_customer_representative` 컬럼이 실제로 존재하지 않을 수 있음
2. **API 호출 오류**: 프론트엔드에서 API 호출 시 에러 발생 가능
3. **권한 문제**: Supabase RLS 정책으로 인한 업데이트 실패 가능
4. **데이터 불일치**: `ai_tags`에 `customer-{id}` 태그가 없어 소유권 확인 실패 가능

## 기능 통합 방안

### 옵션 1: 대표 이미지 기능만 사용 (권장) ⭐
**이유**:
- 이미 구현되어 있음 (API, UI 모두 존재)
- DB 스키마도 이미 설계됨 (`is_customer_representative`)
- 썸네일과 대표 이미지가 같은 목적 (고객 목록 썸네일)
- 중복 기능 제거로 코드 단순화

**작업 내용**:
1. DB 스키마 확인 및 수정 (필요시)
2. 대표 이미지 API 디버깅 및 수정
3. 썸네일 조회 로직은 이미 대표 이미지 우선 사용하도록 구현됨 (수정 불필요)
4. UI에서 "썸네일" 배지 명확히 표시

**장점**:
- 기존 코드 재사용
- 기능 명확성 (대표 이미지 = 썸네일)
- 유지보수 용이

**단점**:
- 없음

### 옵션 2: 썸네일과 대표 이미지 분리
**이유**:
- 썸네일: 자동 선택 (최신 이미지)
- 대표 이미지: 수동 선택 (사용자 지정)

**작업 내용**:
1. 썸네일 기능 유지 (최신 이미지 자동 선택)
2. 대표 이미지 기능 수정 (수동 선택)
3. 두 기능 독립적으로 운영

**장점**:
- 자동/수동 선택 옵션 제공

**단점**:
- 기능 중복
- 사용자 혼란 가능성
- 코드 복잡도 증가

### 옵션 3: 썸네일 기능 제거, 대표 이미지만 사용
**이유**:
- 대표 이미지가 썸네일의 상위 개념
- 사용자가 직접 선택하는 것이 더 나은 UX

**작업 내용**:
1. 썸네일 자동 선택 로직 제거
2. 대표 이미지가 없으면 최신 이미지 사용 (fallback)
3. 대표 이미지 기능만 유지

**장점**:
- 기능 단순화
- 사용자 제어권 강화

**단점**:
- 기존 썸네일 로직 제거 필요

## 권장 방안: 옵션 1 (대표 이미지 기능만 사용)

### 이유
1. **이미 구현됨**: API와 UI가 모두 존재
2. **명확한 목적**: 대표 이미지 = 고객 목록 썸네일
3. **코드 재사용**: 기존 구현 활용
4. **사용자 제어**: 사용자가 직접 선택 가능

### 구현 계획

#### Phase 1: DB 스키마 확인 및 수정
**파일**: `database/add-customer-representative-image.sql`

**확인 사항**:
- `image_assets` 테이블에 `is_customer_representative` 컬럼 존재 여부
- 인덱스 존재 여부
- RLS 정책 확인

**수정 내용** (필요시):
```sql
-- 컬럼이 없으면 추가
ALTER TABLE image_assets 
ADD COLUMN IF NOT EXISTS is_customer_representative BOOLEAN DEFAULT FALSE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_image_assets_is_customer_representative 
  ON image_assets(is_customer_representative);

-- ai_tags 기반 부분 인덱스 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_image_assets_customer_representative_tags 
  ON image_assets USING GIN (ai_tags) 
  WHERE is_customer_representative = true;
```

#### Phase 2: API 디버깅 및 수정
**파일**: `pages/api/admin/set-customer-representative-image.ts`

**확인 사항**:
1. 이미지 소유권 확인 로직 (`ai_tags` 또는 `file_path`)
2. 고객의 다른 대표 이미지 해제 로직
3. 에러 핸들링 및 로깅

**수정 내용**:
- 상세한 로그 추가
- 에러 메시지 개선
- `ai_tags` 기반 필터링 강화

#### Phase 3: UI 개선
**파일**: `pages/admin/customers/index.tsx`

**현재 상태**:
- "🏠 썸네일" 배지 존재
- `handleSetCustomerRepresentative`, `handleUnsetCustomerRepresentative` 핸들러 존재

**개선 내용**:
1. 배지 표시 명확화 (항상 표시, 호버 시만 표시 제거)
2. 설정/해제 피드백 개선
3. 에러 메시지 표시

#### Phase 4: 썸네일 조회 로직 확인
**파일**: `pages/api/admin/customers/index.ts`

**현재 상태**:
- 이미 대표 이미지 우선 조회 로직 구현됨 (393-433번 줄)
- 대표 이미지 없으면 최신 이미지 사용 (435-506번 줄)

**확인 사항**:
- 쿼리가 정상 작동하는지
- 로그 추가로 디버깅 가능하도록

## 기능 비교표

| 기능 | 위치 | DB 필드 | 용도 | 상태 |
|------|------|---------|------|------|
| **썸네일** | 고객 목록 | 없음 (동적 조회) | 고객 목록 표시 | ✅ 작동 중 |
| **대표 이미지** | 이미지 관리 모달 | `is_customer_representative` | 고객 목록 썸네일 지정 | ❌ 작동 안 함 |
| **장면 대표** | 스토리 관리 모달 | `is_scene_representative` | 장면별 대표 이미지 | ✅ 작동 중 (추정) |

## 결론 및 권장 사항

### 최종 권장: 대표 이미지 기능 수정 및 활성화

**이유**:
1. 썸네일과 대표 이미지는 같은 목적 (고객 목록 썸네일)
2. 대표 이미지 기능이 이미 구현되어 있음
3. 사용자가 직접 선택할 수 있어 더 나은 UX
4. 썸네일 자동 선택은 fallback으로만 사용

**작업 우선순위**:
1. **높음**: DB 스키마 확인 및 수정
2. **높음**: 대표 이미지 API 디버깅 및 수정
3. **중간**: UI 개선 (배지 표시, 피드백)
4. **낮음**: 썸네일 자동 선택 로직은 fallback으로 유지

**예상 작업 시간**:
- DB 스키마 확인/수정: 30분
- API 디버깅 및 수정: 1-2시간
- UI 개선: 1시간
- 테스트: 1시간
- **총 예상 시간: 3-4시간**
