# 🚀 갤러리 관리 시스템 우선순위 개발 계획

## 📋 개발 순서 (조정됨)

### 🔴 Phase 1-5: 블로그 이미지 정리 우선 (현재 갤러리 핵심 기능)
**목적**: 멀티 채널 콘텐츠 생산을 위한 핵심 인프라 구축

### 🟡 Phase 6-7: 제품/고객 이미지 정리 (후속 작업)
**목적**: 추가 자산 관리 기능 확장

---

## 🔴 Phase 1: 인프라 준비 및 DB 설계 (2일)

### Day 1: 새 버킷 및 기본 폴더 구조 생성

#### 작업 내용:
1. ✅ Supabase Storage에 `masgolf-images` 버킷 생성
2. ✅ 블로그 이미지 정리를 위한 기본 폴더 구조 생성
   ```
   masgolf-images/
   ├── originals/
   │   └── blog/              # ✅ 블로그 이미지 (우선)
   │       └── 2025-01/       # 날짜별 폴더
   ├── variants/              # 채널별 베리에이션
   └── references/            # 참조 메타데이터
       └── blog/
   ```

3. ✅ 기존 `blog-images` 버킷과 병행 운영 계획
4. ⚠️ **추가**: 환경 변수 설정 (`IMAGE_BUCKET`, `NEXT_PUBLIC_IMAGE_BUCKET`)
5. ⚠️ **추가**: 기존 버킷(`blog-images`) 백업 계획 수립

#### API 엔드포인트:
- `POST /api/admin/setup-blog-storage-structure`
  - 새 버킷 생성 확인
  - 블로그 이미지용 기본 폴더 생성

#### 검증:
- [ ] 버킷 생성 확인
- [ ] 기본 폴더 구조 확인

---

### Day 2: 데이터베이스 스키마 설계 및 확장

#### 작업 내용:
1. ✅ `image_metadata` 테이블 확장
   ```sql
   -- 블로그 이미지 관리를 위한 필수 필드
   ALTER TABLE image_metadata
   ADD COLUMN IF NOT EXISTS original_path TEXT,          -- 실제 Storage 경로
   ADD COLUMN IF NOT EXISTS internal_id VARCHAR(255),    -- 내부 고유 ID
   ADD COLUMN IF NOT EXISTS hash_md5 VARCHAR(32),        -- 중복 감지용
   ADD COLUMN IF NOT EXISTS hash_sha256 VARCHAR(64),      -- 중복 감지용
   ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0, -- 사용 횟수
   ADD COLUMN IF NOT EXISTS references JSONB DEFAULT '[]', -- 참조 정보
   ADD COLUMN IF NOT EXISTS blog_posts TEXT[],            -- 연결된 블로그 글 ID 배열
   ADD INDEX idx_original_path (original_path),
   ADD INDEX idx_internal_id (internal_id),
   ADD INDEX idx_hash_md5 (hash_md5),
   ADD INDEX idx_hash_sha256 (hash_sha256);
   ```

2. ✅ 해시 기반 검색 최적화
   ```sql
   CREATE INDEX IF NOT EXISTS idx_hash_md5 ON image_metadata(hash_md5);
   CREATE INDEX IF NOT EXISTS idx_hash_sha256 ON image_metadata(hash_sha256);
   CREATE INDEX IF NOT EXISTS idx_blog_posts ON image_metadata USING GIN(blog_posts);
   ```

#### 검증:
- [ ] 스키마 업데이트 확인
- [ ] 인덱스 생성 확인

---

## 🔴 Phase 2: 블로그 이미지 분석 및 분류 (2일)

### Day 3: 블로그 이미지 전체 분석

#### 작업 내용:
1. ✅ 모든 블로그 글 분석
   - `featured_image` + `content` 이미지 추출
   - 이미지 URL 수집
   - 블로그 글별 이미지 매핑

2. ✅ Storage에서 실제 파일 찾기
   - URL 기반 파일 경로 추출
   - 파일명 기반 검색 (fallback)
   - 해시 기반 검색 (향후)

3. ✅ 중복 이미지 감지
   - 파일명 기반 중복 검사
   - 해시 기반 중복 검사 (우선 구현)

#### API 엔드포인트:
- `POST /api/admin/analyze-all-blog-images`
  - 모든 블로그 이미지 추출
  - Storage 파일 매칭
  - 중복 감지 및 그룹화
  - 블로그 연결 여부 확인

#### 출력 데이터:
```json
{
  "total_blog_posts": 150,
  "total_unique_images": 299,
  "duplicate_groups": [
    {
      "filename": "image.jpg",
      "count": 3,
      "images": [
        {
          "path": "originals/blog/2025-01/image.jpg",
          "blog_posts": [309, 310],
          "keep": true
        },
        {
          "path": "duplicated/image.jpg",
          "blog_posts": [],
          "keep": false
        }
      ]
    }
  ],
  "unlinked_images": [
    {
      "path": "uploaded/2025-01/image.jpg",
      "suggested_action": "move_to_blog_or_organize"
    }
  ]
}
```

#### 검증:
- [ ] 모든 블로그 이미지 추출 완료
- [ ] 중복 이미지 그룹 생성 완료
- [ ] 블로그 연결 여부 확인 완료

---

### Day 4: 블로그 이미지 분류 및 이동 계획 수립

#### 작업 내용:
1. ✅ 이미지 이동 계획 생성
   - 블로그 글별 폴더 구조: `originals/blog/YYYY-MM/`
   - 날짜 기반 분류 (블로그 글 `created_at` 기준)
   - 중복 이미지 처리 계획

2. ✅ 안전한 이동 전략
   - 원본 보존 확인
   - 메타데이터 업데이트 계획
   - 롤백 계획

#### API 엔드포인트:
- `POST /api/admin/plan-blog-image-migration`
  - 이동 계획 생성
  - 드라이런 모드 제공

#### 검증:
- [ ] 이동 계획 생성 완료
- [ ] 드라이런 결과 확인

---

## 🔴 Phase 3: 블로그 이미지 마이그레이션 및 메타데이터 동기화 (3일)

### Day 5-6: 블로그 이미지 마이그레이션

#### 작업 내용:
1. ✅ 블로그 이미지 이동
   - `originals/blog/YYYY-MM/` 구조로 이동
   - 원본 보존 확인 (copy 또는 move 후 메타데이터 업데이트)

2. ✅ 메타데이터 자동 생성
   - `original_path` 업데이트
   - `blog_posts` 배열 업데이트
   - `internal_id` 생성

3. ✅ URL 업데이트
   - `image_url` 필드 업데이트
   - 블로그 글 `featured_image` URL 업데이트
   - 블로그 글 `content` 내 이미지 URL 업데이트 (Markdown/HTML 형식)
   - URL 업데이트 후 검증

#### API 엔드포인트:
- `POST /api/admin/migrate-blog-images`
  - 실제 마이그레이션 실행
  - 진행 상황 추적
  - 에러 처리 및 롤백

#### 검증:
- [ ] 모든 블로그 이미지 마이그레이션 완료
- [ ] 메타데이터 업데이트 완료
- [ ] 블로그 글 URL 업데이트 완료

---

### Day 7: 메타데이터 동기화 및 AI 생성

#### 작업 내용:
1. ✅ 누락된 메타데이터 확인
   - `alt_text`, `title`, `description`, `keywords` 확인
   - 누락 항목 목록 생성

2. ✅ AI 메타데이터 생성
   - 누락된 메타데이터 AI 생성
   - 일괄 처리 지원

3. ✅ 메타데이터 품질 검증
   - 품질 점수 계산
   - 개선 권장 사항 제시

#### API 엔드포인트:
- `POST /api/admin/sync-blog-image-metadata`
  - 누락된 메타데이터 AI 생성
  - 진행 상황 추적

#### 검증:
- [ ] 모든 이미지 메타데이터 생성 완료
- [ ] 메타데이터 품질 점수 확인

---

## 🔴 Phase 4: 중복 이미지 제거 (2일)

### Day 8: 중복 이미지 안전 제거

#### 작업 내용:
1. ✅ 중복 이미지 그룹 확인
   - 해시 기반 중복 감지
   - 블로그 연결 여부 확인

2. ✅ 안전한 중복 제거
   - 블로그에 연결된 이미지 우선 보존
   - 연결되지 않은 중복 이미지 제거
   - 제거 전 백업 (선택)

3. ✅ 메타데이터 정리
   - 제거된 이미지 메타데이터 삭제
   - 참조 업데이트

#### API 엔드포인트:
- `POST /api/admin/remove-duplicate-blog-images`
  - 안전한 중복 제거
  - 드라이런 모드 제공
  - 제거 계획 확인

#### 검증:
- [ ] 중복 이미지 제거 완료
- [ ] 블로그 연결 이미지 보존 확인
- [ ] 메타데이터 정리 완료

---

## 🔴 Phase 5: 프론트엔드 개발 편의성 개선 (3일)

### Day 9: 폴더 트리 네비게이션 구현

#### 작업 내용:
1. ✅ 폴더 트리 컴포넌트 개발
   ```typescript
   // components/gallery/FolderTree.tsx
   interface FolderNode {
     name: string;
     path: string;
     children?: FolderNode[];
     imageCount?: number;
   }
   ```

2. ✅ 폴더별 이미지 조회 API
   - `GET /api/admin/images-by-folder?path={folderPath}`
   - 하위 폴더 포함 옵션

3. ✅ 갤러리 UI 통합
   - 폴더 트리 사이드바
   - 폴더 클릭 시 이미지 필터링

#### 검증:
- [ ] 폴더 트리 렌더링 확인
- [ ] 폴더별 필터링 동작 확인

---

### Day 10: 이미지 검색 및 필터링 강화

#### 작업 내용:
1. ✅ 통합 검색 기능
   - 경로 검색
   - 파일명 검색
   - 태그/키워드 검색
   - 블로그 글 제목 검색

2. ✅ 필터 개선
   - 블로그 글별 필터
   - 날짜별 필터
   - 메타데이터 품질별 필터
   - 사용 횟수별 필터

3. ✅ 해시 기반 검색
   - 파일명 변경되어도 찾기
   - 중복 이미지 그룹 표시

#### API 엔드포인트:
- `GET /api/admin/search-images?query={query}&filters={filters}`
- `GET /api/admin/images-by-blog-post?postId={postId}`

#### 검증:
- [ ] 통합 검색 동작 확인
- [ ] 필터 동작 확인
- [ ] 해시 검색 동작 확인

---

### Day 11: 이미지 카드 정보 확장 및 사용 편의성 개선

#### 작업 내용:
1. ✅ 이미지 카드 정보 확장
   - 실제 폴더 경로 표시
   - 연결된 블로그 글 표시
   - 사용 횟수 표시
   - 메타데이터 품질 배지

2. ✅ 빠른 작업 기능
   - 이미지 편집 (메타데이터 수정)
   - 블로그 글 연결/해제
   - 폴더 이동
   - 베리에이션 생성

3. ✅ 일괄 작업 기능
   - 다중 선택
   - 일괄 메타데이터 수정
   - 일괄 폴더 이동
   - 일괄 삭제 (안전장치 포함)

#### 검증:
- [ ] 이미지 카드 정보 표시 확인
- [ ] 빠른 작업 기능 동작 확인
- [ ] 일괄 작업 기능 동작 확인

---

## ✅ Phase 1-5 완료 기준

### 기능적 요구사항
- ✅ 모든 블로그 이미지가 `masgolf-images/originals/blog/`에 정리 완료
- ✅ 모든 블로그 이미지 메타데이터 생성/동기화 완료
- ✅ 중복 이미지 제거 완료 (블로그 연결 이미지 보존)
- ✅ 폴더 트리 네비게이션 작동
- ✅ 검색 및 필터링 작동
- ✅ 블로그 글별 이미지 연결 표시

### 비기능적 요구사항
- ✅ 이미지 조회 API 응답 시간 < 2초
- ✅ 대량 이미지 처리 시 타임아웃 없음
- ✅ 메타데이터 정확도 > 95%

---

## 🟡 Phase 6-7: 제품/고객 이미지 정리 (후속 작업)

### Phase 6: 제품 이미지 마이그레이션 (예정)
- 제품 이미지 식별 및 분류
- `originals/products/` 구조로 이동
- 제품별 메타데이터 생성

### Phase 7: 고객 콘텐츠 마이그레이션 (예정)
- 고객 사진/영상 분류
- `originals/customers/` 구조로 이동
- 고객 동의 관리

---

## 🔧 추가 기능

### EXIF 메타정보 추출 (구현 완료 ✅)

#### 완료된 기능
- ✅ EXIF 메타데이터 추출 (GPS 좌표, 촬영 날짜, 카메라 정보 등)
- ✅ 이미지 크기 정보 추출 (width, height)
- ✅ 일괄 EXIF 추출 및 메타데이터 동기화

**API**: 
- `POST /api/admin/extract-exif` - 단일 이미지 EXIF 추출
- `POST /api/admin/backfill-exif` - 일괄 EXIF 추출

**구현 파일**: 
- `pages/api/admin/extract-exif.js`
- `pages/api/admin/backfill-exif.js`

**사용 방법**:
1. 갤러리 관리 페이지에서 이미지 선택
2. "EXIF 추출" 버튼 클릭
3. GPS 좌표, 촬영 날짜, 카메라 정보 등 자동 추출

---

### 구글 지도 연결 (Contact 페이지 구현 완료 ✅)

#### 현재 상태
- ✅ Contact 페이지에 구글 지도 임베드 구현
- ⚠️ 갤러리 시스템과 직접 연결 없음 (별도 기능)

**구현 파일**: `pages/contact.tsx`

**주요 기능**:
- Google Maps Embed API 사용
- 매장 위치 표시
- 네비게이션 앱 링크 (Google Maps, 네이버 지도, T맵, 카카오맵)

**참고**: 갤러리 시스템의 이미지 위치 정보와 연동 가능 (향후 개선 사항)

---

## 📅 예상 일정

### 블로그 이미지 정리 우선 (Phase 1-6)
- **총 소요 시간**: 약 11-13일
- **Phase 1**: 인프라 준비 (2일)
- **Phase 2**: 이미지 분석 (2일)
- **Phase 3**: 마이그레이션 및 메타데이터 (3일)
- **Phase 4**: 중복 제거 (2일)
- **Phase 5**: 프론트엔드 개선 (3일)
- **Phase 6**: 코드 버킷명 변경 (1일) - **신규 추가**

### Phase 6: 코드 버킷명 변경 (1일) - **신규 추가**

#### 작업 내용:
1. ⚠️ 환경 변수 설정
   - `.env.local`에 `IMAGE_BUCKET=masgolf-images` 추가
   - `.env.production`에 `IMAGE_BUCKET=masgolf-images` 추가
   - Vercel 환경 변수 설정

2. ⚠️ API 파일 수정
   - 모든 API 파일에서 하드코딩된 `blog-images` → 환경 변수 사용
   - 영향받는 파일: `organize-images-by-blog.js`, `sync-blog-with-dedupe.js`, `remove-duplicates-with-blog.js`, `all-images.js`, `find-duplicates.js`, `sync-missing-metadata.js`, `blog-images.js`, `save-images-to-storage.js`

3. ⚠️ 프론트엔드 파일 수정
   - `pages/admin/blog.tsx`, `pages/admin/gallery.tsx` 확인 및 수정

4. ⚠️ 테스트
   - 로컬 환경 테스트
   - 스테이징 환경 테스트
   - 프로덕션 배포 전 검증

#### 검증:
- [ ] 모든 API가 새 버킷 사용
- [ ] 기존 버킷 참조 제거
- [ ] 환경 변수 정상 작동
- [ ] 프로덕션 배포 전 검증 완료

---

### 후속 작업 (Phase 7-8)
- 제품/고객 이미지 정리는 멀티 채널 콘텐츠 생산이 안정화된 후 진행

---

## 🎯 우선순위 체크리스트

### 🔴 Critical (즉시 진행)
- [ ] 새 버킷 `masgolf-images` 생성
- [ ] 환경 변수 설정 (`IMAGE_BUCKET`, `NEXT_PUBLIC_IMAGE_BUCKET`)
- [ ] 블로그 이미지용 기본 폴더 구조 생성
- [ ] 데이터베이스 스키마 확장
- [ ] 모든 블로그 이미지 분석 및 분류
- [ ] 블로그 이미지 마이그레이션
- [ ] 블로그 글 URL 업데이트 (featured_image, content)
- [ ] 메타데이터 동기화
- [ ] 중복 이미지 제거
- [ ] 코드 버킷명 변경 (신규 추가)
- [ ] 프론트엔드 개선

### 🟡 High (1주 이내, 멀티 채널 콘텐츠 생산 후)
- [ ] 제품 이미지 마이그레이션
- [ ] 고객 콘텐츠 마이그레이션

---

## 🚨 주의사항

### 마이그레이션 시
1. **백업 필수**: 기존 `blog-images` 버킷 백업
2. **단계적 진행**: 전체를 한 번에 처리하지 말고 단계별로
3. **검증 필수**: 각 단계마다 검증 후 다음 단계 진행
4. **롤백 계획**: 문제 발생 시 롤백 가능하도록

### 개발 시
1. **원본 보존**: 절대 원본을 이동/삭제하지 않음 (필요시 copy 사용)
2. **메타데이터 동기화**: 모든 이동 시 메타데이터 업데이트 필수
3. **블로그 연결 보존**: 블로그에 연결된 이미지는 항상 보존

### 코드 버킷명 변경 시 (Phase 6)
1. **점진적 전환**: 기존 버킷과 새 버킷 병행 지원
2. **환경 변수 우선**: 하드코딩 제거, 환경 변수 사용
3. **테스트 필수**: 모든 API 및 프론트엔드 기능 테스트
4. **롤백 준비**: 문제 발생 시 즉시 롤백 가능하도록

---

## 📞 다음 단계

Phase 1부터 순차적으로 진행하면 됩니다. 각 Phase 완료 후 검증하고 다음 단계로 진행하세요.

## 📚 관련 문서

- `docs/gallery-migration-checklist.md`: 누락 사항 체크리스트 및 상세 작업 내용
- `docs/gallery-architecture-principles.md`: 아키텍처 원칙 및 구조 설계
- `database/gallery-storage-schema.sql`: 데이터베이스 스키마

