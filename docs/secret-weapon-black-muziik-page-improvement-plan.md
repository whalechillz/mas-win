# 시크리트웨폰 블랙 MUZIIK 제품 페이지 개선 계획서

## 📋 개요

`mas9golf.com/secret-weapon-black-muz`의 효과적인 레이아웃 구조를 `masgolf.co.kr/products/secret-weapon-black-muziik`에 적용하여 전환율과 사용자 경험을 개선합니다.

**작업 일자**: 2026-01-27  
**대상 페이지**: `/products/secret-weapon-black-muziik`  
**참고 사이트**: `https://www.mas9golf.com/secret-weapon-black-muz`

---

## 🎯 목표

1. **후킹 효과 강화**: 상단에 2컷 후킹 이미지로 즉각적인 관심 유도
2. **CTA 최적화**: 전략적 위치에 CTA 버튼 배치로 전환율 향상
3. **상세 정보 강화**: 8컷 상세 이미지로 기술 특징 시각화
4. **이미지 관리 체계화**: 상단 슬라이더와 하단 상세 이미지 분리 관리
5. **사용자 경험 개선**: 스크롤 흐름에 맞춘 콘텐츠 배치

---

## 📊 현재 vs 개선 구조 비교

### mas9golf.com 구조 (참고)
```
1. 헤더
2. [이미지1] 2컷 후킹 이미지
   - 티타늄 파이버 샤프트
   - FULL 티타늄 설계
3. [이미지2] CTA 버튼 섹션
4. [이미지3] 8컷 상세 이미지
   - 임팩트시 역토크 방지
   - 티타늄 그라파이트 설계
   - 혁신적인 디자인
   - 풀 티타늄 섬유
   - 2.2mm 고반발 헤드
   - 나노레벨 수지 채택
   - 짜릿한 손맛
   - 2년 헤드보증
5. [이미지4] 스펙표
6. [이미지5] CTA 버튼 (반복)
```

### masgolf.co.kr 현재 구조
```
1. 헤더
2. 제품 히어로 섹션 (이미지 슬라이더 + 제품 정보) ← 이 부분은 유지됩니다!
3. 혁신적인 테크놀로지 섹션 (3개 카드)
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
   - 제품 정보 (제목, 가격, 특징)
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

### ⚠️ 중요: 제품 히어로 섹션은 유지됩니다!

**현재 제품 히어로 섹션 (이미지1 부분)**:
- ✅ **유지됨**: 메인 제품 이미지, 썸네일 갤러리, 제품 정보, CTA 버튼 모두 그대로 유지
- 🔄 **변경사항**: 이미지만 `detail/` → `hero/` 폴더로 이동
- 📍 **위치**: 2컷 후킹 이미지 섹션과 첫 번째 CTA 섹션 **아래**에 배치

**변경 전후 비교**:
- **변경 전**: 헤더 → 제품 히어로 섹션
- **변경 후**: 헤더 → 2컷 후킹 → 첫 번째 CTA → **제품 히어로 섹션** (유지)

---

## 🔧 상세 구현 계획

### 1. 2컷 후킹 이미지 섹션 추가

**위치**: 헤더 바로 아래, 제품 히어로 섹션 전

**구조**:
```tsx
<section className="py-16 bg-black">
  {/* 첫 번째 후킹 이미지 */}
  <div className="container mx-auto px-4 max-w-7xl">
    <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
      <div className="relative h-96 rounded-lg overflow-hidden">
        <Image src="/originals/products/secret-weapon-black-muziik/hook/titanium-fiber-shaft.webp" />
      </div>
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-bold text-white mb-4">티타늄 파이버 샤프트</h2>
        <p className="text-lg text-gray-300">
          일본 최고급 티타늄 그라파이트가 만들어내는 초고속 반발력의 혁신
        </p>
      </div>
    </div>
    
    {/* 두 번째 후킹 이미지 */}
    <div className="grid md:grid-cols-2 gap-8 items-center">
      <div className="relative h-96 rounded-lg overflow-hidden order-2 md:order-1">
        <Image src="/originals/products/secret-weapon-black-muziik/hook/full-titanium-design.webp" />
      </div>
      <div className="text-center md:text-left order-1 md:order-2">
        <h2 className="text-3xl font-bold text-white mb-4">FULL 티타늄 설계</h2>
        <p className="text-lg text-gray-300">
          모든 골퍼의 꿈을 실현하는 초경량 고탄성 샤프트
        </p>
      </div>
    </div>
  </div>
</section>
```

**이미지 경로**:
- `/originals/products/secret-weapon-black-muziik/hook/titanium-fiber-shaft.webp`
- `/originals/products/secret-weapon-black-muziik/hook/full-titanium-design.webp`

**설명 텍스트**:
- **첫 번째**: "티타늄 파이버 샤프트" - "일본 최고급 티타늄 그라파이트가 만들어내는 초고속 반발력의 혁신"
- **두 번째**: "FULL 티타늄 설계" - "모든 골퍼의 꿈을 실현하는 초경량 고탄성 샤프트"

---

### 2. 첫 번째 CTA 버튼 섹션 추가

**위치**: 2컷 후킹 이미지 섹션 바로 아래

**구조**:
```tsx
<section className="py-16 bg-gradient-to-br from-gray-900 via-black to-gray-900">
  <div className="container mx-auto px-4 max-w-7xl text-center">
    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
      프리미엄 마쓰구 드라이버
    </h2>
    <p className="text-lg sm:text-xl text-gray-300 mb-8">
      지금 상담 받고 특별 혜택을 경험하세요!
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="tel:080-028-8888" className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors font-bold text-lg">
        080-028-8888 무료 상담하기
      </a>
      <a href="https://smartstore.naver.com/mas9golf/products/12606826152" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg">
        네이버 스마트스토어에서 구매하기
      </a>
    </div>
  </div>
</section>
```

**디자인**:
- 다크 배경 (검은색 그라데이션)
- 중앙 정렬
- 두 개의 CTA 버튼 (전화 상담, 스마트스토어 구매)
- 모바일 반응형 (세로 배치)

---

### 3. 8컷 상세 이미지 섹션 추가

**위치**: 제품 히어로 섹션 아래, 혁신적인 테크놀로지 섹션 전

**구조**: 각 특징을 이미지와 텍스트로 구성한 8개 섹션

**8개 특징**:
1. **임팩트시 역토크 방지** - "헤드의 직진성과 방향성을 향상"
2. **티타늄 그라파이트 설계** - "65t 카본 티타늄 시트 전장 사용"
3. **혁신적인 디자인** - "세련된 라인과 우아한 엔지니어링"
4. **풀 티타늄 섬유** - "경량이면서도 초고탄성을 실현. 휨 복원과 임팩트시 안정감"
5. **2.2mm 고반발 헤드** - "최상의 반발력, 정확한 티샷"
6. **나노레벨 수지 채택** - "카본 밀도 향상으로 폭발적인 반발성"
7. **짜릿한 손맛** - "탄성 그립으로 전달되는 환상적인 타구음"
8. **2년 헤드보증** - "마쓰구의 기술력을 오래 사용하세요"

**레이아웃**: 
- 2열 그리드 (모바일: 1열)
- 각 항목: 이미지(왼쪽/오른쪽 교차) + 제목 + 설명
- 다크 배경

**구조 예시**:
```tsx
<section className="py-16 bg-black">
  <div className="container mx-auto px-4 max-w-7xl">
    <div className="space-y-16">
      {/* 항목 1 */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="relative h-64 rounded-lg overflow-hidden">
          <Image src="/originals/products/secret-weapon-black-muziik/detail/impact-anti-torque.webp" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">임팩트시 역토크 방지</h3>
          <p className="text-gray-300">헤드의 직진성과 방향성을 향상</p>
        </div>
      </div>
      
      {/* 항목 2 - 이미지와 텍스트 위치 교차 */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="order-2 md:order-1">
          <h3 className="text-2xl font-bold text-white mb-4">티타늄 그라파이트 설계</h3>
          <p className="text-gray-300">65t 카본 티타늄 시트 전장 사용</p>
        </div>
        <div className="relative h-64 rounded-lg overflow-hidden order-1 md:order-2">
          <Image src="/originals/products/secret-weapon-black-muziik/detail/titanium-graphite-design.webp" />
        </div>
      </div>
      
      {/* ... 나머지 6개 항목 */}
    </div>
  </div>
</section>
```

**이미지 경로**:
- `/originals/products/secret-weapon-black-muziik/detail/impact-anti-torque.webp`
- `/originals/products/secret-weapon-black-muziik/detail/titanium-graphite-design.webp`
- `/originals/products/secret-weapon-black-muziik/detail/innovative-design.webp`
- `/originals/products/secret-weapon-black-muziik/detail/full-titanium-fiber.webp`
- `/originals/products/secret-weapon-black-muziik/detail/2.2mm-high-rebound-head.webp`
- `/originals/products/secret-weapon-black-muziik/detail/nano-level-resin.webp`
- `/originals/products/secret-weapon-black-muziik/detail/exhilarating-feel-grip.webp`
- `/originals/products/secret-weapon-black-muziik/detail/2-year-head-warranty.webp`

---

### 4. 두 번째 CTA 버튼 섹션 추가

**위치**: 스펙표 섹션 바로 아래

**구조**: 첫 번째 CTA 섹션과 동일하지만 약간 다른 문구 사용

```tsx
<section className="py-16 bg-gradient-to-br from-green-600 to-green-700">
  <div className="container mx-auto px-4 max-w-7xl text-center">
    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
      지금 바로 구매하고 특별 혜택을 받으세요!
    </h2>
    <p className="text-lg sm:text-xl text-green-100 mb-8">
      장비 전문가가 직접 상담해드립니다
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="tel:080-028-8888" className="bg-white text-green-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg">
        080-028-8888 무료 상담하기
      </a>
      <a href="https://smartstore.naver.com/mas9golf/products/12606826152" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg">
        네이버 스마트스토어에서 구매하기
      </a>
    </div>
  </div>
</section>
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

### 개선 후 구조
```
originals/products/secret-weapon-black-muziik/
  ├── hero/                    # 상단 슬라이더용 이미지
  │   ├── hero-01.webp
  │   ├── hero-02.webp
  │   └── ...
  ├── hook/                    # 2컷 후킹 이미지
  │   ├── titanium-fiber-shaft.webp
  │   └── full-titanium-design.webp
  └── detail/                  # 하단 상세 이미지 (8컷)
      ├── impact-anti-torque.webp
      ├── titanium-graphite-design.webp
      ├── innovative-design.webp
      ├── full-titanium-fiber.webp
      ├── 2.2mm-high-rebound-head.webp
      ├── nano-level-resin.webp
      ├── exhilarating-feel-grip.webp
      └── 2-year-head-warranty.webp
```

### 이미지 분류 기준

1. **hero/** 폴더
   - 제품 히어로 섹션의 슬라이더에 사용되는 이미지
   - 제품 전체 사진, 다양한 각도, 배지 이미지 등
   - 용도: 상단 메인 제품 표시
   - **마이그레이션**: 현재 `detail/` 폴더에 있는 이미지 중 상단 슬라이더에 사용할 이미지를 선택하여 `hero/`로 이동

2. **hook/** 폴더
   - 2컷 후킹 이미지
   - 티타늄 파이버 샤프트, FULL 티타늄 설계를 시각화한 이미지
   - 용도: 초기 관심 유도
   - **신규 생성**: 새로운 이미지 또는 기존 이미지에서 선택

3. **detail/** 폴더
   - 8컷 상세 이미지
   - 각 기술 특징을 설명하는 이미지
   - 용도: 상세 정보 제공
   - **정리**: 기존 `detail/` 폴더에서 8컷 상세 이미지만 남기고 나머지는 `hero/`로 이동

### 이미지 중복 사용 관리 방법

**문제**: 같은 이미지가 `hero/`와 `detail/`에 모두 필요한 경우

**해결 방안**:

1. **참조 방식 (권장)**
   - 원본 이미지는 한 폴더에만 저장 (예: `hero/`)
   - 다른 폴더에서는 메타데이터로 참조
   - `products` 테이블의 `hero_images`, `detail_images` 필드에 경로 저장
   - 예: `detail_images`에 `hero/hero-01.webp` 경로 포함 가능

2. **복사본 생성 (대안)**
   - 같은 이미지가 두 폴더에 모두 필요한 경우 복사본 생성
   - 파일명에 접미사 추가: `hero-01.webp` → `detail-hero-01.webp`
   - 저장 공간 사용량 증가하지만 관리가 명확함

3. **하이브리드 방식**
   - 대부분은 참조 방식 사용
   - 특별한 경우(크롭/편집 필요)만 복사본 생성

**구현 예시**:
```typescript
// products 테이블 스키마 확장
hero_images: JSONB DEFAULT '[]',      // ['hero/hero-01.webp', ...]
hook_images: JSONB DEFAULT '[]',      // ['hook/titanium-fiber-shaft.webp', ...]
detail_images: JSONB DEFAULT '[]',    // ['detail/impact-anti-torque.webp', 'hero/hero-01.webp', ...]
```

**관리 페이지**:
- `/admin/products`에서 각 이미지 타입별로 관리
- "갤러리에서 선택" 기능으로 다른 폴더의 이미지도 선택 가능
- 이미지 드래그 앤 드롭으로 순서 변경

---

## 🗄️ 데이터베이스 스키마 확장

### products 테이블 필드 추가

**필요한 필드**:
```sql
-- 이미지 타입별 관리
ALTER TABLE products ADD COLUMN IF NOT EXISTS hero_images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS hook_images JSONB DEFAULT '[]';
-- detail_images는 이미 존재 (기존 필드 활용)

-- 이미지별 텍스트 콘텐츠 관리
ALTER TABLE products ADD COLUMN IF NOT EXISTS hook_content JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_content JSONB DEFAULT '[]';
```

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
  },
  // ... 나머지 6개
]
```

---

## 🔄 코드 수정 사항

### 1. 데이터베이스 스키마 확장

**파일**: `database/extend-products-table-for-page-content.sql` (신규 생성)

```sql
-- 이미지 타입별 관리
ALTER TABLE products ADD COLUMN IF NOT EXISTS hero_images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS hook_images JSONB DEFAULT '[]';

-- 이미지별 텍스트 콘텐츠 관리
ALTER TABLE products ADD COLUMN IF NOT EXISTS hook_content JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_content JSONB DEFAULT '[]';

COMMENT ON COLUMN products.hero_images IS '상단 슬라이더용 이미지 경로 배열';
COMMENT ON COLUMN products.hook_images IS '후킹 이미지 경로 배열';
COMMENT ON COLUMN products.hook_content IS '후킹 이미지별 제목/설명 (JSON 배열)';
COMMENT ON COLUMN products.detail_content IS '상세 이미지별 제목/설명 (JSON 배열)';
```

### 2. `useProductData` 훅 수정

**현재**: 모든 이미지를 `detail/` 폴더에서 가져옴

**개선**: 이미지 타입별로 분리하여 가져오기 + 텍스트 콘텐츠 포함

```typescript
// lib/use-product-data.ts 수정 필요
export function useProductData(productId: string, defaultImages: string[]) {
  // 제품 데이터 가져오기 (DB에서)
  const product = useProduct(productId);
  
  // hero 이미지 (products.hero_images 또는 폴더에서)
  const heroImages = product?.hero_images?.length > 0 
    ? product.hero_images 
    : useProductImages(`${productId}/hero`);
  
  // hook 이미지 + 콘텐츠
  const hookData = product?.hook_content || [];
  const hookImages = product?.hook_images?.length > 0 
    ? product.hook_images 
    : useProductImages(`${productId}/hook`);
  
  // detail 이미지 + 콘텐츠
  const detailData = product?.detail_content || [];
  const detailImages = product?.detail_images?.length > 0 
    ? product.detail_images 
    : useProductImages(`${productId}/detail`);
  
  return {
    heroImages,
    hookImages,
    hookContent: hookData,  // 제목/설명 포함
    detailImages,
    detailContent: detailData,  // 제목/설명 포함
    // ... 기존 반환값
  };
}
```

### 3. 컴포넌트 구조 변경

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

### 4. 관리 페이지 수정

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

**UI 예시**:
```tsx
// Hook 이미지 편집
<div className="space-y-4">
  {hookImages.map((item, index) => (
    <div key={index} className="border p-4 rounded">
      <Image src={item.image} />
      <input 
        value={item.title} 
        onChange={(e) => updateHookTitle(index, e.target.value)}
        placeholder="제목"
      />
      <textarea 
        value={item.description} 
        onChange={(e) => updateHookDescription(index, e.target.value)}
        placeholder="설명"
      />
    </div>
  ))}
</div>
```

---

## 📝 부가 설명 추가 계획

### 현재 내용에 추가할 부가 설명

1. **티타늄 파이버 샤프트 섹션**
   - 현재: "일본 최고급 티타늄 그라파이트가 만들어내는 초고속 반발력의 혁신"
   - 추가 설명:
     - "65t 카본 티타늄 시트를 전장에 사용하여 최고의 성능 실현"
     - "일본 MUZIIK의 독자 기술로 제작된 프리미엄 샤프트"

2. **FULL 티타늄 설계 섹션**
   - 현재: "모든 골퍼의 꿈을 실현하는 초경량 고탄성 샤프트"
   - 추가 설명:
     - "40g대 경량화로 스윙 속도 향상"
     - "최대 X(Extra Stiff) 플렉스까지 지원"
     - "휨 복원력과 임팩트 안정감의 완벽한 조화"

3. **8컷 상세 이미지 각 항목별 추가 설명**
   - 각 기술 특징에 대한 구체적인 수치와 효과 추가
   - 예: "2.2mm 고반발 헤드" → "COR 0.87 수준의 최상의 반발력"

---

## 🎨 디자인 가이드라인

### 색상
- **배경**: 다크 테마 (검은색, 그라데이션)
- **텍스트**: 흰색, 회색 계열
- **강조**: 초록색 (MASSGOO 브랜드 컬러), 파란색 (CTA)

### 타이포그래피
- **제목**: 2xl ~ 4xl, Bold
- **부제목**: xl ~ 2xl, Bold
- **본문**: base ~ lg, Regular

### 간격
- **섹션 간**: py-16 (64px)
- **항목 간**: gap-8 (32px)
- **내부 여백**: p-6 ~ p-8

### 반응형
- **모바일**: 1열 레이아웃
- **태블릿**: 2열 레이아웃
- **데스크톱**: 2~3열 레이아웃

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
  - [ ] `hero/` 폴더 생성
  - [ ] `hook/` 폴더 생성
  - [ ] `detail/` 폴더 정리
- [ ] 현재 `detail/` 폴더 이미지 분류
  - [ ] 상단 슬라이더용 → `hero/`로 이동
  - [ ] 하단 상세용 → `detail/`에 유지
- [ ] 이미지 파일 준비 및 업로드
  - [ ] hero 이미지 10개 이상
  - [ ] hook 이미지 2개 (신규 또는 기존에서 선택)
  - [ ] detail 이미지 8개 (정리)

### Phase 3: 관리 페이지 개발
- [ ] `pages/admin/products.tsx` 수정
  - [ ] Hero 이미지 관리 탭 추가
  - [ ] Hook 이미지 관리 탭 추가 (이미지 + 텍스트 편집)
  - [ ] Detail 이미지 관리 탭 확장 (이미지 + 텍스트 편집)
  - [ ] 이미지 중복 선택 기능 (hero/detail 간 참조)
- [ ] API 수정
  - [ ] `pages/api/admin/products.ts` 수정
  - [ ] `hero_images`, `hook_images`, `hook_content`, `detail_content` 저장 로직 추가

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

## 📊 예상 효과

1. **전환율 향상**
   - 상단 후킹 이미지로 즉각적인 관심 유도
   - 전략적 CTA 배치로 구매 의도 강화

2. **사용자 경험 개선**
   - 명확한 정보 구조로 이해도 향상
   - 시각적 요소 강화로 몰입도 증가

3. **관리 효율성 향상**
   - 이미지 폴더 구조화로 관리 용이
   - 타입별 분리로 유지보수성 향상

---

## 🔗 참고 자료

- **참고 사이트**: https://www.mas9golf.com/secret-weapon-black-muz
- **대상 페이지**: https://www.masgolf.co.kr/products/secret-weapon-black-muziik
- **이미지 관리**: `/originals/products/secret-weapon-black-muziik/`

---

## 📅 일정

- **Phase 1**: 1일 (이미지 준비)
- **Phase 2**: 2일 (코드 수정)
- **Phase 3**: 1일 (콘텐츠 작성)
- **Phase 4**: 1일 (테스트 및 최적화)

**총 예상 기간**: 5일

---

## 📝 추가 고려사항

1. **이미지 최적화**
   - WebP 포맷 사용
   - 적절한 해상도 (최대 1920px)
   - 압축 최적화

2. **접근성**
   - alt 텍스트 작성
   - 키보드 네비게이션 지원
   - 스크린 리더 호환성

3. **성능**
   - 이미지 lazy loading
   - 적절한 이미지 크기
   - CDN 활용

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

### Q2: 현재 detail 이미지를 hero로 옮기는 건가요?

**A**: 현재 `detail/` 폴더에 있는 이미지 중에서:
- **상단 슬라이더에 사용할 이미지** → `hero/` 폴더로 이동
- **하단 상세 섹션에 사용할 이미지** → `detail/` 폴더에 유지

즉, 이미지를 **분류하여 이동**하는 것이지, 모든 이미지를 옮기는 것이 아닙니다.

### Q3: 같은 이미지가 hero와 detail에 모두 필요한 경우는?

**A**: 두 가지 방법이 있습니다:

1. **참조 방식 (권장)**
   - 원본은 `hero/` 폴더에만 저장
   - `detail_images` 배열에 `hero/hero-01.webp` 경로 포함
   - 파일 복사 없이 메타데이터로 참조

2. **복사본 생성**
   - 같은 이미지를 두 폴더에 복사
   - 파일명 구분: `hero/hero-01.webp` → `detail/hero-01-copy.webp`

관리 페이지에서 "갤러리에서 선택" 기능으로 다른 폴더의 이미지도 선택할 수 있습니다.

### Q4: hook/와 detail/ 이미지 하단 텍스트를 제품 페이지에서 수정할 수 있나요?

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

**예시**:
```
관리 페이지:
- 이미지: hook/titanium-fiber-shaft.webp
- 제목: "티타늄 파이버 샤프트" (편집 가능)
- 설명: "일본 최고급..." (편집 가능)

제품 페이지:
- DB에서 가져온 제목/설명 자동 표시
```

---

**작성일**: 2026-01-27  
**수정일**: 2026-01-27 (이미지 관리 및 텍스트 편집 기능 추가)  
**작성자**: AI Assistant  
**상태**: 계획 단계
