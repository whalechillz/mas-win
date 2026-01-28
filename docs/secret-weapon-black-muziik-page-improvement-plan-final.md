# 시크리트웨폰 블랙 MUZIIK 제품 페이지 개선 최종 계획서

## 📋 개요

`mas9golf.com/secret-weapon-black-muz`의 효과적인 레이아웃 구조를 `masgolf.co.kr/products/secret-weapon-black-muziik`에 적용하여 전환율과 사용자 경험을 개선합니다.

**작업 일자**: 2026-01-27  
**대상 페이지**: `/products/secret-weapon-black-muziik`  
**참고 사이트**: `https://www.mas9golf.com/secret-weapon-black-muz`

---

## ⚠️ 중요: 제품 히어로 섹션은 유지됩니다!

**현재 제품 히어로 섹션(이미지1 부분)은 사라지지 않습니다!**

- ✅ 메인 제품 이미지 슬라이더: **유지**
- ✅ 썸네일 갤러리: **유지**
- ✅ 제품 정보 (제목, 가격, 특징): **유지**
- ✅ CTA 버튼: **유지**
- 🔄 **변경사항**: 이미지만 `detail/` → `hero/` 폴더로 이동
- 📍 **위치 변경**: 2컷 후킹 이미지와 첫 번째 CTA 섹션 **아래**로 이동

---

## 🎯 목표

1. **후킹 효과 강화**: 상단에 2컷 후킹 이미지로 즉각적인 관심 유도
2. **CTA 최적화**: 전략적 위치에 CTA 버튼 배치로 전환율 향상
3. **상세 정보 강화**: 8컷 상세 이미지로 기술 특징 시각화
4. **이미지 관리 체계화**: 상단 슬라이더와 하단 상세 이미지 분리 관리
5. **텍스트 편집 기능**: hook/detail 이미지 하단 텍스트를 관리 페이지에서 편집 가능
6. **사용자 경험 개선**: 스크롤 흐름에 맞춘 콘텐츠 배치

---

## 📊 페이지 구조 변경

### 현재 구조
```
1. 헤더
2. 제품 히어로 섹션 ← 이 부분은 유지!
   - 메인 이미지 슬라이더
   - 제품 정보
   - CTA 버튼
3. 혁신적인 테크놀로지 섹션
4. 프리미엄 디자인 섹션
5. 스펙표
6. 다른 브랜드와의 비교
7. 실제 성능 데이터
8. 실제 고객 후기
9. 리미티드 에디션
10. CTA 섹션
```

### 개선 후 구조
```
1. 헤더
2. [NEW] 2컷 후킹 이미지 섹션 ⭐ 추가
   - 티타늄 파이버 샤프트
   - FULL 티타늄 설계
3. [NEW] 첫 번째 CTA 버튼 섹션 ⭐ 추가
4. 제품 히어로 섹션 ✅ 유지 (이미지만 hero/ 폴더로 분리)
   - 메인 제품 이미지 슬라이더
   - 제품 정보
   - CTA 버튼
5. [NEW] 8컷 상세 이미지 섹션 ⭐ 추가
   - 각 기술 특징을 이미지와 함께 시각화
6. 혁신적인 테크놀로지 섹션 (기존 유지)
7. 프리미엄 디자인 섹션 (기존 유지)
8. 스펙표 (기존 유지)
9. [NEW] 두 번째 CTA 버튼 섹션 ⭐ 추가
10. 다른 브랜드와의 비교 (기존 유지)
11. 실제 성능 데이터 (기존 유지)
12. 실제 고객 후기 (기존 유지)
13. 리미티드 에디션 (기존 유지)
14. 최종 CTA 섹션 (기존 유지)
```

---

## 🗄️ 데이터베이스 스키마 확장

### products 테이블 필드 추가

**기존 필드** (이미 존재):
- `detail_images` JSONB: 상세페이지용 이미지 경로 배열
- `composition_images` JSONB: 합성용 참조 이미지 경로 배열
- `gallery_images` JSONB: AI 합성 결과 이미지 경로 배열

**신규 필드 추가**:
```sql
-- 이미지 타입별 관리 (신규)
ALTER TABLE products ADD COLUMN IF NOT EXISTS hero_images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS hook_images JSONB DEFAULT '[]';

-- 이미지별 텍스트 콘텐츠 관리 (신규)
ALTER TABLE products ADD COLUMN IF NOT EXISTS hook_content JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_content JSONB DEFAULT '[]';

COMMENT ON COLUMN products.hero_images IS '상단 슬라이더용 이미지 경로 배열 (hero/ 폴더)';
COMMENT ON COLUMN products.hook_images IS '후킹 이미지 경로 배열 (hook/ 폴더)';
COMMENT ON COLUMN products.hook_content IS '후킹 이미지별 제목/설명 (JSON 배열)';
COMMENT ON COLUMN products.detail_content IS '상세 이미지별 제목/설명 (JSON 배열)';
```

### 전체 이미지 필드 정리

| 필드명 | 폴더 | 용도 | 텍스트 편집 |
|--------|------|------|------------|
| `hero_images` | `hero/` | 상단 슬라이더 | ❌ |
| `hook_images` | `hook/` | 2컷 후킹 | ✅ (`hook_content`) |
| `detail_images` | `detail/` | 하단 상세 (8컷) | ✅ (`detail_content`) |
| `composition_images` | `composition/` | 합성용 참조 | ❌ |
| `gallery_images` | `gallery/` | AI 합성 결과 | ❌ |

### 데이터 구조 예시

**hook_content 구조**:
```json
[
  {
    "image": "hook/titanium-fiber-shaft.webp",
    "title": "티타늄 파이버 샤프트",
    "description": "일본 최고급 티타늄 그라파이트가 만들어내는 초고속 반발력의 혁신"
  },
  {
    "image": "hook/full-titanium-design.webp",
    "title": "FULL 티타늄 설계",
    "description": "모든 골퍼의 꿈을 실현하는 초경량 고탄성 샤프트"
  }
]
```

**detail_content 구조**:
```json
[
  {
    "image": "detail/impact-anti-torque.webp",
    "title": "임팩트시 역토크 방지",
    "description": "헤드의 직진성과 방향성을 향상"
  },
  {
    "image": "detail/titanium-graphite-design.webp",
    "title": "티타늄 그라파이트 설계",
    "description": "65t 카본 티타늄 시트 전장 사용"
  }
  // ... 나머지 6개
]
```

---

## 📁 이미지 관리 구조 개선

### 현재 구조
```
originals/products/secret-weapon-black-muziik/
  └── detail/
      ├── massgoo_sw_black_muz_01.webp
      ├── massgoo_sw_black_muz_01_n.webp
      └── ... (모든 이미지가 혼재)
```

### 개선 후 구조 (최종)

**제품별 폴더 구조: 총 5개 폴더**

```
originals/products/secret-weapon-black-muziik/
  ├── hero/                    # 상단 슬라이더용 이미지 ⭐ 신규
  │   ├── hero-01.webp         # 현재 detail/에서 이동
  │   ├── hero-02.webp
  │   └── ...
  ├── hook/                    # 2컷 후킹 이미지 ⭐ 신규
  │   ├── titanium-fiber-shaft.webp
  │   └── full-titanium-design.webp
  ├── detail/                  # 하단 상세 이미지 (8컷) ✅ 기존 유지
  │   ├── impact-anti-torque.webp
  │   ├── titanium-graphite-design.webp
  │   └── ... (나머지 6개)
  ├── composition/             # 합성용 참조 이미지 ✅ 기존 유지
  │   └── ... (배경 없는 순수 제품 이미지)
  └── gallery/                 # AI 합성 결과 이미지 ✅ 기존 유지
      └── ... (AI 생성 이미지)
```

### 이미지 분류 기준 (5개 폴더)

1. **hero/** 폴더 ⭐ 신규
   - **용도**: 제품 히어로 섹션의 슬라이더에 사용되는 이미지
   - **내용**: 제품 전체 사진, 다양한 각도, 배지 이미지 등
   - **마이그레이션**: 현재 `detail/` 폴더에 있는 이미지 중 상단 슬라이더에 사용할 이미지를 선택하여 `hero/`로 이동
   - **DB 필드**: `products.hero_images` JSONB

2. **hook/** 폴더 ⭐ 신규
   - **용도**: 2컷 후킹 이미지 (페이지 상단 초기 관심 유도)
   - **내용**: 티타늄 파이버 샤프트, FULL 티타늄 설계를 시각화한 이미지
   - **신규 생성**: 새로운 이미지 또는 기존 이미지에서 선택
   - **DB 필드**: `products.hook_images` JSONB, `products.hook_content` JSONB (제목/설명)

3. **detail/** 폴더 ✅ 기존 유지
   - **용도**: 하단 상세 이미지 (8컷 기술 특징 설명)
   - **내용**: 각 기술 특징을 설명하는 이미지
   - **정리**: 기존 `detail/` 폴더에서 8컷 상세 이미지만 남기고 나머지는 `hero/`로 이동
   - **DB 필드**: `products.detail_images` JSONB (기존), `products.detail_content` JSONB (신규 - 제목/설명)

4. **composition/** 폴더 ✅ 기존 유지
   - **용도**: AI 이미지 합성에 사용할 참조 이미지
   - **내용**: 배경 없는 순수 제품 이미지
   - **관리 페이지**: `/admin/product-composition`
   - **DB 필드**: `products.composition_images` JSONB (기존)

5. **gallery/** 폴더 ✅ 기존 유지
   - **용도**: AI 합성 결과 이미지 저장
   - **내용**: AI로 생성된 합성 이미지
   - **자동 저장**: AI 합성 실행 시 자동으로 이 폴더에 저장
   - **DB 필드**: `products.gallery_images` JSONB (기존)

### 폴더별 관리 페이지

| 폴더 | 관리 페이지 | 용도 | DB 필드 |
|------|-----------|------|---------|
| `hero/` | `/admin/products` → Hero 탭 | 상단 슬라이더 | `hero_images` |
| `hook/` | `/admin/products` → Hook 탭 | 2컷 후킹 | `hook_images`, `hook_content` |
| `detail/` | `/admin/products` → Detail 탭 | 하단 상세 (8컷) | `detail_images`, `detail_content` |
| `composition/` | `/admin/product-composition` | 합성용 참조 | `composition_images` |
| `gallery/` | 자동 저장 (AI 합성 결과) | AI 생성 이미지 | `gallery_images` |

### 이미지 중복 사용 관리 방법

**문제**: 같은 이미지가 여러 폴더에 모두 필요한 경우 (예: `hero/`와 `detail/`)

**해결 방안**:

1. **참조 방식 (권장)**
   - 원본 이미지는 한 폴더에만 저장 (예: `hero/`)
   - 다른 폴더에서는 메타데이터로 참조
   - `products` 테이블의 각 이미지 필드에 경로 저장
   - 예: `detail_images`에 `hero/hero-01.webp` 경로 포함 가능
   - **장점**: 저장 공간 절약, 일관성 유지

2. **복사본 생성 (대안)**
   - 같은 이미지가 두 폴더에 모두 필요한 경우 복사본 생성
   - 파일명에 접미사 추가: `hero-01.webp` → `detail-hero-01.webp`
   - **장점**: 관리가 명확함
   - **단점**: 저장 공간 사용량 증가

3. **하이브리드 방식**
   - 대부분은 참조 방식 사용
   - 특별한 경우(크롭/편집 필요)만 복사본 생성

**구현 예시**:
```typescript
// products 테이블 스키마
hero_images: JSONB DEFAULT '[]',      // ['hero/hero-01.webp', ...]
hook_images: JSONB DEFAULT '[]',      // ['hook/titanium-fiber-shaft.webp', ...]
detail_images: JSONB DEFAULT '[]',    // ['detail/impact-anti-torque.webp', 'hero/hero-01.webp', ...]
composition_images: JSONB DEFAULT '[]', // ['composition/composition-01.webp', ...]
gallery_images: JSONB DEFAULT '[]',   // ['gallery/composed-xxx.png', ...]
```

**관리 페이지 기능**:
- `/admin/products`에서 각 이미지 타입별로 관리
- "갤러리에서 선택" 기능으로 다른 폴더의 이미지도 선택 가능
- 이미지 드래그 앤 드롭으로 순서 변경
- 텍스트 편집 기능 (hook, detail)

---

## 🔧 상세 구현 계획

### 1. 2컷 후킹 이미지 섹션 추가

**위치**: 헤더 바로 아래, 제품 히어로 섹션 전

**구조**: 이미지 + 제목 + 설명 (DB에서 가져오기)

**데이터 소스**: `products.hook_content` (관리 페이지에서 편집 가능)

### 2. 첫 번째 CTA 버튼 섹션 추가

**위치**: 2컷 후킹 이미지 섹션 바로 아래

**구조**: 다크 배경 + 중앙 정렬 + 두 개의 CTA 버튼

### 3. 제품 히어로 섹션 (유지)

**위치**: 첫 번째 CTA 섹션 아래

**변경사항**:
- 이미지 경로: `detail/` → `hero/` 폴더
- 데이터 소스: `products.hero_images`
- 나머지는 모두 동일하게 유지

### 4. 8컷 상세 이미지 섹션 추가

**위치**: 제품 히어로 섹션 아래, 혁신적인 테크놀로지 섹션 전

**구조**: 각 특징을 이미지 + 제목 + 설명으로 구성 (DB에서 가져오기)

**데이터 소스**: `products.detail_content` (관리 페이지에서 편집 가능)

**8개 특징**:
1. 임팩트시 역토크 방지
2. 티타늄 그라파이트 설계
3. 혁신적인 디자인
4. 풀 티타늄 섬유
5. 2.2mm 고반발 헤드
6. 나노레벨 수지 채택
7. 짜릿한 손맛
8. 2년 헤드보증

### 5. 두 번째 CTA 버튼 섹션 추가

**위치**: 스펙표 섹션 바로 아래

**구조**: 그린 배경 + 중앙 정렬 + 두 개의 CTA 버튼

---

## 🔄 코드 수정 사항

### 1. 데이터베이스 스키마 확장

**파일**: `database/extend-products-table-for-page-content.sql` (신규 생성)

### 2. 관리 페이지 수정

**파일**: `pages/admin/products.tsx`

**추가 기능**:
1. **Hero 이미지 관리 탭**
   - 상단 슬라이더용 이미지 선택/순서 변경
   - `hero/` 폴더에서 선택

2. **Hook 이미지 관리 탭**
   - 2컷 후킹 이미지 선택
   - 각 이미지별 제목/설명 편집 가능
   - `hook/` 폴더에서 선택

3. **Detail 이미지 관리 탭** (기존 확장)
   - 8컷 상세 이미지 선택/순서 변경
   - 각 이미지별 제목/설명 편집 가능
   - `detail/` 폴더 또는 `hero/` 폴더에서 선택 가능 (중복 사용 지원)

### 3. 제품 페이지 코드 수정

**파일**: `pages/products/secret-weapon-black-muziik.tsx`

**주요 변경사항**:
1. `productImages` → `heroImages`로 변경
2. `hookImages`, `hookContent` 상태 추가
3. `detailImages`, `detailContent` 상태 추가
4. 새로운 섹션 컴포넌트 추가:
   - `HookImagesSection` (2컷 후킹) - DB에서 텍스트 가져오기
   - `FirstCTASection` (첫 번째 CTA)
   - `DetailImagesSection` (8컷 상세) - DB에서 텍스트 가져오기
   - `SecondCTASection` (두 번째 CTA)

---

## ✅ 구현 체크리스트

### Phase 1: 데이터베이스 스키마 확장
- [ ] `database/extend-products-table-for-page-content.sql` 생성
- [ ] Supabase에서 SQL 실행
  - [ ] `hero_images` 필드 추가
  - [ ] `hook_images` 필드 추가
  - [ ] `hook_content` 필드 추가
  - [ ] `detail_content` 필드 추가

### Phase 2: 이미지 준비 및 구조 설정
- [ ] `originals/products/secret-weapon-black-muziik/` 폴더 구조 생성
  - [ ] `hero/` 폴더 생성 ⭐ 신규
  - [ ] `hook/` 폴더 생성 ⭐ 신규
  - [ ] `detail/` 폴더 정리 ✅ 기존
  - [ ] `composition/` 폴더 확인 ✅ 기존 (이미 존재)
  - [ ] `gallery/` 폴더 확인 ✅ 기존 (이미 존재)
- [ ] 현재 `detail/` 폴더 이미지 분류
  - [ ] 상단 슬라이더용 → `hero/`로 이동
  - [ ] 하단 상세용 → `detail/`에 유지
- [ ] 이미지 파일 준비 및 업로드
  - [ ] hero 이미지 10개 이상 (상단 슬라이더용)
  - [ ] hook 이미지 2개 (신규 또는 기존에서 선택)
  - [ ] detail 이미지 8개 (하단 상세용, 정리)
  - [ ] composition 이미지 확인 (기존 유지)
  - [ ] gallery 이미지 확인 (AI 합성 결과, 자동 저장)

### Phase 3: 관리 페이지 개발
- [ ] `pages/admin/products.tsx` 수정
  - [ ] Hero 이미지 관리 탭 추가 (`hero/` 폴더)
  - [ ] Hook 이미지 관리 탭 추가 (`hook/` 폴더, 이미지 + 텍스트 편집)
  - [ ] Detail 이미지 관리 탭 확장 (`detail/` 폴더, 이미지 + 텍스트 편집)
  - [ ] 이미지 중복 선택 기능 (hero/detail 간 참조 지원)
  - [ ] Composition 이미지 관리 확인 (`/admin/product-composition` 기존 유지)
  - [ ] Gallery 이미지 확인 (AI 합성 결과 자동 저장 확인)
- [ ] API 수정
  - [ ] `pages/api/admin/products.ts` 수정
  - [ ] `hero_images`, `hook_images`, `hook_content`, `detail_content` 저장 로직 추가
  - [ ] 기존 `detail_images`, `composition_images`, `gallery_images` 유지

### Phase 4: 제품 페이지 코드 수정
- [ ] `lib/use-product-data.ts` 수정
  - [ ] 이미지 타입별 분리 로직 추가
  - [ ] 텍스트 콘텐츠 가져오기 로직 추가
- [ ] `pages/products/secret-weapon-black-muziik.tsx` 수정
  - [ ] HookImagesSection 컴포넌트 추가 (DB 텍스트 사용)
  - [ ] FirstCTASection 컴포넌트 추가
  - [ ] DetailImagesSection 컴포넌트 추가 (DB 텍스트 사용)
  - [ ] SecondCTASection 컴포넌트 추가
  - [ ] 섹션 순서 재배치

### Phase 5: 콘텐츠 작성 및 입력
- [ ] 관리 페이지에서 콘텐츠 입력
  - [ ] Hook 이미지 제목/설명 입력
  - [ ] Detail 이미지 제목/설명 입력
- [ ] 초기 데이터 입력
  - [ ] 기존 텍스트를 DB에 저장

### Phase 6: 테스트 및 최적화
- [ ] 모바일 반응형 테스트
- [ ] 이미지 로딩 성능 테스트
- [ ] 텍스트 편집 기능 테스트
- [ ] 이미지 중복 사용 테스트
- [ ] SEO 메타데이터 확인
- [ ] 크로스 브라우저 테스트

---

## 📅 일정

- **Phase 1**: 0.5일 (데이터베이스 스키마 확장)
- **Phase 2**: 1일 (이미지 준비 및 폴더 구조 생성)
- **Phase 3**: 2일 (관리 페이지 개발)
- **Phase 4**: 1.5일 (제품 페이지 코드 수정)
- **Phase 5**: 0.5일 (콘텐츠 작성)
- **Phase 6**: 1일 (테스트 및 최적화)

**총 예상 기간**: 6.5일

---

## 📁 최종 폴더 구조 요약

### 제품별 폴더 구조 (총 5개)

```
originals/products/{product-slug}/
  ├── hero/         ⭐ 신규 - 상단 슬라이더용
  ├── hook/         ⭐ 신규 - 2컷 후킹 이미지
  ├── detail/       ✅ 기존 - 하단 상세 이미지 (8컷)
  ├── composition/  ✅ 기존 - 합성용 참조 이미지
  └── gallery/      ✅ 기존 - AI 합성 결과 이미지
```

### 각 폴더의 역할

1. **hero/**: 제품 히어로 섹션 슬라이더 이미지
2. **hook/**: 페이지 상단 2컷 후킹 이미지 (텍스트 편집 가능)
3. **detail/**: 페이지 하단 8컷 상세 이미지 (텍스트 편집 가능)
4. **composition/**: AI 합성용 참조 이미지 (기존 시스템)
5. **gallery/**: AI 합성 결과 이미지 (자동 저장, 기존 시스템)

---

## ❓ FAQ (자주 묻는 질문)

### Q1: 현재 제품 히어로 섹션(이미지1 부분)은 없어지는 건가요?

**A**: 아니요! **완전히 유지됩니다.**

- ✅ 메인 제품 이미지 슬라이더: 그대로 유지
- ✅ 썸네일 갤러리: 그대로 유지
- ✅ 제품 정보 (제목, 가격, 특징): 그대로 유지
- ✅ CTA 버튼: 그대로 유지
- 🔄 **변경사항**: 이미지만 `detail/` → `hero/` 폴더로 이동
- 📍 **위치 변경**: 2컷 후킹 이미지와 첫 번째 CTA 섹션 **아래**로 이동

**변경 전**: 헤더 → 제품 히어로 섹션  
**변경 후**: 헤더 → 2컷 후킹 → 첫 번째 CTA → **제품 히어로 섹션** (유지)

### Q2: hook/와 detail/ 이미지 하단 텍스트를 제품 페이지에서 수정할 수 있나요?

**A**: 네, 가능합니다. 

1. **관리 페이지에서 편집**
   - `/admin/products` → 제품 선택 → "Hook 이미지" 탭
   - 각 이미지별로 제목/설명 입력 필드 제공
   - 저장 시 `products.hook_content` JSONB 필드에 저장

2. **제품 페이지에서 표시**
   - DB에서 `hook_content`, `detail_content` 가져와서 표시
   - 하드코딩된 텍스트 대신 DB 데이터 사용

3. **실시간 반영**
   - 관리 페이지에서 수정 → 저장 → 제품 페이지에 즉시 반영
   - 코드 수정 없이 콘텐츠만 변경 가능

---

## 📊 예상 효과

1. **전환율 향상**
   - 상단 후킹 이미지로 즉각적인 관심 유도
   - 전략적 CTA 배치로 구매 의도 강화

2. **사용자 경험 개선**
   - 명확한 정보 구조로 이해도 향상
   - 시각적 요소 강화로 몰입도 증가

3. **관리 효율성 향상**
   - 이미지 폴더 구조화로 관리 용이
   - 텍스트 편집 기능으로 콘텐츠 관리 용이
   - 타입별 분리로 유지보수성 향상

---

**작성일**: 2026-01-27  
**최종 수정일**: 2026-01-27  
**작성자**: AI Assistant  
**상태**: 최종 계획 단계
