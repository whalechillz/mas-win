# 이미지 장면 업데이트 오류 수정 계획

## 문제 분석

### 현재 상황
- **오류 메시지**: `Could not find the 'story_scene' column of 'image_assets' in the schema cache`
- **발생 위치**: `PATCH /api/admin/update-image-scene` 엔드포인트
- **원인**: `image_assets` 테이블에 `story_scene` 컬럼이 없음

### 오류 상세
- **API 파일**: `pages/api/admin/update-image-scene.ts`
- **프론트엔드**: `components/admin/CustomerStoryModal.tsx`
- **기능**: 고객 스토리보드에서 이미지를 드래그 앤 드롭하여 장면을 변경하는 기능
- **문제**: `image_assets` 테이블에 `story_scene` 컬럼이 없어서 업데이트 실패

### 현재 코드 분석

#### API 코드 (`pages/api/admin/update-image-scene.ts`)
```typescript
const updateData: any = {
  story_scene: storyScene !== undefined ? storyScene : null,
  updated_at: new Date().toISOString()
};

let query = supabase
  .from('image_assets')
  .update(updateData);  // ❌ story_scene 컬럼이 없어서 오류 발생
```

#### 프론트엔드 코드 (`components/admin/CustomerStoryModal.tsx`)
```typescript
const updateImageScene = async (imageId: number, scene: number | null) => {
  const response = await fetch('/api/admin/update-image-scene', {
    method: 'PATCH',
    body: JSON.stringify({ imageId, storyScene: scene })
  });
  // ...
};
```

## 해결 방안

### 옵션 1: `image_assets` 테이블에 `story_scene` 컬럼 추가 (권장)

**장점**:
- 기존 코드와 호환성 최고
- 간단하고 직관적
- 다른 기능과의 일관성 유지

**단점**:
- 데이터베이스 스키마 변경 필요
- 마이그레이션 필요

### 옵션 2: 별도 테이블 생성 (이미지-장면 연결 테이블)

**장점**:
- 스키마 변경 없음
- 확장성 좋음

**단점**:
- 복잡도 증가
- 기존 코드 대폭 수정 필요

### 옵션 3: `ai_tags` JSONB 필드 사용

**장점**:
- 스키마 변경 없음
- 유연함

**단점**:
- 쿼리 복잡도 증가
- 성능 이슈 가능성

## 권장 방안: 옵션 1 (컬럼 추가)

### 이유
1. **간단함**: 가장 직접적인 해결 방법
2. **호환성**: 기존 코드 수정 최소화
3. **성능**: 인덱스 추가로 빠른 조회 가능
4. **일관성**: 다른 필드들과 동일한 방식

## 구현 계획

### Phase 1: 데이터베이스 스키마 수정

**파일**: `database/add-story-scene-to-image-assets.sql` (신규)

**내용**:
1. `image_assets` 테이블에 `story_scene` 컬럼 추가
2. `display_order` 컬럼 추가 (같은 장면 내 이미지 순서)
3. 인덱스 추가 (조회 성능 최적화)

**SQL 스크립트**:
```sql
-- image_assets 테이블에 story_scene 컬럼 추가
ALTER TABLE image_assets
ADD COLUMN IF NOT EXISTS story_scene INTEGER;

-- display_order 컬럼 추가 (같은 장면 내 이미지 표시 순서)
ALTER TABLE image_assets
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 인덱스 추가 (고객별 장면별 이미지 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_image_assets_story_scene
ON image_assets(story_scene)
WHERE story_scene IS NOT NULL;

-- ai_tags에 customer-{id} 태그가 있는 이미지의 장면별 인덱스
CREATE INDEX IF NOT EXISTS idx_image_assets_customer_scene
ON image_assets USING GIN (ai_tags)
WHERE story_scene IS NOT NULL;

-- 코멘트 추가
COMMENT ON COLUMN image_assets.story_scene IS '고객 스토리 장면 번호 (1-7, null: 미할당)';
COMMENT ON COLUMN image_assets.display_order IS '같은 장면 내 이미지 표시 순서';
```

### Phase 2: API 코드 확인 및 개선

**파일**: `pages/api/admin/update-image-scene.ts`

**변경 사항**:
1. ✅ 이미 `image_assets` 테이블을 사용하고 있음
2. ✅ `story_scene` 업데이트 로직이 이미 구현되어 있음
3. ⚠️ 컬럼이 추가되면 자동으로 작동할 것

**확인 사항**:
- `display_order` 업데이트 로직 확인
- 에러 처리 개선 (컬럼이 없을 때 명확한 오류 메시지)

### Phase 3: 프론트엔드 코드 확인

**파일**: `components/admin/CustomerStoryModal.tsx`

**변경 사항**:
1. ✅ 이미 올바른 API를 호출하고 있음
2. ⚠️ 에러 처리 개선 가능

### Phase 4: 테스트 및 검증

**테스트 항목**:
1. 데이터베이스 스키마 변경 확인
2. 이미지 드래그 앤 드롭 테스트
3. 장면 변경 테스트
4. 에러 처리 확인

## 상세 구현 계획

### 1단계: SQL 스크립트 작성

**파일**: `database/add-story-scene-to-image-assets.sql`

**기능**:
1. `story_scene` 컬럼 추가 (INTEGER, nullable)
2. `display_order` 컬럼 추가 (INTEGER, default 0)
3. 인덱스 추가
4. 코멘트 추가

### 2단계: API 코드 개선 (선택)

**파일**: `pages/api/admin/update-image-scene.ts`

**개선 사항**:
1. 에러 메시지 개선
2. `display_order` 업데이트 로직 확인
3. 로깅 개선

### 3단계: 테스트

**테스트 시나리오**:
1. 고객 스토리보드 모달 열기
2. 이미지를 드래그하여 다른 장면으로 이동
3. 장면 변경이 정상적으로 저장되는지 확인
4. 페이지 새로고침 후 변경사항이 유지되는지 확인

## 파일 목록

### 새로 생성할 파일
1. `database/add-story-scene-to-image-assets.sql` - 스키마 수정 SQL

### 수정할 파일
1. `pages/api/admin/update-image-scene.ts` - 에러 처리 개선 (선택)

### 참고 파일
1. `components/admin/CustomerStoryModal.tsx` - 프론트엔드 코드
2. `pages/api/admin/customer-story-scenes.ts` - 장면 설명 관리 API

## 예상 작업 시간

- Phase 1 (SQL 스크립트 작성): 30분
- Phase 2 (API 코드 개선): 30분 (선택)
- Phase 3 (테스트): 30분
- **총 예상 시간: 1-1.5시간**

## 우선순위

**높음**: 사용자가 이미지를 드래그 앤 드롭하여 장면을 변경할 수 있어야 함

## 실행 순서

1. ✅ **SQL 스크립트 작성**
2. ✅ **Supabase SQL Editor에서 실행**
3. ✅ **API 테스트**
4. ✅ **프론트엔드 테스트**

## 주의 사항

1. **데이터 손실 없음**: `ADD COLUMN IF NOT EXISTS` 사용으로 기존 데이터 보존
2. **NULL 허용**: `story_scene`은 nullable이므로 기존 이미지는 영향 없음
3. **인덱스 성능**: 인덱스 추가로 조회 성능 향상

## 결론

**권장 사항**:
1. ✅ **`image_assets` 테이블에 `story_scene` 컬럼 추가** (Phase 1)
2. ✅ **API 코드는 이미 올바르게 구현되어 있음** (Phase 2)
3. ✅ **테스트 및 검증** (Phase 3)

이렇게 하면 이미지 드래그 앤 드롭 기능이 정상적으로 작동합니다.
