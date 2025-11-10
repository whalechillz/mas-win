# 🏗️ 고도화된 갤러리 관리 아키텍처 원칙

## 📋 핵심 원칙

### 1. 원본 보존 원칙 (Single Source of Truth)
- **원칙**: 모든 이미지는 `originals/` 폴더에 한 곳에만 물리적으로 존재
- **위치**: `originals/{category}/{subfolder}/{uuid}-{name}.ext`
- **이유**: 중복 제거, 일관성 유지, 저장 공간 절약

### 2. 참조 기반 재사용 원칙
- **원칙**: 여러 곳에서 사용해도 원본은 복사하지 않고 메타데이터로 참조
- **구현**: `references/{type}/{id}/{image-id}.json` 메타데이터 파일
- **장점**: 파일 복사 없음, 일관성 유지, 업데이트 용이

### 3. 채널별 베리에이션 생성 원칙
- **원본 위치**: 항상 `originals/` 폴더에 유지
- **베리에이션 위치**: `variants/{image-uuid}/channels/{channel-name}.ext`
- **생성 규칙**: 
  - ✅ 원본은 절대 이동/삭제하지 않음
  - ✅ 베리에이션만 `variants/` 폴더에 생성
  - ✅ 메타데이터에 원본 경로 항상 저장

## 🗂️ 전체 Storage 구조 (최종 설계)

```
masgolf-images/
├── originals/                    # 원본 이미지 (물리적 파일)
│   ├── blog/                     # ✅ 블로그 이미지 (우선 정리 대상)
│   │   ├── 2025-01/               # 날짜별 폴더 (블로그 글 created_at 기준)
│   │   │   ├── {uuid}-{name}.jpg  # 실제 파일 (한 곳에만 존재)
│   │   │   └── ...
│   │   ├── 2025-02/
│   │   └── ...
│   │
│   ├── products/                 # 🟡 제품 이미지 (후속 작업)
│   │   ├── secret-weapon-black/
│   │   │   ├── studio/           # 스튜디오 이미지
│   │   │   ├── detail/           # 상세페이지용
│   │   │   └── specs/            # 스팩표 이미지
│   │   ├── secret-weapon-black-muziik/
│   │   ├── secret-weapon-4-1/
│   │   ├── secret-force-gold-2-muziik/
│   │   ├── secret-force-gold-2/
│   │   ├── secret-force-pro3/
│   │   ├── secret-force-v3/
│   │   └── {additional-products}/
│   │
│   ├── locations/                # 🟡 매장 이미지 (후속 작업)
│   │   ├── interior/             # 매장 내부
│   │   ├── exterior/             # 매장 외부
│   │   └── product-showcase/     # 제품 실사
│   │
│   ├── customers/                # 🟡 고객 콘텐츠 (후속 작업)
│   │   ├── photos/               # 고객 사진 (50명)
│   │   │   ├── customer-001/
│   │   │   └── ...
│   │   └── videos/               # 고객 스윙 영상
│   │       ├── customer-001/
│   │       └── ...
│   │
│   ├── team/                     # 🟡 팀/스태프 이미지 (후속 작업)
│   │   ├── staff/                # 직원 사진
│   │   ├── instructors/           # 강사 사진
│   │   └── group/                # 단체 사진
│   │
│   ├── events/                   # 🟡 이벤트/행사 이미지 (후속 작업)
│   │   ├── 2025-01/              # 날짜별 관리
│   │   ├── promotions/           # 프로모션 이미지
│   │   └── workshops/            # 워크샵 이미지
│   │
│   ├── testimonials/             # 🟡 후기/리뷰 스크린샷 (후속 작업)
│   │   ├── reviews/              # 리뷰 스크린샷
│   │   ├── screenshots/          # 일반 스크린샷
│   │   └── verified/             # 인증된 후기
│   │
│   ├── branding/                 # 🟡 로고/브랜딩 (후속 작업)
│   │   ├── logos/                # 로고 파일
│   │   │   ├── masgolf/
│   │   │   ├── muziik/
│   │   │   └── ...
│   │   ├── icons/                # 아이콘
│   │   └── graphics/             # 그래픽 자산
│   │
│   ├── uploaded/                 # 직접 업로드 (기존)
│   │   └── YYYY-MM-DD/
│   │
│   └── ai-generated/             # AI 생성 원본 (기존)
│       └── YYYY-MM-DD/
│
├── variants/                     # 채널별 최적화 버전
│   └── {image-uuid}/             # 원본 UUID 기준 그룹화
│       ├── webp/                 # WebP 변환
│       │   ├── thumbnail.webp
│       │   ├── small.webp
│       │   ├── medium.webp
│       │   ├── large.webp
│       │   └── original.webp
│       ├── jpg/                  # JPG 변환 (필요 시)
│       │   ├── thumbnail.jpg
│       │   ├── medium.jpg
│       │   └── large.jpg
│       └── channels/             # 채널별 특화 버전
│           ├── sms-mms.jpg       # 750x600
│           ├── kakao.jpg         # 750x600
│           ├── naver-blog.jpg    # 800x600
│           ├── instagram-feed.jpg # 1080x1080
│           └── google-ads.jpg    # 1200x628
│
└── references/                   # 참조 메타데이터 (메타데이터만, JSON)
    ├── blog/{post-id}/           # 블로그 글별 참조
    │   └── {image-uuid}.json     # 참조 메타데이터 파일
    ├── funnel/{funnel-id}/       # 퍼널 페이지별 참조
    ├── website/{page-id}/        # 웹사이트 페이지별 참조
    └── sms/{campaign-id}/        # SMS 캠페인별 참조
```

## 📁 각 폴더 상세 설명

### originals/blog/ - 블로그 이미지 (✅ 우선 정리 대상)

**용도**: 블로그 글에 사용된 이미지 (재사용 가능)

**구조**:
- `YYYY-MM/`: 블로그 글 `created_at` 기준 날짜별 폴더
- 파일명: `{uuid}-{seo-filename}.ext` (UUID + SEO 최적화 파일명)

**특징**:
- 블로그 글별 날짜 기준 분류
- 메타데이터에 블로그 글 ID 배열 저장 (`blog_posts`)
- 여러 블로그 글에서 재사용 가능

**메타데이터 예시**:
```json
{
  "original_path": "originals/blog/2025-01/abc-123-driver.jpg",
  "blog_posts": [309, 310],  // 연결된 블로그 글 ID 배열
  "usage_count": 2,
  "tags": ["골프", "드라이버", "제품"]
}
```

---

### originals/campaigns/ - 월별 퍼널 이미지 (🆕 신규 추가)

**용도**: 월별 퍼널 페이지에서 사용된 이미지 (재사용 가능)

**구조**:
- `YYYY-MM/`: 월별 폴더 (퍼널 페이지 발행 월 기준)
  - `hero/`: 히어로 이미지 (선택)
  - `products/`: 제품 이미지 (퍼널 전용, 선택)
  - `promotions/`: 프로모션 이미지 (선택)
  - `testimonials/`: 고객 후기 이미지 (선택)
  - 또는 루트에 직접 배치 (간단한 구조)

**특징**:
- 월별 퍼널 페이지에서 사용된 이미지
- 블로그 본문에서도 재사용 가능
- 제품 이미지와 겹치는 경우 `originals/products/`로 이동 고려
- HTML 파일과 블로그 본문 모두에서 참조 가능

**메타데이터 예시**:
```json
{
  "original_path": "originals/campaigns/2025-07/hero-summer-golf-mas.jpg",
  "funnel_pages": ["funnel-2025-07", "25-07"],
  "blog_posts": [88],
  "usage_count": 2,
  "tags": ["골프", "여름", "퍼널", "캠페인", "7월"]
}
```

**URL 업데이트 규칙**:
- HTML 파일: `/campaigns/2025-07/hero-summer-golf-mas.jpg` 
  → `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/campaigns/2025-07/hero-summer-golf-mas.jpg`
- 블로그 본문: `/campaigns/2025-07/hero-summer-golf-mas.jpg`
  → `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/campaigns/2025-07/hero-summer-golf-mas.jpg`

---

### originals/products/ - 제품 이미지 (🆕 우선 작업)

**용도**: 블로그, 퍼널, 웹사이트, SNS 등 모든 채널에서 재사용

**구조**:
- `{product-slug}/studio/`: 스튜디오 촬영 고품질 이미지
- `{product-slug}/detail/`: 상세페이지용 이미지
- `{product-slug}/specs/`: 스팩표 이미지 (차트, 테이블)

**제품 목록 (MASGOLF)**:
1. `secret-weapon-black/` - 시크리트웨폰 블랙
2. `secret-weapon-4-1/` - 시크리트웨폰 4.1
3. `secret-force-gold-2/` - 시크리트포스 골드 2
4. `secret-force-pro-3/` - 시크리트포스 프로 3
5. `secret-force-v3/` - 시크리트포스 V3

**제품 목록 (MUZIIK)**:
1. `muziik-sapphire/` - DOGATTI GENERATION Sapphire Auto-flex
2. `muziik-beryl/` - DOGATTI GENERATION Beryl
3. `muziik-technology/` - MUZIIK 기술 설명 이미지

**특징**:
- 제품별 폴더 구조로 관리
- 스튜디오, 상세, 스팩, 갤러리 이미지 분류
- 블로그, 퍼널, 웹사이트, SNS 등 모든 채널에서 재사용
- 메인 페이지 제품 이미지도 동일한 Storage에서 참조

**메타데이터 예시**:
```json
{
  "original_path": "originals/products/secret-force-gold-2/studio/secret-force-gold-2-main.jpg",
  "product_slug": "secret-force-gold-2",
  "product_name": "시크리트포스 골드 2",
  "image_type": "studio",
  "usage_count": 5,
  "tags": ["골프", "드라이버", "제품", "시크리트포스", "골드2"]
}
```

**URL 업데이트 규칙**:
- 제품 페이지: `/products/secret-force-gold-2-main.jpg`
  → `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/products/secret-force-gold-2/studio/secret-force-gold-2-main.jpg`
- 메인 페이지: `/main/products/gold2-sapphire/...`
  → `https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/originals/products/secret-force-gold-2/...`

---

### originals/locations/ - 매장 이미지 (🟡 후속 작업)

**용도**: 웹사이트, 블로그, SNS에서 매장 소개

**구조**:
- `interior/`: 매장 내부 사진
- `exterior/`: 매장 외부 사진
- `product-showcase/`: 제품 실사 사진 (매장 내 제품 전시)

---

### originals/customers/ - 고객 콘텐츠 (🟡 후속 작업)

**용도**: 블로그, 퍼널, 웹사이트, SNS에서 고객 후기/증언

**구조**:
- `photos/`: 고객 사진 (프로필, 제품사용, 후기용)
- `videos/`: 고객 스윙 영상 (정면, 측면, 슬로우모션)

**주의사항**:
- 고객별 폴더 관리 (익명화 ID: customer-001)
- 개인정보 보호 (익명화 ID 사용)
- 고객 동의 확인 필요

---

### originals/team/ - 팀/스태프 이미지 (🟡 후속 작업)

**용도**: 웹사이트, 블로그에서 팀 소개

**구조**:
- `staff/`: 직원 사진
- `instructors/`: 강사 사진
- `group/`: 단체 사진

---

### originals/events/ - 이벤트/행사 이미지 (🟡 후속 작업)

**용도**: 블로그, SNS에서 이벤트/행사 소개

**구조**:
- `YYYY-MM/`: 날짜별 이벤트 이미지
- `promotions/`: 프로모션 이미지
- `workshops/`: 워크샵 이미지

---

### originals/testimonials/ - 후기/리뷰 (🟡 후속 작업)

**용도**: 블로그, 웹사이트에서 후기/리뷰 표시

**구조**:
- `reviews/`: 리뷰 스크린샷
- `screenshots/`: 일반 스크린샷
- `verified/`: 인증된 후기

---

### originals/branding/ - 로고/브랜딩 (🆕 우선 작업)

**용도**: 모든 채널에서 브랜딩 자산 사용

**구조**:
- `masgolf/`: MASGOLF 브랜딩 자산
  - 로고 파일
  - 브랜드 컬러 가이드
  - 그래픽 자산
- `muziik/`: MUZIIK 브랜딩 자산
  - 로고 파일
  - 브랜드 컬러 가이드
  - 그래픽 자산
- `icons/`: 공통 아이콘 파일

**특징**:
- 브랜드별 폴더로 분리
- 로고, 브랜드 컬러, 그래픽 자산 관리
- 모든 채널에서 일관된 브랜딩 적용

**메타데이터 예시**:
```json
{
  "original_path": "originals/branding/muziik/muziik-logo-art.png",
  "brand": "muziik",
  "asset_type": "logo",
  "usage_count": 10,
  "tags": ["브랜딩", "로고", "MUZIIK"]
}
```

---

## 📝 메타데이터 관리

### 블로그 이미지 메타데이터 예시
```json
{
  "id": 1,
  "image_url": "https://.../originals/blog/2025-01/abc-123-driver.jpg",
  "original_path": "originals/blog/2025-01/abc-123-driver.jpg",
  "internal_id": "abc-123-def",
  "hash_md5": "a1b2c3d4e5f6...",
  "hash_sha256": "e5f6g7h8i9j0...",
  "alt_text": "골프 드라이버 실사",
  "title": "시크리트포스 골드 2 드라이버",
  "description": "프리미엄 골프 드라이버 실사 이미지",
  "keywords": ["골프", "드라이버", "시크리트포스"],
  "blog_posts": [309, 310],  // 연결된 블로그 글 ID 배열
  "usage_count": 2,
  "references": [
    {
      "type": "blog",
      "post_id": 309,
      "usage": "featured_image",
      "reference_path": "references/blog/309/abc-123-def.json"
    }
  ],
  "variants": {
    "sms-mms": "variants/abc-123-def/channels/sms-mms.jpg",
    "instagram": "variants/abc-123-def/channels/instagram-feed.jpg"
  },
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

---

## 🔧 이동 규칙

### ✅ DO (해야 할 것)
1. **`originals/` 폴더 내에서 폴더 간 이동 가능** (메타데이터 업데이트 필수)
   - 예: `originals/blog/2025-01/` → `originals/blog/2025-02/`
   - 예: `originals/uploaded/` → `originals/blog/2025-01/`

2. **이동 전 참조 상태 확인**
   - 연결된 블로그 글 확인
   - 베리에이션 존재 여부 확인

3. **이동 후 모든 참조 업데이트**
   - `image_metadata` 테이블의 `original_path` 업데이트
   - `image_url` 업데이트
   - 블로그 글의 `featured_image`, `content` 업데이트

### ❌ DON'T (하지 말 것)
1. **`originals/` → `variants/`로 이동 금지**
   - 베리에이션은 복사/생성만 가능

2. **`originals/` → 루트(`blog-images/`)로 이동 금지**
   - 구조 혼란 방지

3. **`originals/` → 다른 버킷으로 이동 금지**
   - 버킷 간 이동 금지

4. **메타데이터 업데이트 없이 이동 금지**
   - 모든 참조가 깨질 수 있음

---

## 🎯 각 채널 개발 시 준수 사항

### ✅ DO
1. **원본 경로 확인**: 항상 `original_path` 필드에서 원본 위치 확인
2. **베리에이션 생성**: `variants/{uuid}/channels/{channel}.ext`에 생성
3. **메타데이터 업데이트**: `image_metadata` 테이블에 베리에이션 정보 추가
4. **해시 기반 검색**: 파일명 변경되어도 `hash_md5`, `hash_sha256`로 찾기

### ❌ DON'T
1. **원본 이동 금지**: `originals/` 폴더의 파일은 절대 이동하지 않음 (필요시 copy 사용)
2. **복사본 생성 금지**: 같은 이미지를 여러 곳에 복사하지 않음
3. **루트로 이동 금지**: 이미 정리된 이미지를 다시 루트로 가져오지 않음

---

## 📊 데이터베이스 스키마 설계

### image_metadata 테이블 확장
```sql
-- 블로그 이미지 관리를 위한 필수 필드
ALTER TABLE image_metadata
ADD COLUMN IF NOT EXISTS original_path TEXT,           -- 실제 Storage 경로
ADD COLUMN IF NOT EXISTS internal_id VARCHAR(255),     -- 내부 고유 ID (UUID)
ADD COLUMN IF NOT EXISTS hash_md5 VARCHAR(32),         -- 중복 감지용 (MD5)
ADD COLUMN IF NOT EXISTS hash_sha256 VARCHAR(64),       -- 중복 감지용 (SHA256)
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0, -- 사용 횟수
ADD COLUMN IF NOT EXISTS references JSONB DEFAULT '[]', -- 참조 정보 배열
ADD COLUMN IF NOT EXISTS blog_posts INTEGER[],          -- 연결된 블로그 글 ID 배열
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '{}',   -- 베리에이션 경로 정보
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE; -- 마지막 사용 시간

-- 인덱스 생성 (검색 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_original_path ON image_metadata(original_path);
CREATE INDEX IF NOT EXISTS idx_internal_id ON image_metadata(internal_id);
CREATE INDEX IF NOT EXISTS idx_hash_md5 ON image_metadata(hash_md5);
CREATE INDEX IF NOT EXISTS idx_hash_sha256 ON image_metadata(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_blog_posts ON image_metadata USING GIN(blog_posts);
CREATE INDEX IF NOT EXISTS idx_usage_count ON image_metadata(usage_count);
CREATE INDEX IF NOT EXISTS idx_last_used_at ON image_metadata(last_used_at);
```

### 참조 정보 JSONB 구조
```json
{
  "references": [
    {
      "type": "blog",
      "post_id": 309,
      "usage": "featured_image",
      "reference_path": "references/blog/309/abc-123-def.json",
      "created_at": "2025-01-15T10:00:00Z"
    },
    {
      "type": "blog",
      "post_id": 310,
      "usage": "content",
      "reference_path": "references/blog/310/abc-123-def.json",
      "created_at": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### 베리에이션 정보 JSONB 구조
```json
{
  "variants": {
    "sms-mms": {
      "path": "variants/abc-123-def/channels/sms-mms.jpg",
      "size": "750x600",
      "format": "jpg",
      "quality": 85,
      "created_at": "2025-01-20T10:00:00Z"
    },
    "instagram-feed": {
      "path": "variants/abc-123-def/channels/instagram-feed.jpg",
      "size": "1080x1080",
      "format": "jpg",
      "quality": 90,
      "created_at": "2025-01-20T10:00:00Z"
    }
  }
}
```

---

## 🎯 블로그 이미지 정리 우선 작업 체크리스트

### ✅ Phase 1: 인프라 준비
- [ ] 새 버킷 `masgolf-images` 생성
- [ ] 블로그 이미지용 기본 폴더 구조 생성
- [ ] 데이터베이스 스키마 확장

### ✅ Phase 2: 이미지 분석
- [ ] 모든 블로그 이미지 추출
- [ ] Storage 파일 매칭
- [ ] 중복 이미지 감지

### ✅ Phase 3: 마이그레이션 및 메타데이터
- [ ] 블로그 이미지 마이그레이션
- [ ] 메타데이터 동기화
- [ ] AI 메타데이터 생성

### ✅ Phase 4: 중복 제거
- [ ] 중복 이미지 안전 제거
- [ ] 블로그 연결 이미지 보존 확인

### ✅ Phase 5: 프론트엔드 개선
- [ ] 폴더 트리 네비게이션
- [ ] 검색 및 필터링 강화
- [ ] 이미지 카드 정보 확장

---

## 🟡 후속 작업 (멀티 채널 콘텐츠 생산 안정화 후)

### Phase 6: 제품 이미지 마이그레이션
- 제품 이미지 식별 및 분류
- `originals/products/` 구조로 이동
- 제품별 메타데이터 생성

### Phase 7: 고객 콘텐츠 마이그레이션
- 고객 사진/영상 분류
- `originals/customers/` 구조로 이동
- 고객 동의 관리

### Phase 8: 기타 이미지 마이그레이션
- 팀/스태프, 이벤트, 후기, 브랜딩 이미지 분류 및 이동

---

## 📞 참고 문서

- `docs/gallery-migration-priority-plan.md`: 실전 개발 계획
- `docs/gallery-architecture-principles.md`: 아키텍처 원칙 (본 문서)

