# 📁 Supabase Storage 폴더 패턴 유지 관리 가이드

## 🎯 목적
이 문서는 "MASGOLF 통합 콘텐츠 및 자산 마이그레이션 프로젝트"의 모든 Phase에서 일관되게 사용해야 하는 Supabase Storage 폴더 패턴을 정의합니다.

**중요**: 모든 이미지 마이그레이션 및 정리 작업 시 이 패턴을 반드시 준수해야 합니다.

---

## 📋 전체 Storage 구조

```
masgolf-images/
├── originals/                    # 원본 이미지 (물리적 파일)
│   ├── blog/                     # 블로그 이미지
│   │   └── YYYY-MM/
│   │       └── {blog-id}/
│   │
│   ├── campaigns/                # 월별 퍼널 이미지
│   │   ├── 2025-05/
│   │   ├── 2025-06/
│   │   ├── 2025-07/
│   │   ├── 2025-08/
│   │   └── 2025-09/
│   │
│   ├── products/                 # 제품 이미지
│   │   ├── secret-force-gold-2/
│   │   │   ├── studio/
│   │   │   ├── detail/
│   │   │   ├── specs/
│   │   │   └── gallery/
│   │   ├── secret-force-pro-3/
│   │   ├── secret-force-v3/
│   │   ├── secret-weapon-black/
│   │   ├── secret-weapon-4-1/
│   │   ├── muziik-sapphire/
│   │   ├── muziik-beryl/
│   │   └── muziik-technology/
│   │
│   ├── branding/                 # 브랜딩 이미지
│   │   ├── massgoo/              # MASSGOO 브랜드 (마쓰구 드라이버)
│   │   │   └── hero/             # 홈페이지 히어로 이미지 (Phase 7)
│   │   └── muziik/
│   │
│   ├── website/                  # 웹사이트 전용 이미지 (Phase 7)
│   │   └── homepage/             # 홈페이지 이미지
│   │       └── hero/             # 히어로 이미지 (대안: branding/massgoo/hero/)
│   │
│   ├── locations/                # 매장 이미지 (후속 작업)
│   ├── customers/                # 고객 콘텐츠 (후속 작업)
│   ├── team/                     # 팀/스태프 이미지 (후속 작업)
│   ├── events/                   # 이벤트/행사 이미지 (후속 작업)
│   ├── testimonials/             # 후기/리뷰 이미지 (후속 작업)
│   ├── uploaded/                 # 직접 업로드
│   │   └── YYYY-MM-DD/
│   └── ai-generated/             # AI 생성 원본
│       └── YYYY-MM-DD/
│
├── variants/                     # 채널별 최적화 버전
│   └── {image-uuid}/
│       ├── webp/
│       ├── jpg/
│       └── channels/
│
└── references/                   # 참조 메타데이터 (JSON)
    ├── blog/{post-id}/
    ├── funnel/{funnel-id}/
    ├── website/{page-id}/
    └── sms/{campaign-id}/
```

---

## 📁 각 폴더 상세 패턴

### 1. `originals/blog/` - 블로그 이미지

**패턴**: `originals/blog/YYYY-MM/{blog-id}/`

**예시**:
- `originals/blog/2025-01/309/`
- `originals/blog/2025-07/88/`

**규칙**:
- 날짜 형식: `YYYY-MM` (4자리 연도-2자리 월)
- 블로그 ID: 숫자 또는 문자열
- 파일명: `{uuid}-{seo-filename}.ext`

**사용 시점**: Phase 1-5, Phase 11

---

### 2. `originals/campaigns/` - 월별 퍼널 이미지

**패턴**: `originals/campaigns/YYYY-MM/`

**예시**:
- `originals/campaigns/2025-05/`
- `originals/campaigns/2025-06/`
- `originals/campaigns/2025-07/`
- `originals/campaigns/2025-08/`
- `originals/campaigns/2025-09/`

**규칙**:
- 날짜 형식: `YYYY-MM` (4자리 연도-2자리 월)
- 월별 폴더에 직접 배치 (하위 폴더 선택적)
- 파일명: `{uuid}-{seo-filename}.ext`

**A/B 테스트 파일 고려사항**:
- A/B 테스트 파일도 같은 월 폴더에 저장
- 예: `funnel-2025-08-live-a.html`, `funnel-2025-08-live-b.html` → 모두 `originals/campaigns/2025-08/`

**사용 시점**: Phase 8

---

### 3. `originals/products/` - 제품 이미지

**패턴**: `originals/products/{product-slug}/`

**하위 폴더 패턴** (선택적):
- `{product-slug}/studio/` - 스튜디오 이미지
- `{product-slug}/detail/` - 상세페이지용
- `{product-slug}/specs/` - 스팩표 이미지
- `{product-slug}/gallery/` - 갤러리 이미지

**예시**:
- `originals/products/secret-force-gold-2/studio/`
- `originals/products/secret-force-gold-2/detail/`
- `originals/products/muziik-sapphire/`

**제품 목록 (MASGOLF)**:
- `secret-force-gold-2/`
- `secret-force-pro-3/`
- `secret-force-v3/`
- `secret-weapon-black/`
- `secret-weapon-4-1/`

**제품 목록 (MUZIIK)**:
- `muziik-sapphire/`
- `muziik-beryl/`
- `muziik-technology/`

**규칙**:
- 제품 슬러그: 소문자, 하이픈 구분
- 하위 폴더는 선택적 (필요 시에만 생성)
- 파일명: `{uuid}-{seo-filename}.ext`

**사용 시점**: Phase 9, Phase 10

---

### 4. `originals/branding/` - 브랜딩 이미지

**패턴**: `originals/branding/{brand-name}/`

**하위 폴더 패턴** (선택적):
- `{brand-name}/hero/` - 히어로 이미지 (홈페이지 메인 이미지)
- `{brand-name}/logo/` - 로고 이미지
- `{brand-name}/graphics/` - 그래픽 자산

**예시**:
- `originals/branding/massgoo/` (MASSGOO 브랜드)
- `originals/branding/massgoo/hero/`
- `originals/branding/muziik/`

**규칙**:
- 브랜드명: 소문자
- 로고, 브랜드 컬러, 그래픽 자산 포함
- 히어로 이미지는 `hero/` 하위 폴더에 저장 가능 (Phase 7)
- 파일명: `{uuid}-{seo-filename}.ext`

**사용 시점**: Phase 7 (홈페이지 히어로 이미지), Phase 10 (브랜딩 이미지)

---

### 5. `originals/website/` - 웹사이트 전용 이미지 (Phase 7)

**패턴**: `originals/website/{page-type}/`

**하위 폴더 패턴**:
- `homepage/hero/` - 홈페이지 히어로 이미지
- `homepage/sections/` - 홈페이지 섹션별 이미지

**예시**:
- `originals/website/homepage/hero/`
- `originals/website/homepage/sections/`

**규칙**:
- 페이지 타입: `homepage`, `about`, `contact` 등
- 히어로 이미지는 `branding/massgoo/hero/`에 저장하는 것도 가능 (선택)
- 파일명: `{uuid}-{seo-filename}.ext`

**참고**: 홈페이지 히어로 이미지는 `originals/branding/massgoo/hero/` 또는 `originals/website/homepage/hero/` 중 선택 가능

**사용 시점**: Phase 7

---

### 6. `originals/uploaded/` - 직접 업로드

**패턴**: `originals/uploaded/YYYY-MM-DD/`

**예시**:
- `originals/uploaded/2025-01-15/`

**규칙**:
- 날짜 형식: `YYYY-MM-DD` (4자리 연도-2자리 월-2자리 일)
- 갤러리에서 직접 업로드한 이미지
- 파일명: `{uuid}-{seo-filename}.ext`

**사용 시점**: 모든 Phase (갤러리 직접 업로드)

---

### 7. `originals/ai-generated/` - AI 생성 원본

**패턴**: `originals/ai-generated/YYYY-MM-DD/`

**예시**:
- `originals/ai-generated/2025-01-15/`

**규칙**:
- 날짜 형식: `YYYY-MM-DD`
- AI로 생성된 이미지 원본
- 파일명: `{uuid}-{seo-filename}.ext`

**사용 시점**: Phase 11 (AI 생성 이미지 정리)

---

### 8. `variants/` - 채널별 최적화 버전 (로딩 속도 & Storage 최적화)

**패턴**: `variants/{image-uuid}/`

**하위 폴더 패턴**:
- `{image-uuid}/format/webp/` - WebP 변환 (웹 최적화)
- `{image-uuid}/format/jpg/` - JPG 변환 (SMS/MMS, 호환성)
- `{image-uuid}/channels/sms/` - SMS/MMS 전용 (JPG)
- `{image-uuid}/channels/instagram/` - Instagram 전용 (WebP)
- `{image-uuid}/channels/facebook/` - Facebook 전용 (WebP)
- `{image-uuid}/channels/naver-blog/` - 네이버 블로그 전용 (WebP)
- `{image-uuid}/channels/kakao-channel/` - 카카오 채널 전용 (WebP)

**Format 폴더 사이즈 (로딩 속도 & Storage 최적화)**:
- `thumbnail.webp/jpg`: 300x300 (1:1, 썸네일, 빠른 로딩)
- `small.webp/jpg`: 600x400 (3:2, 모바일, 균형잡힌 품질)
- `medium.webp/jpg`: 1200x800 (3:2, 태블릿/일반, 표준)
- `large.webp/jpg`: 1920x1280 (3:2, 데스크톱, 최대)

**Channels 폴더 사이즈**:
- SMS/MMS: `standard.jpg` (600x400), `hd.jpg` (1200x800)
- Instagram: `square.webp` (1080x1080), `portrait.webp` (1080x1350), `story.webp` (1080x1920)
- Facebook: `post.webp` (1200x630), `cover.webp` (820x312)
- 네이버 블로그: `thumbnail.webp` (600x400), `content.webp` (1200x800)
- 카카오 채널: `content.webp` (1200x800)

**품질 설정 (용도별)**:
- **썸네일 (Thumbnail)**:
  - WebP: 80% (빠른 로딩, 시각적 차이 거의 없음)
  - JPG: 80% (SMS/MMS용)
- **일반 웹 콘텐츠 (Small/Medium)**:
  - WebP: 85% (균형잡힌 품질과 파일 크기)
  - JPG: 85% (SMS/MMS용)
- **고품질 필요 (Large, 제품 이미지, 프리미엄 콘텐츠)**:
  - WebP: 90% (시각적 품질 우선, 파일 크기 약 30-50% 증가)
  - JPG: 90% (인쇄물, 고품질 필요 시)
- **채널별 특화**:
  - Instagram: WebP 90% (소셜 미디어 고품질)
  - Facebook: WebP 85% (균형)
  - 네이버 블로그: WebP 85% (본문), 80% (썸네일)
  - SMS/MMS: JPG 85% (표준), 90% (고화질 MMS)

**규칙**:
- UUID: 원본 이미지의 UUID 사용
- 원본은 절대 이동/삭제하지 않음
- 베리에이션만 생성
- WebP 우선 정책 (JPG는 SMS/MMS용으로만)
- 기존 이미지는 그대로 유지 (리사이징 불필요)
- 새로 업로드되는 이미지만 variants 생성
- 필요 시에만 variants 생성 (온디맨드)

**사용 시점**: 모든 Phase (채널별 최적화 필요 시)

---

### 9. `references/` - 참조 메타데이터

**패턴**: `references/{type}/{id}/`

**예시**:
- `references/blog/309/{image-uuid}.json`
- `references/funnel/2025-05/{image-uuid}.json`

**규칙**:
- 타입: `blog`, `funnel`, `website`, `sms`
- ID: 블로그 글 ID, 퍼널 ID 등
- JSON 파일로 메타데이터만 저장

**사용 시점**: 모든 Phase (참조 정보 관리)

---

## 🔧 파일명 패턴

### 기본 파일명 형식

**패턴**: `{uuid}-{seo-filename}.ext`

**예시**:
- `61a1f1fe-9a92-48ea-ba00-8e5221871975-fittingexperiencecoupon.jpg`
- `81310a5e-9cec-4e4b-9340-329367e249ed-seniorgolferswinging1080x1350.jpg`

**규칙**:
- UUID: 36자리 UUID (하이픈 포함)
- SEO 파일명: 소문자, 하이픈 구분, 특수문자 제거
- 확장자: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.mp4`

**SEO 파일명 생성 규칙**:
1. 원본 파일명에서 확장자 제거
2. 소문자 변환
3. 특수문자 제거 (하이픈, 공백은 하이픈으로 변환)
4. 연속된 하이픈을 하나로 통합
5. 앞뒤 하이픈 제거

---

## 📋 폴더 생성 규칙

### Supabase Storage 폴더 생성 방법

Supabase Storage는 빈 폴더를 지원하지 않으므로, `.keep.png` 마커 파일을 사용합니다.

**패턴**: `{folder-path}/.keep.png`

**예시**:
- `originals/campaigns/2025-05/.keep.png`
- `originals/products/secret-force-gold-2/studio/.keep.png`

**규칙**:
1. 폴더 생성 시 `.keep.png` 마커 파일 업로드
2. 실제 이미지가 업로드되면 `.keep.png`는 유지해도 되고 삭제해도 됨
3. 폴더가 비어있으면 갤러리에서 보이지 않을 수 있으므로, 필요 시 `.keep.png` 유지

---

## ⚠️ 폴더 패턴 준수 체크리스트

### 새 폴더 생성 시
- [ ] 패턴 문서 확인 (`docs/folder-pattern-guide.md`)
- [ ] 올바른 경로 형식 사용 (`originals/{category}/{subfolder}/`)
- [ ] 날짜 형식 확인 (`YYYY-MM` 또는 `YYYY-MM-DD`)
- [ ] 제품 슬러그 형식 확인 (소문자, 하이픈 구분)
- [ ] `.keep.png` 마커 파일 생성 (필요 시)

### 이미지 업로드 시
- [ ] 올바른 폴더 경로 사용
- [ ] 파일명 형식 준수 (`{uuid}-{seo-filename}.ext`)
- [ ] UUID 생성 및 추가
- [ ] SEO 파일명 생성

### 이미지 이동 시
- [ ] 목표 폴더 패턴 확인
- [ ] 메타데이터 업데이트 (`file_path`, `cdn_url`)
- [ ] 모든 참조 업데이트 (블로그, 퍼널 등)

---

## 🔗 관련 문서

- **메인 계획서**: `docs/project_plan.md`
- **아키텍처 원칙**: `docs/gallery-architecture-principles.md`
- **Phase 세부 계획서**: `docs/phases/detailed-plans/`

---

## 📝 업데이트 이력

- **2025-01-XX**: 초기 작성
- **2025-01-XX**: Phase 8 보강 (5월-9월, A/B 테스트 포함)
- **2025-01-XX**: Phase 7 홈페이지 폴더 구조 추가 (`originals/branding/massgoo/hero/`, `originals/website/homepage/hero/`)

---

## 💡 참고 사항

### 폴더 패턴 변경 시
1. 이 문서 업데이트
2. 관련 Phase 계획서 업데이트
3. 기존 이미지 마이그레이션 계획 수정
4. 팀 공유

### 새 카테고리 추가 시
1. 이 문서에 패턴 추가
2. `docs/gallery-architecture-principles.md` 업데이트
3. 관련 Phase 계획서 업데이트
