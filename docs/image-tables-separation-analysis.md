# image_metadata vs image_assets 테이블 분리 분석

## 📊 두 테이블의 차이점

### 1. **image_metadata** (기존 시스템)

**특징:**
- `id SERIAL PRIMARY KEY` (정수 ID)
- `image_url TEXT NOT NULL UNIQUE` (URL 기반 식별)
- Supabase Storage URL을 기준으로 관리
- `tags TEXT[]` (PostgreSQL 배열)
- 기존 갤러리 시스템에서 주로 사용

**스키마:**
```sql
CREATE TABLE image_metadata (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL UNIQUE,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[],  -- 키워드 배열
  category_id INTEGER,
  ...
);
```

### 2. **image_assets** (새로운 시스템)

**특징:**
- `id UUID PRIMARY KEY` (UUID)
- `filename`, `file_path`, `cdn_url` (파일 기반 관리)
- `ai_tags JSONB` (AI 생성 태그)
- `ai_text_extracted`, `ai_objects`, `ai_colors` (AI 분석 결과)
- 중복 관리 기능 (hash_md5, hash_sha256)
- 새로운 이미지 자산 관리 시스템에서 사용

**스키마:**
```sql
CREATE TABLE image_assets (
  id UUID PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  cdn_url TEXT,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  ai_tags JSONB DEFAULT '[]',
  ai_text_extracted TEXT,
  ...
);
```

---

## 🔍 분리된 이유

### 1. **시스템 진화 과정**

1. **초기 시스템 (image_metadata)**:
   - Supabase Storage URL 기반으로 간단하게 시작
   - 갤러리 관리에 초점
   - 수동 메타데이터 입력

2. **새로운 시스템 (image_assets)**:
   - 파일 기반 관리로 확장
   - AI 분석 기능 추가
   - 중복 이미지 감지
   - 더 정교한 자산 관리

### 2. **용도 차이**

| 항목 | image_metadata | image_assets |
|------|---------------|--------------|
| **주 용도** | 갤러리 메타데이터 관리 | 이미지 자산 관리 |
| **식별자** | URL 기반 | 파일 경로 + UUID |
| **AI 기능** | 없음 | AI 태그, 분석 결과 |
| **중복 관리** | 기본 | 고급 (hash 기반) |
| **사용 위치** | 기존 갤러리 | 새로운 자산 관리 |

### 3. **데이터 구조 차이**

- **image_metadata**: URL 중심, 간단한 구조
- **image_assets**: 파일 중심, 복잡한 구조 (AI, 최적화 등)

---

## ⚡ 성능 영향 분석

### 현재 상황 (두 테이블 분리)

**검색 시:**
```javascript
// 1. image_metadata 검색
const metadataResults = await supabase
  .from('image_metadata')
  .select('...')
  .or(searchPattern);

// 2. image_assets 검색
const assetsResults = await supabase
  .from('image_assets')
  .select('...')
  .or(assetsSearchPattern);

// 3. 결과 통합
const matchingUrls = new Set([...metadataUrls, ...assetsUrls]);
```

**성능 특성:**
- ✅ 각 테이블에 인덱스 최적화 가능
- ✅ 테이블별로 독립적인 쿼리 최적화
- ❌ 두 번의 쿼리 실행 (약 2배 시간)
- ❌ 결과 통합 로직 필요

### 합쳤을 때 (단일 테이블)

**검색 시:**
```javascript
// 단일 쿼리
const results = await supabase
  .from('unified_image_table')
  .select('...')
  .or(searchPattern);
```

**성능 특성:**
- ✅ 단일 쿼리로 빠름 (약 50% 시간 단축 가능)
- ✅ 결과 통합 불필요
- ❌ 테이블이 커짐 (인덱스 크기 증가)
- ❌ NULL 값이 많아질 수 있음 (NULL 컬럼)

---

## 📈 성능 비교 예상

### 시나리오 1: 검색 쿼리

**현재 (분리):**
```
image_metadata 검색: 100ms
image_assets 검색: 80ms
결과 통합: 20ms
총 시간: ~200ms
```

**합친 후:**
```
unified_image_table 검색: 120ms
총 시간: ~120ms (40% 개선)
```

### 시나리오 2: 인덱스 크기

**현재 (분리):**
- `image_metadata`: 10,000 rows → 인덱스 작음
- `image_assets`: 5,000 rows → 인덱스 작음
- 총 인덱스: 작음

**합친 후:**
- `unified_image_table`: 15,000 rows → 인덱스 큼
- NULL 컬럼이 많아질 수 있음

---

## 🤔 합치는 것이 더 빠른가?

### ✅ 합치면 더 빠른 경우

1. **검색 쿼리**: 단일 쿼리로 약 40-50% 빠름
2. **JOIN 불필요**: 관련 데이터 조회 시 JOIN 제거
3. **코드 단순화**: 두 테이블 관리 로직 통합

### ❌ 합치면 느려질 수 있는 경우

1. **테이블 크기**: 큰 테이블은 인덱스 스캔이 느림
2. **NULL 컬럼**: 많은 NULL 값은 인덱스 효율 저하
3. **마이그레이션 비용**: 기존 데이터 마이그레이션 필요

---

## 💡 권장 사항

### 옵션 1: 현재 구조 유지 (권장)

**장점:**
- ✅ 마이그레이션 비용 없음
- ✅ 기존 시스템 안정성 유지
- ✅ 각 테이블 최적화 가능

**개선 방안:**
- 검색 쿼리를 병렬로 실행 (Promise.all)
- 결과 통합 로직 최적화
- 캐싱 활용

### 옵션 2: 점진적 통합

**단계:**
1. 새로운 이미지는 `image_assets`에만 저장
2. 기존 `image_metadata`는 읽기 전용으로 유지
3. 필요시 `image_assets`로 마이그레이션

### 옵션 3: 완전 통합 (고위험)

**요구사항:**
- 모든 데이터 마이그레이션
- 외래 키 관계 재설정
- 애플리케이션 코드 대규모 수정
- 충분한 테스트 필요

---

## 📊 결론

### 현재 상황
- **검색 성능**: 약간 느림 (두 쿼리 실행)
- **유지보수**: 복잡함 (두 테이블 관리)
- **안정성**: 높음 (기존 시스템 유지)

### 합친 후
- **검색 성능**: 약 40-50% 개선 가능
- **유지보수**: 단순화
- **안정성**: 마이그레이션 리스크

### 최종 권장
**현재는 분리 상태 유지 + 검색 최적화**를 권장합니다:
- 병렬 쿼리 실행 (Promise.all)
- 결과 통합 로직 최적화
- 필요시에만 점진적 통합 고려
