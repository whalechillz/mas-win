# is_liked 컬럼 마이그레이션 계획서

## 📋 문제 상황

### 오류 내용
- **오류 메시지**: "is_liked 컬럼이 데이터베이스에 없습니다. 마이그레이션을 실행해주세요."
- **발생 위치**: `/api/admin/toggle-image-like` API
- **원인**: `image_metadata` → `image_assets` 테이블 마이그레이션 중 `is_liked` 컬럼이 누락됨

### 현재 상태
- ✅ `image_metadata` 테이블에는 `is_liked` 컬럼이 있음 (`database/add-is-liked-column.sql`)
- ❌ `image_assets` 테이블에는 `is_liked` 컬럼이 없음
- ✅ API 코드는 `image_assets` 테이블을 사용 중

---

## 🎯 해결 목표

1. `image_assets` 테이블에 `is_liked` 컬럼 추가
2. 기존 `image_metadata` 테이블의 `is_liked` 데이터 마이그레이션 (선택사항)
3. 좋아요 토글 기능 정상 작동 확인

---

## 📝 마이그레이션 계획

### Phase 1: image_assets 테이블에 is_liked 컬럼 추가

#### 1.1 SQL 마이그레이션 파일 생성
- ✅ 파일: `database/add-is-liked-column-to-image-assets.sql`
- 내용:
  - `ALTER TABLE image_assets ADD COLUMN is_liked BOOLEAN DEFAULT FALSE`
  - 인덱스 추가 (성능 최적화)
  - 코멘트 추가

#### 1.2 Supabase에서 실행
1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `database/add-is-liked-column-to-image-assets.sql` 파일 내용 복사
4. 실행

#### 1.3 실행 확인
```sql
-- 컬럼 존재 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'image_assets'
  AND column_name = 'is_liked';

-- 인덱스 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'image_assets'
  AND indexname = 'idx_image_assets_is_liked';
```

---

### Phase 2: 기존 데이터 마이그레이션 (선택사항)

#### 2.1 image_metadata에 is_liked 데이터가 있는지 확인
```sql
-- image_metadata 테이블에 is_liked 컬럼이 있는지 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'image_metadata'
  AND column_name = 'is_liked';

-- 좋아요가 설정된 이미지 개수 확인
SELECT COUNT(*) as liked_count
FROM image_metadata
WHERE is_liked = TRUE;
```

#### 2.2 데이터 마이그레이션 (필요한 경우)
```sql
-- image_metadata의 is_liked 데이터를 image_assets로 마이그레이션
-- 주의: image_metadata.image_url = image_assets.cdn_url로 매칭
UPDATE image_assets ia
SET is_liked = im.is_liked
FROM image_metadata im
WHERE ia.cdn_url = im.image_url
  AND im.is_liked IS NOT NULL
  AND im.is_liked = TRUE;
```

#### 2.3 마이그레이션 결과 확인
```sql
-- 마이그레이션된 좋아요 개수 확인
SELECT COUNT(*) as migrated_liked_count
FROM image_assets
WHERE is_liked = TRUE;
```

---

### Phase 3: 기능 테스트

#### 3.1 좋아요 토글 테스트
1. 갤러리 관리 페이지 접속
2. 이미지 썸네일의 하트 버튼 클릭
3. 좋아요 상태 변경 확인
4. 페이지 새로고침 후 상태 유지 확인

#### 3.2 좋아요 필터 테스트
1. "좋아요" 필터 활성화
2. 좋아요가 설정된 이미지만 표시되는지 확인

---

## 🔧 구현 파일

### 생성된 파일
- `database/add-is-liked-column-to-image-assets.sql`: 마이그레이션 SQL 파일

### 수정된 파일
- 없음 (API 코드는 이미 `image_assets` 테이블을 올바르게 사용 중)

---

## ⚠️ 주의사항

### 1. 데이터 손실 방지
- 마이그레이션 전 백업 권장
- 테스트 환경에서 먼저 실행

### 2. URL 매칭 주의
- `image_metadata.image_url`과 `image_assets.cdn_url`이 정확히 일치해야 함
- URL 형식이 다를 수 있으므로 마이그레이션 전 확인 필요

### 3. 성능 고려
- 인덱스가 자동으로 생성되므로 좋아요 필터링 성능 최적화됨
- 대량 데이터 마이그레이션 시 시간이 걸릴 수 있음

---

## 📊 마이그레이션 체크리스트

### 필수 작업
- [ ] `database/add-is-liked-column-to-image-assets.sql` 파일 확인
- [ ] Supabase SQL Editor에서 마이그레이션 실행
- [ ] 컬럼 추가 확인
- [ ] 좋아요 토글 기능 테스트

### 선택 작업
- [ ] `image_metadata` 테이블에 `is_liked` 데이터 확인
- [ ] 기존 데이터 마이그레이션 (필요한 경우)
- [ ] 마이그레이션 결과 확인

---

## 🚀 실행 순서

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭
   - "New query" 클릭

3. **마이그레이션 SQL 실행**
   - `database/add-is-liked-column-to-image-assets.sql` 파일 내용 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **결과 확인**
   - "Success. No rows returned" 메시지 확인
   - 또는 위의 확인 쿼리 실행

5. **기능 테스트**
   - 갤러리 관리 페이지에서 좋아요 토글 테스트

---

## 📝 참고 사항

### 관련 파일
- `pages/api/admin/toggle-image-like.js`: 좋아요 토글 API
- `pages/admin/gallery.tsx`: 갤러리 관리 페이지 (좋아요 UI)
- `database/add-is-liked-column.sql`: image_metadata 테이블용 (기존)

### 테이블 구조
- **image_metadata**: 기존 테이블 (SERIAL ID, image_url)
- **image_assets**: 새로운 테이블 (UUID ID, cdn_url) ← 현재 사용 중

### 마이그레이션 배경
- `image_metadata` → `image_assets` 테이블 마이그레이션 중
- 새로운 시스템은 `image_assets` 테이블 사용
- `is_liked` 컬럼이 마이그레이션 스키마에 포함되지 않아 누락됨
