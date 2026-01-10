# 샤프트 및 배지 합성 개선 계획

## 📋 현재 문제점

### 1. 이미지 합성 결과가 원본과 다름
- **문제**: 이미지1,2와 같이 넣었는데 이미지3,4처럼 구현됨 (완전히 똑같지 않음)
- **원인**: 
  - 샤프트 색상이 명시되지 않아 AI가 임의로 색상을 생성
  - 샤프트 이미지가 참조 이미지로 제공되지 않음
  - 배지 이미지가 참조 이미지로 제공되지 않음

### 2. 샤프트 색상 문제
- **문제**: 샤프트가 기본적으로 검정색이어야 하는데 다른 색으로 나옴
- **원인**: 프롬프트에 샤프트 색상 지시가 없음
- **현재 코드**: "The driver shaft can remain unchanged if visible" - 샤프트를 그대로 유지하라는 지시만 있음

### 3. 샤프트/배지 파일 누락
- **문제**: `originals/products/secret-force-pro-3/composition` 폴더에 샤프트와 배지 파일이 없음
- **원인**: 
  - 샤프트/배지 파일 업로드 기능이 없음
  - 폴더 구조에 샤프트/배지 저장 위치가 명시되지 않음

## 🎯 개선 목표

1. **샤프트 색상 명시**: 프롬프트에 검정색 샤프트 지시 추가
2. **샤프트 이미지 참조**: 샤프트 이미지를 참조 이미지로 제공
3. **배지 이미지 참조**: 배지 이미지를 참조 이미지로 제공
4. **샤프트/배지 파일 업로드**: 제품 합성 관리에서 샤프트/배지 파일 업로드 기능 추가
5. **폴더 구조 명확화**: composition 폴더 내 샤프트/배지 파일 저장 위치 정의

## 📝 개선 계획

### 1. 프롬프트 개선 (lib/product-composition.ts)

#### 1.1 샤프트 색상 명시
```typescript
// 현재 (301번 라인):
prompt += ` Maintain natural shadows and reflections that match the original lighting. The driver shaft can remain unchanged if visible. The replacement should be seamless and realistic, with the new driver head appearing as if it was originally part of the image.`;

// 개선:
prompt += ` Maintain natural shadows and reflections that match the original lighting. 

CRITICAL SHAFT COLOR INSTRUCTION:
- The driver shaft must be BLACK (matte black or dark graphite black)
- Do NOT change the shaft to any other color (no silver, gold, red, blue, or any other colors)
- The shaft should maintain its original position and angle
- If the shaft is visible, it must remain BLACK throughout its entire length
- The shaft color should match professional golf club standards: matte black graphite shaft

BADGE INSTRUCTION:
- If the product has a badge or logo on the head, ensure it matches the reference images exactly
- The badge position, size, and design must be accurate
- Do NOT add or remove badges that are not in the reference images`;
```

#### 1.2 샤프트/배지 이미지 참조 추가
```typescript
// generateCompositionPrompt 함수에 파라미터 추가
export function generateCompositionPrompt(
  product: ProductForComposition, 
  useReferenceImages: boolean = false,
  driverPart: DriverPart = 'full',
  backgroundType: 'natural' | 'studio' | 'product-page' = 'natural',
  // ✅ 추가
  shaftImageUrl?: string,  // 샤프트 이미지 URL
  badgeImageUrl?: string   // 배지 이미지 URL
): string {
  // ... 기존 코드 ...
  
  // 샤프트 이미지가 있으면 참조 지시 추가
  if (shaftImageUrl) {
    prompt += ` 

SHAFT REFERENCE:
- Use the provided shaft reference image to match the exact shaft design, color, and texture
- The shaft must be BLACK (matte black) as shown in the reference image
- Match the shaft's diameter, taper, and any graphics or logos on the shaft
- Ensure the shaft connects seamlessly to the driver head`;
  }
  
  // 배지 이미지가 있으면 참조 지시 추가
  if (badgeImageUrl) {
    prompt += ` 

BADGE REFERENCE:
- Use the provided badge reference image to match the exact badge design, position, and color
- The badge must be placed in the exact same position as shown in the reference image
- Match the badge size, shape, and any text or graphics on the badge`;
  }
}
```

### 2. 데이터베이스 스키마 확장

#### 2.1 product_composition 테이블에 샤프트/배지 필드 추가
```sql
-- 샤프트 이미지 URL
ALTER TABLE product_composition ADD COLUMN IF NOT EXISTS shaft_image_url TEXT;
COMMENT ON COLUMN product_composition.shaft_image_url IS '샤프트 이미지 URL (originals/products/{slug}/composition/shaft.webp)';

-- 배지 이미지 URL
ALTER TABLE product_composition ADD COLUMN IF NOT EXISTS badge_image_url TEXT;
COMMENT ON COLUMN product_composition.badge_image_url IS '배지 이미지 URL (originals/products/{slug}/composition/badge.webp)';

-- 샤프트 로고 이미지 URL (선택)
ALTER TABLE product_composition ADD COLUMN IF NOT EXISTS shaft_logo_image_url TEXT;
COMMENT ON COLUMN product_composition.shaft_logo_image_url IS '샤프트 로고 이미지 URL (originals/products/{slug}/composition/shaft-logo.webp)';
```

### 3. 제품 합성 관리 UI 개선

#### 3.1 샤프트/배지 이미지 업로드 섹션 추가
```typescript
// pages/admin/product-composition.tsx

// 상태 추가
const [shaftImageUrl, setShaftImageUrl] = useState<string>('');
const [badgeImageUrl, setBadgeImageUrl] = useState<string>('');
const [shaftLogoImageUrl, setShaftLogoImageUrl] = useState<string>('');

// 샤프트 이미지 업로드 핸들러
const handleShaftImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !formData.slug || !formData.category) {
    alert('제품 정보(Slug, 카테고리)를 먼저 입력해주세요.');
    return;
  }

  const formDataToUpload = new FormData();
  formDataToUpload.append('file', file);
  formDataToUpload.append('productSlug', formData.slug);
  formDataToUpload.append('category', formData.category);
  formDataToUpload.append('imageType', 'composition');
  formDataToUpload.append('preserveFilename', 'true'); // 파일명 유지
  formDataToUpload.append('customFileName', 'shaft'); // 커스텀 파일명: shaft.webp

  // ... 업로드 로직 ...
};

// 배지 이미지 업로드 핸들러
const handleBadgeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  // ... 유사한 로직 ...
  formDataToUpload.append('customFileName', 'badge'); // 커스텀 파일명: badge.webp
};
```

#### 3.2 UI에 샤프트/배지 업로드 섹션 추가
```tsx
{/* 샤프트 이미지 관리 */}
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    샤프트 이미지 (선택)
  </label>
  <div className="flex gap-2">
    {shaftImageUrl && (
      <div className="relative w-32 h-32 bg-gray-100 rounded overflow-hidden border-2 border-gray-300">
        <Image src={getAbsoluteImageUrl(shaftImageUrl)} alt="샤프트" fill className="object-contain" />
      </div>
    )}
    <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
      {shaftImageUrl ? '샤프트 변경' : '샤프트 업로드'}
      <input type="file" accept="image/*" onChange={handleShaftImageUpload} className="hidden" />
    </label>
    {shaftImageUrl && (
      <button onClick={() => setShaftImageUrl('')} className="px-4 py-2 bg-red-600 text-white rounded-lg">
        삭제
      </button>
    )}
  </div>
  <p className="text-xs text-gray-500 mt-1">
    💡 샤프트 이미지 권장 사이즈: 2000x2000px 이상, 투명 배경 PNG 또는 WebP
  </p>
</div>

{/* 배지 이미지 관리 */}
<div className="mt-4">
  <label className="block text-sm font-medium text-gray-700 mb-1">
    배지 이미지 (선택)
  </label>
  {/* 유사한 UI */}
</div>
```

### 4. 합성 API 개선 (pages/api/compose-product-image.js)

#### 4.1 샤프트/배지 이미지를 참조 이미지로 추가
```javascript
// 샤프트 이미지가 있으면 참조 이미지에 추가
if (product.shaft_image_url) {
  const shaftUrl = getAbsoluteProductImageUrl(product.shaft_image_url);
  if (shaftUrl) {
    imageUrls.push(shaftUrl);
    console.log('✅ 샤프트 이미지 추가:', shaftUrl);
  }
}

// 배지 이미지가 있으면 참조 이미지에 추가
if (product.badge_image_url) {
  const badgeUrl = getAbsoluteProductImageUrl(product.badge_image_url);
  if (badgeUrl) {
    imageUrls.push(badgeUrl);
    console.log('✅ 배지 이미지 추가:', badgeUrl);
  }
}

// 프롬프트 생성 시 샤프트/배지 이미지 URL 전달
let compositionPrompt = prompt || generateCompositionPrompt(
  product, 
  hasReferenceImages,
  targetDriverPart,
  compositionBackground,
  product.shaft_image_url,  // ✅ 추가
  product.badge_image_url   // ✅ 추가
);
```

### 5. 파일 업로드 API 개선

#### 5.1 커스텀 파일명 지원 추가
```javascript
// pages/api/admin/upload-product-image.js

const customFileName = fields.customFileName?.[0]; // 'shaft', 'badge' 등

if (customFileName) {
  // 커스텀 파일명 사용
  webpFileName = `${customFileName}.webp`;
} else if (preserveFilename) {
  // 기존 로직
} else {
  // 기본 로직
}
```

## 📁 폴더 구조

### 샤프트/배지 파일 저장 위치
```
originals/products/{product-slug}/composition/
├── shaft.webp              # 샤프트 이미지 (검정색)
├── shaft-logo.webp         # 샤프트 로고 (선택)
├── badge.webp              # 배지 이미지
└── [기타 참조 이미지들]
```

### 파일명 규칙
- **샤프트**: `shaft.webp` (고정)
- **샤프트 로고**: `shaft-logo.webp` (선택)
- **배지**: `badge.webp` (고정)

## 🎨 샤프트 이미지 사양

### 권장 사양
- **크기**: 2000x2000px 이상 (고해상도)
- **형식**: PNG (투명 배경) 또는 WebP
- **색상**: 검정색 (matte black 또는 dark graphite black)
- **각도**: 측면 뷰 (side view) 권장
- **배경**: 투명 또는 단색 배경

### 샤프트 로고 사양
- **크기**: 500x500px 이상
- **형식**: PNG (투명 배경)
- **위치**: 샤프트 중간 또는 하단에 위치한 로고만

## 🔧 구현 단계

### Phase 1: 프롬프트 개선
1. ✅ 샤프트 색상 명시 추가
2. ✅ 배지 지시 추가
3. ✅ 샤프트/배지 이미지 참조 파라미터 추가

### Phase 2: 데이터베이스 확장
1. ✅ `product_composition` 테이블에 샤프트/배지 필드 추가
2. ✅ 기존 제품 데이터 마이그레이션

### Phase 3: UI 개선
1. ✅ 샤프트 이미지 업로드 섹션 추가
2. ✅ 배지 이미지 업로드 섹션 추가
3. ✅ 샤프트/배지 이미지 표시 및 삭제 기능

### Phase 4: API 개선
1. ✅ 업로드 API에 커스텀 파일명 지원 추가
2. ✅ 합성 API에 샤프트/배지 이미지 참조 추가
3. ✅ 프롬프트 생성 시 샤프트/배지 URL 전달

## ✅ 체크리스트

- [ ] 프롬프트에 샤프트 색상 명시 추가
- [ ] 프롬프트에 배지 지시 추가
- [ ] 데이터베이스에 샤프트/배지 필드 추가
- [ ] 제품 합성 관리 UI에 샤프트/배지 업로드 섹션 추가
- [ ] 업로드 API에 커스텀 파일명 지원 추가
- [ ] 합성 API에 샤프트/배지 이미지 참조 추가
- [ ] 샤프트/배지 이미지 사양 문서화
