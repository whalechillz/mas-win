# 썸네일 → 대표 이미지 기능 전환 계획

## 현재 상황 정리

### 썸네일 기능
- **저장 방식**: ❌ DB에 저장하지 않음 (동적 조회만)
- **위치**: 고객 관리 페이지 (`/admin/customers`)
- **로직**: 
  1. `is_customer_representative = true`인 이미지 우선 조회 ✅ (이미 구현됨)
  2. 없으면 최신 이미지 10개 중 첫 번째 사용 (Fallback)
- **특징**: 자동 선택 (사용자가 직접 선택 불가)

### 대표 이미지 기능
- **저장 방식**: ✅ DB에 저장 (`image_assets.is_customer_representative` 필드)
- **위치**: 고객 이미지 관리 모달 (`CustomerImageModal`)
- **로직**: 사용자가 직접 선택/해제 가능
- **상태**: ❌ 현재 작동하지 않음 (수정 필요)
- **특징**: 수동 선택 (사용자가 직접 선택 가능)

## 답변: 썸네일은 저장이 안되나요?

**네, 맞습니다.** 썸네일은 DB에 저장되지 않고 동적으로 조회됩니다.

### 현재 구조
- `customers` 테이블에는 `thumbnailUrl` 필드가 **없음**
- 고객 목록 API (`/api/admin/customers/index.ts`)에서 매번 조회:
  1. 먼저 `is_customer_representative = true`인 이미지 조회
  2. 없으면 최신 이미지 조회

### 대표 이미지로 전환해야 하나요?

**권장: 대표 이미지 기능만 사용** ⭐

**이유**:
1. ✅ 이미 구현되어 있음 (API, UI, 핸들러 모두 존재)
2. ✅ 사용자가 직접 선택할 수 있어 더 나은 UX
3. ✅ DB에 저장되어 있어 성능상 이점 (매번 조회 불필요)
4. ✅ 썸네일 자동 선택은 fallback으로만 사용 (이미 구현됨)

## 답변: customers 말고도 대표이미지 기능을 같이 쓰는가?

**현재는 고객 관리(`customers`) 페이지에서만 사용됩니다.**

### 사용 위치 확인
- ✅ `pages/admin/customers/index.tsx` - 고객 목록 썸네일 표시
- ✅ `pages/api/admin/customers/index.ts` - 썸네일 조회 API
- ✅ `pages/api/admin/set-customer-representative-image.ts` - 대표 이미지 설정 API
- ❌ 다른 페이지에서는 사용하지 않음

### 다른 페이지에서 사용 가능한가?

**가능합니다.** `is_customer_representative` 필드는 범용적으로 사용 가능합니다.

**사용 예시**:
- 블로그 포스트의 고객 이미지 선택
- 마케팅 콘텐츠의 고객 사진 선택
- 대시보드의 고객 프로필 이미지

**하지만 현재는**:
- 고객 관리 페이지의 썸네일 표시에만 사용됨

## 전환 계획

### Phase 1: 대표 이미지 기능 수정 및 활성화 (우선순위: 높음)

#### 1.1 DB 스키마 확인 및 수정
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
```

#### 1.2 API 디버깅 및 수정
**파일**: `pages/api/admin/set-customer-representative-image.ts`

**수정 내용**:
- 상세한 로그 추가
- 에러 핸들링 개선
- 이미지 소유권 확인 로직 강화 (`ai_tags` 기반 필터링 추가)

#### 1.3 UI 개선
**파일**: `pages/admin/customers/index.tsx`

**수정 내용**:
- 배지 표시 개선 (대표 이미지로 설정된 경우 항상 표시)
- 피드백 메시지 추가 (토스트 알림)
- 에러 메시지 표시

### Phase 2: 썸네일 기능 정리 (우선순위: 낮음)

**현재 상태**: 썸네일 자동 선택 로직은 fallback으로 유지됨 (이미 구현됨)

**정리 내용**:
- 썸네일 관련 주석/코드 정리
- 대표 이미지 기능을 메인으로 명확히 표시
- 문서화 개선

### Phase 3: 다른 페이지에서 사용 확장 (선택사항)

**필요 시 확장 가능한 위치**:
- 블로그 포스트 작성 시 고객 이미지 선택
- 마케팅 콘텐츠 생성 시 고객 사진 선택
- 대시보드 고객 프로필 이미지

**확장 방법**:
- `is_customer_representative` 필드 활용
- 기존 API 재사용 (`/api/admin/set-customer-representative-image`)

## 작업 우선순위

### 즉시 작업 (우선순위: 높음)
1. ✅ **빌드 에러 수정** (완료)
2. **DB 스키마 확인 및 수정** (30분)
3. **API 디버깅 및 수정** (1-2시간)
4. **UI 개선** (1시간)

### 다음 작업 (우선순위: 중간)
5. **테스트 및 검증** (1시간)
6. **문서화 개선** (30분)

### 선택 작업 (우선순위: 낮음)
7. **썸네일 기능 정리** (30분)
8. **다른 페이지 확장** (필요 시)

## 예상 작업 시간

- 빌드 에러 수정: ✅ 완료
- DB 스키마 확인/수정: 30분
- API 디버깅 및 수정: 1-2시간
- UI 개선: 1시간
- 테스트: 1시간
- **총 예상 시간: 3-4시간**

## 결론

### 썸네일 vs 대표 이미지

| 항목 | 썸네일 | 대표 이미지 |
|------|--------|------------|
| **저장** | ❌ 동적 조회만 | ✅ DB 저장 |
| **선택 방식** | 자동 (최신 이미지) | 수동 (사용자 선택) |
| **UX** | 제한적 | 우수 |
| **성능** | 매번 조회 필요 | 인덱스 활용 가능 |
| **권장** | Fallback으로 유지 | ⭐ 메인 기능으로 사용 |

### 최종 권장 사항

1. **대표 이미지 기능을 메인으로 사용** ⭐
2. **썸네일 자동 선택은 fallback으로 유지** (이미 구현됨)
3. **현재는 고객 관리 페이지에서만 사용** (다른 페이지 확장 가능)
