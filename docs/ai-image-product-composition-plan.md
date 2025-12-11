# AI 이미지 제품 합성 시스템 구현 계획서

## 📋 프로젝트 개요

모델이 골프 드라이버를 들고 있는 AI 생성 이미지에 마쓰구 드라이버 제품을 자연스럽게 합성하여, 마쓰구 제품을 홍보하는 고품질 마케팅 이미지를 자동으로 생성하는 시스템을 구축합니다.

**생성일**: 2025-01-XX  
**최종 업데이트**: 2025-01-XX  
**버전**: 1.1  
**상태**: 계획 단계 (API 스펙 확인 완료)

**업데이트 내역**:
- v1.1: FAL AI 공식 API 문서 반영 (`@fal-ai/client` 라이브러리, `image_urls` 배열 지원)
- v1.0: 초기 계획 문서 작성

---

## 🎯 목표

1. **자동화된 제품 합성**: AI로 생성된 모델 이미지에 7가지 마쓰구 드라이버 제품을 자연스럽게 합성
2. **고품질 결과물**: 나노바나나(Nano Banana) AI 기술을 활용한 사실적인 합성 이미지 생성
3. **사용자 친화적 UI**: 간단한 클릭만으로 제품 선택 및 합성 수행
4. **확장 가능한 구조**: 향후 추가 제품이나 기능 확장이 용이한 아키텍처

---

## 🔍 기술 조사 결과

### 1. 나노바나나 (Nano Banana)

**플랫폼**: FAL AI  
**모델**: 
- `nano-banana-pro/edit` (image-to-image) - **추천**
- `nano-banana/edit` (image-to-image)

**특징**:
- Google Gemini 2.5 Flash 기반
- 자연어 프롬프트로 이미지 편집 가능
- 이미지 합성 및 제품 통합 기능 제공
- FAL AI를 통해 API 접근 가능

**API 엔드포인트**:
```
fal-ai/nano-banana-pro/edit
```

**클라이언트 라이브러리**:
- `@fal-ai/client` (최신, 권장)
- `@fal-ai/serverless-client` (deprecated)

**API 문서**: [https://fal.ai/models/fal-ai/nano-banana-pro/edit/api](https://fal.ai/models/fal-ai/nano-banana-pro/edit/api)

**장점**:
- ✅ 이미 시스템에 FAL AI 통합됨
- ✅ API 제공으로 자동화 가능
- ✅ 자연스러운 합성 품질
- ✅ 빠른 처리 속도 (10-30초)

### 2. 대안 기술

**FAL AI Inpainting**: 
- 제품 합성 전용 기능은 불명확
- 추가 조사 필요

**Google AI Studio 직접 접근**:
- API 접근성 불명확
- 웹 자동화 필요 시 복잡도 증가

---

## 📦 지원 제품 목록 (7개)

### 1. 시크리트포스 골드 2 MUZIIK
- **ID**: `gold2-sapphire`
- **카테고리**: MUZIIK 협업 제품
- **가격**: 2,200,000원
- **특징**: 오토플렉스 티타늄 샤프트, ONE-FLEX A200·A215
- **배지**: NEW, BEST
- **이미지 경로**: `/main/products/gold2-sapphire/massgoo_sf_gold2_muz_01.webp`

### 2. 시크리트웨폰 블랙 MUZIIK
- **ID**: `black-beryl`
- **카테고리**: MUZIIK 협업 제품
- **가격**: 2,200,000원
- **특징**: 풀 티타늄 4X 샤프트, 40g대, 최대 X 플렉스
- **배지**: NEW, LIMITED
- **이미지 경로**: `/main/products/black-beryl/massgoo_sw_black_muz_01.webp`

### 3. 시크리트포스 골드 2
- **ID**: `gold2`
- **카테고리**: 프리미엄 드라이버
- **가격**: 1,700,000원
- **특징**: DAT55G+ Grade 5 티타늄, 2.2mm 초박형 페이스, COR 0.87
- **배지**: BEST
- **이미지 경로**: `/main/products/gold2/gold2_01.jpg`

### 4. 시크리트포스 PRO 3
- **ID**: `pro3`
- **카테고리**: 고반발 드라이버
- **가격**: 1,150,000원
- **특징**: DAT55G 티타늄, 2.3mm 페이스, COR 0.86
- **이미지 경로**: `/main/products/secret-force-pro3.webp`

### 5. 시크리트포스 V3
- **ID**: `v3`
- **카테고리**: 투어 드라이버
- **가격**: 950,000원
- **특징**: DAT55G 티타늄, 2.4mm 페이스, COR 0.85
- **이미지 경로**: `/main/products/secret-force-v3.webp`

### 6. 시크리트웨폰 블랙
- **ID**: `weapon-black`
- **카테고리**: 프리미엄 리미티드
- **가격**: 1,700,000원
- **특징**: SP700 Grade 5 티타늄, 2.2mm 초박형 페이스, COR 0.87
- **배지**: LIMITED
- **이미지 경로**: `/main/products/secret-weapon-black.webp`

### 7. 시크리트웨폰 골드 4.1
- **ID**: `weapon-gold-4-1`
- **카테고리**: 프리미엄 드라이버
- **가격**: 1,700,000원
- **특징**: SP700 Grade 5 티타늄, 2.2mm 초박형 페이스, COR 0.87
- **이미지 경로**: `/main/products/secret-weapon-4-1.webp`

---

## 🏗️ 시스템 아키텍처

### 전체 플로우

```
[사용자 입력]
    ↓
[AI 이미지 생성] (기존 기능)
    ↓
[제품 선택] (새 기능)
    ↓
[나노바나나 합성 API] (새 기능)
    ↓
[결과 이미지 저장] (기존 기능)
    ↓
[갤러리 표시]
```

### 데이터 흐름

1. **모델 이미지 생성**: 기존 `/api/kakao-content/generate-images` API 사용
2. **제품 선택**: 사용자가 7개 제품 중 선택
3. **합성 요청**: `/api/compose-product-image` API 호출
4. **나노바나나 처리**: FAL AI를 통해 이미지 합성
5. **결과 저장**: Supabase Storage에 저장
6. **메타데이터 기록**: 제품 정보 포함하여 메타데이터 생성

---

## 📁 파일 구조

### 새로 생성할 파일

```
lib/
  └── product-composition.ts          # 제품 데이터베이스 및 유틸리티

components/admin/
  └── ProductSelector.tsx             # 제품 선택 UI 컴포넌트

pages/api/
  └── compose-product-image.js        # 제품 합성 API 엔드포인트

pages/admin/
  └── ai-image-generator.tsx          # 수정: 제품 합성 기능 추가
```

### 수정할 파일

```
pages/admin/ai-image-generator.tsx    # 제품 합성 옵션 추가
lib/product-composition.ts             # 제품 데이터 관리
```

---

## 🛠️ 구현 계획

### Phase 1: 제품 데이터베이스 구축 (1일)

**목표**: 7개 제품 정보를 체계적으로 관리할 수 있는 데이터 구조 생성

**작업 내용**:
1. `lib/product-composition.ts` 파일 생성
2. 제품 인터페이스 정의
3. 7개 제품 데이터 입력
4. 제품 조회 유틸리티 함수 작성

**파일 구조**:
```typescript
export interface ProductForComposition {
  id: string;
  name: string;
  displayName: string;
  category: string;
  imageUrl: string;
  slug: string;
  badge?: string;
  description?: string;
  price?: string;
  features?: string[];
}

export const PRODUCTS_FOR_COMPOSITION: ProductForComposition[] = [
  // 7개 제품 데이터
];
```

---

### Phase 2: 제품 합성 API 구현 (2-3일)

**목표**: 나노바나나를 사용한 제품 합성 API 엔드포인트 생성

**작업 내용**:
1. `pages/api/compose-product-image.js` 생성
2. `@fal-ai/client` 라이브러리 설치 및 설정
3. FAL AI 나노바나나 API 통합 (`fal.subscribe()` 또는 `fal.queue.submit()` 사용)
4. 폴링 로직 구현 (필요 시)
5. 에러 처리 및 재시도 로직
6. Supabase 저장 로직

**필수 패키지 설치**:
```bash
npm install --save @fal-ai/client
```

**환경 변수 설정**:
```bash
FAL_KEY=your_fal_api_key_here
```

**API 스펙**:
```javascript
POST /api/compose-product-image

Request Body:
{
  modelImageUrl: string,      // 생성된 모델 이미지 URL (필수)
  productId: string,           // 제품 ID (7개 중 하나, 필수)
  productImageUrl?: string,    // 제품 이미지 URL (선택, 제공 시 더 정확한 합성)
  compositionMethod?: string,  // 'nano-banana-pro' | 'nano-banana' | 'auto'
  prompt?: string,             // 커스텀 프롬프트 (선택)
  numImages?: number,          // 생성할 이미지 개수 (기본값: 1)
  resolution?: string,         // '1K' | '2K' | '4K' (기본값: '1K')
  aspectRatio?: string,       // 'auto' | '1:1' | '16:9' 등 (기본값: 'auto')
  outputFormat?: string        // 'png' | 'jpeg' | 'webp' (기본값: 'png')
}

Response:
{
  success: boolean,
  imageUrl: string,
  path: string,
  product: ProductForComposition,
  metadata: {
    composedAt: string,
    method: string,
    processingTime: number
  }
}
```

**나노바나나 API 호출 예시**:

**방법 1: @fal-ai/client 라이브러리 사용 (권장)**:
```javascript
import { fal } from "@fal-ai/client";

// 환경 변수 설정: FAL_KEY
const result = await fal.subscribe("fal-ai/nano-banana-pro/edit", {
  input: {
    prompt: `Replace the golf driver in the person's hands with the ${product.name}, maintaining natural lighting, shadows, and seamless integration. The driver should look realistic and naturally held.`,
    image_urls: [
      modelImageUrl,        // 모델 이미지
      product.imageUrl     // 제품 이미지 (선택사항)
    ],
    num_images: 1,
    aspect_ratio: "auto",
    output_format: "png",
    resolution: "1K"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});

// 결과: result.data.images[0].url
```

**방법 2: Queue API 사용 (비동기 처리)**:
```javascript
import { fal } from "@fal-ai/client";

// 요청 제출
const { request_id } = await fal.queue.submit("fal-ai/nano-banana-pro/edit", {
  input: {
    prompt: `Replace the golf driver...`,
    image_urls: [modelImageUrl, product.imageUrl],
    num_images: 1,
    resolution: "1K"
  },
  webhookUrl: "https://optional.webhook.url/for/results",
});

// 상태 확인 및 결과 조회
const status = await fal.queue.status("fal-ai/nano-banana-pro/edit", {
  requestId: request_id,
  logs: true,
});

const result = await fal.queue.result("fal-ai/nano-banana-pro/edit", {
  requestId: request_id
});
```

**중요 참고사항**:
- ✅ `image_urls`는 배열로 여러 이미지를 받을 수 있음
- ✅ 모델 이미지와 제품 이미지를 모두 전달하면 더 정확한 합성 가능 (권장)
- ✅ `@fal-ai/client` 라이브러리 필수 설치 (`@fal-ai/serverless-client`는 deprecated)
- ✅ `FAL_KEY` 환경 변수 설정 필수
- ✅ `fal.subscribe()`는 동기 처리, `fal.queue.submit()`은 비동기 처리
- 📖 [FAL AI API 문서](https://fal.ai/models/fal-ai/nano-banana-pro/edit/api)

---

### Phase 3: UI 컴포넌트 개발 (2일)

**목표**: 사용자가 쉽게 제품을 선택하고 합성을 수행할 수 있는 UI 구축

**작업 내용**:
1. `components/admin/ProductSelector.tsx` 생성
2. 제품 그리드 레이아웃
3. 제품 이미지 미리보기
4. 선택 상태 표시
5. 반응형 디자인

**컴포넌트 구조**:
```typescript
interface ProductSelectorProps {
  selectedProductId?: string;
  onSelect: (productId: string) => void;
  showDescription?: boolean;
  layout?: 'grid' | 'list';
}
```

**UI 특징**:
- 7개 제품을 그리드로 표시 (2-4열 반응형)
- 각 제품 카드에 이미지, 이름, 배지 표시
- 선택된 제품 하이라이트
- 호버 효과 및 애니메이션

---

### Phase 4: AI 이미지 생성 페이지 통합 (2일)

**목표**: 기존 AI 이미지 생성 페이지에 제품 합성 기능 통합

**작업 내용**:
1. `pages/admin/ai-image-generator.tsx` 수정
2. 제품 합성 옵션 토글 추가
3. 제품 선택 UI 통합
4. 합성 메서드 선택 옵션
5. 생성 플로우 수정 (이미지 생성 → 제품 합성)

**UI 변경사항**:
- "제품 합성 활성화" 토글 스위치 추가
- 제품 선택 섹션 추가 (토글 활성화 시 표시)
- 합성 메서드 선택 드롭다운
- 합성 진행 상태 표시
- 합성된 이미지 결과 표시

**플로우 수정**:
```typescript
const handleGenerate = async () => {
  // 1. 모델 이미지 생성 (기존 로직)
  const modelImages = await generateModelImages();
  
  // 2. 제품 합성 (새 기능)
  if (formData.enableProductComposition && formData.selectedProductId) {
    for (const modelImage of modelImages) {
      const composed = await composeProductImage({
        modelImageUrl: modelImage.url,
        productId: formData.selectedProductId,
        method: formData.compositionMethod
      });
      // 합성된 이미지 추가
    }
  }
};
```

---

### Phase 5: 테스트 및 최적화 (2-3일)

**목표**: 시스템 안정성 확보 및 성능 최적화

**테스트 항목**:
1. **기능 테스트**:
   - 각 제품별 합성 테스트
   - 다양한 모델 이미지로 테스트
   - 에러 케이스 처리 확인

2. **성능 테스트**:
   - API 응답 시간 측정
   - 동시 요청 처리
   - 메모리 사용량 확인

3. **품질 테스트**:
   - 합성 이미지 품질 평가
   - 자연스러움 검증
   - 조명/그림자 일관성 확인

4. **사용자 테스트**:
   - UI/UX 개선사항 수집
   - 워크플로우 최적화

**최적화 작업**:
- 프롬프트 최적화 (제품별 맞춤 프롬프트)
- 캐싱 전략 (제품 이미지 캐싱)
- 배치 처리 (여러 제품 동시 합성)
- `image_urls` 배열 활용 (모델 이미지 + 제품 이미지 동시 전달로 정확도 향상)

---

## 📊 API 설계 상세

### 1. 제품 합성 API

**엔드포인트**: `POST /api/compose-product-image`

**요청 예시**:
```json
{
  "modelImageUrl": "https://.../generated-model-image.jpg",
  "productId": "gold2-sapphire",
  "productImageUrl": "https://.../product-image.jpg",
  "compositionMethod": "nano-banana-pro",
  "prompt": "커스텀 프롬프트 (선택)",
  "numImages": 1,
  "resolution": "1K",
  "aspectRatio": "auto"
}
```

**참고**: 
- `productImageUrl`을 제공하면 모델 이미지와 제품 이미지를 모두 전달하여 더 정확한 합성 가능
- 나노바나나 API는 `image_urls` 배열로 여러 이미지를 받을 수 있음

**응답 예시**:
```json
{
  "success": true,
  "imageUrl": "https://.../composed-image.jpg",
  "path": "originals/composed/2025-01/xxx.jpg",
  "product": {
    "id": "gold2-sapphire",
    "name": "시크리트포스 골드 2 MUZIIK",
    "displayName": "시크리트포스 골드 2 MUZIIK"
  },
  "metadata": {
    "composedAt": "2025-01-XXT...",
    "method": "nano-banana-pro",
    "processingTime": 25000,
    "description": "AI가 생성한 이미지 설명"
  },
  "falResult": {
    "images": [
      {
        "url": "https://.../composed-image.jpg",
        "file_name": "nano-banana-edit-output.png",
        "content_type": "image/png",
        "width": 1024,
        "height": 1024
      }
    ],
    "description": "AI가 생성한 이미지 설명"
  }
}
```

**FAL AI 응답 구조**:
- `images`: 배열 형태 (여러 이미지 생성 가능)
- 각 이미지 객체: `url`, `file_name`, `content_type`, `width`, `height` 포함
- `description`: AI가 생성한 이미지 설명

**에러 응답**:
```json
{
  "success": false,
  "error": "에러 메시지",
  "code": "ERROR_CODE"
}
```

---

### 2. 제품 목록 조회 API (선택사항)

**엔드포인트**: `GET /api/products-for-composition`

**응답 예시**:
```json
{
  "products": [
    {
      "id": "gold2-sapphire",
      "name": "시크리트포스 골드 2 MUZIIK",
      "imageUrl": "/main/products/...",
      "badge": "BEST"
    },
    // ... 7개 제품
  ]
}
```

---

## 🎨 UI/UX 설계

### 1. 제품 선택 UI

**레이아웃**:
- 그리드 형식: 2-4열 반응형
- 각 카드 크기: 150x200px (모바일), 200x250px (데스크톱)

**카드 구성**:
```
┌─────────────────┐
│  [제품 이미지]   │
│                 │
│  제품명         │
│  [배지]         │
└─────────────────┘
```

**상호작용**:
- 클릭 시 선택/해제
- 선택된 카드: 파란색 테두리 + 배경색
- 호버 시 확대 효과

### 2. 합성 옵션 UI

**토글 스위치**:
```
[ ] 제품 합성 활성화
    └─ 제품 선택 UI 표시/숨김
```

**메서드 선택**:
```
합성 방법: [nano-banana-pro ▼]
  - nano-banana-pro (고품질, 추천)
  - nano-banana (빠른 처리)
  - auto (자동 선택)
```

### 3. 진행 상태 표시

**단계별 표시**:
```
1. 모델 이미지 생성 중... ✓
2. 제품 합성 중... (진행 중)
   └─ 시크리트포스 골드 2 MUZIIK 합성 중...
```

---

## 🔄 워크플로우

### 사용자 시나리오

1. **AI 이미지 생성 페이지 접속**
   - `/admin/ai-image-generator` 이동

2. **이미지 생성 설정**
   - 프롬프트 입력
   - 브랜딩 톤 선택
   - 이미지 타입 선택

3. **제품 합성 활성화**
   - "제품 합성 활성화" 토글 ON
   - 제품 선택 UI 표시

4. **제품 선택**
   - 7개 제품 중 원하는 제품 클릭
   - 합성 메서드 선택 (선택사항)

5. **이미지 생성 및 합성**
   - "이미지 생성하기" 버튼 클릭
   - 모델 이미지 생성 (1단계)
   - 제품 합성 수행 (2단계)

6. **결과 확인**
   - 합성된 이미지 확인
   - 필요 시 다운로드 또는 갤러리에 저장

---

## 📝 프롬프트 전략

### 기본 프롬프트 템플릿

```
Replace the golf driver in the person's hands with the {PRODUCT_NAME}, maintaining natural lighting, shadows, and seamless integration. The driver should look realistic and naturally held, with proper perspective and proportions matching the person's grip.
```

### 이미지 전달 전략

**전략 1: 모델 이미지만 전달** (간단)
```javascript
image_urls: [modelImageUrl]
```
- 모델 이미지만 전달
- 프롬프트로 제품 설명에 의존
- 빠르지만 정확도 낮을 수 있음

**전략 2: 모델 이미지 + 제품 이미지 전달** (권장)
```javascript
image_urls: [modelImageUrl, productImageUrl]
```
- 모델 이미지와 제품 이미지를 모두 전달
- 나노바나나가 제품 이미지를 참고하여 더 정확한 합성
- **추천**: 더 자연스러운 결과물 기대

### 제품별 맞춤 프롬프트 (선택사항)

**MUZIIK 제품**:
```
Replace the golf driver in the person's hands with the {PRODUCT_NAME} featuring the MUZIIK titanium shaft. Maintain natural lighting, shadows, and seamless integration. The driver should look realistic and naturally held, with the distinctive MUZIIK shaft design visible.
```

**프리미엄 제품**:
```
Replace the golf driver in the person's hands with the premium {PRODUCT_NAME}, maintaining natural lighting, shadows, and seamless integration. The driver should look realistic and naturally held, with the premium finish and design details clearly visible.
```

---

## 🧪 테스트 계획

### 단위 테스트

1. **제품 데이터 로딩**
   - 모든 제품이 정상적으로 로드되는지 확인
   - 제품 ID로 조회 기능 테스트

2. **API 엔드포인트**
   - 요청/응답 형식 검증
   - 에러 케이스 처리 확인

### 통합 테스트

1. **전체 플로우 테스트**
   - 모델 이미지 생성 → 제품 합성 → 저장
   - 각 단계별 에러 처리

2. **제품별 합성 테스트**
   - 7개 제품 모두 테스트
   - 품질 평가 및 비교

### 사용자 테스트

1. **UI/UX 테스트**
   - 제품 선택 편의성
   - 진행 상태 표시 명확성
   - 에러 메시지 이해도

2. **성능 테스트**
   - 대량 이미지 처리
   - 동시 요청 처리

---

## 🚀 배포 계획

### 개발 환경

1. **로컬 테스트**
   - FAL AI API 키 설정
   - 샘플 이미지로 테스트

2. **스테이징 환경**
   - Vercel Preview 배포
   - 실제 제품 이미지로 테스트

### 프로덕션 배포

1. **단계적 배포**
   - Phase 1-2 먼저 배포 (데이터베이스 + API)
   - Phase 3-4 배포 (UI 통합)
   - Phase 5 배포 (최적화)

2. **모니터링**
   - API 응답 시간 모니터링
   - 에러 로그 추적
   - 사용량 통계 수집

---

## 📈 향후 확장 계획

### 단기 (1-2개월)

1. **일괄 처리 기능**
   - 하나의 모델 이미지로 7개 제품 모두 합성
   - 배치 다운로드 기능

2. **프롬프트 최적화**
   - 제품별 맞춤 프롬프트 자동 생성
   - ChatGPT를 통한 프롬프트 최적화

### 중기 (3-6개월)

1. **추가 제품 지원**
   - 아이언, 웨지 등 다른 클럽 추가
   - 제품 카테고리 확장

2. **고급 합성 옵션**
   - 합성 강도 조절
   - 배경 변경 옵션
   - 다중 제품 합성

### 장기 (6개월+)

1. **AI 모델 교체/추가**
   - 다른 AI 모델 지원
   - 모델 성능 비교 기능

2. **자동화 워크플로우**
   - 스케줄링된 자동 생성
   - 마케팅 캠페인 자동화

---

## ⚠️ 주의사항 및 제약사항

### 기술적 제약

1. **FAL AI API 제한**
   - API 호출 제한 확인 필요
   - 비용 관리 중요
   - `@fal-ai/client` 라이브러리 사용 필수

2. **이미지 품질**
   - 원본 모델 이미지 품질에 의존
   - 제품 이미지 해상도 중요
   - `image_urls` 배열로 여러 이미지 전달 시 더 정확한 합성 가능

3. **처리 시간**
   - 나노바나나 처리 시간: 10-30초
   - 대량 처리 시 시간 소요
   - `sync_mode` 옵션으로 동기/비동기 처리 선택 가능

4. **입력 파라미터**
   - `image_urls`: 배열 형태, 여러 이미지 동시 전달 가능
   - `resolution`: "1K", "2K", "4K" 선택 가능 (기본값: "1K")
   - `aspect_ratio`: 자동 또는 특정 비율 선택 가능

### 비즈니스 제약

1. **비용 관리**
   - FAL AI 사용량 모니터링
   - 비용 예산 설정

2. **품질 관리**
   - 합성 결과 수동 검토 권장
   - 자동 품질 평가 시스템 고려

---

## 📚 참고 자료

### FAL AI 문서
- [FAL AI Dashboard](https://fal.ai/dashboard)
- [Nano Banana Pro Edit API](https://fal.ai/models/fal-ai/nano-banana-pro/edit/api)
- [@fal-ai/client 라이브러리](https://www.npmjs.com/package/@fal-ai/client)
- [FAL AI 파일 업로드 가이드](https://fal.ai/docs/guide/file-uploads)

### 관련 문서
- `/docs/project_plan.md` - 프로젝트 전체 계획
- `/docs/simple-ai-image-improvement-guide.md` - AI 이미지 개선 가이드
- `/pages/admin/ai-image-generator.tsx` - 기존 AI 이미지 생성 페이지

---

## ✅ 체크리스트

### Phase 1: 데이터베이스
- [ ] `lib/product-composition.ts` 생성
- [ ] 7개 제품 데이터 입력
- [ ] 유틸리티 함수 작성
- [ ] 타입 정의 완료

### Phase 2: API 구현
- [ ] `@fal-ai/client` 패키지 설치
- [ ] `pages/api/compose-product-image.js` 생성
- [ ] FAL AI 나노바나나 통합 (`fal.subscribe()` 사용)
- [ ] `image_urls` 배열 처리 (모델 이미지 + 제품 이미지)
- [ ] 폴링 로직 구현 (필요 시)
- [ ] 에러 처리 구현
- [ ] Supabase 저장 로직

### Phase 3: UI 컴포넌트
- [ ] `components/admin/ProductSelector.tsx` 생성
- [ ] 제품 그리드 레이아웃
- [ ] 선택 상태 관리
- [ ] 반응형 디자인

### Phase 4: 페이지 통합
- [ ] `ai-image-generator.tsx` 수정
- [ ] 제품 합성 옵션 추가
- [ ] 플로우 수정
- [ ] 상태 관리 개선

### Phase 5: 테스트 및 최적화
- [ ] 기능 테스트 완료
- [ ] 성능 테스트 완료
- [ ] 품질 검증 완료
- [ ] 문서화 완료

---

## 📞 문의 및 지원

**개발 담당**: AI Development Team  
**문서 관리**: `/docs/ai-image-product-composition-plan.md`  
**최종 업데이트**: 2025-01-XX

---

**다음 단계**: Phase 1부터 순차적으로 구현 시작

---

## 🎨 배경 제어 옵션 (향후 구현)

### 배경 타입 옵션

모자 합성 시 배경을 제어할 수 있는 옵션:

1. **자연 배경 (natural)** - 기본값
   - 기존 배경 유지
   - 프롬프트: "Keep the original background exactly as it is."

2. **스튜디오 (studio)**
   - 깔끔한 스튜디오 배경
   - 프롬프트: "The background should be a professional studio setting with clean, neutral background (white, gray, or subtle gradient). Professional product photography style with even lighting, no distracting elements."

3. **상품페이지 스튜디오 (product-page)**
   - 화이트/그레이 배경의 제품 사진 스타일
   - 프롬프트: "The background should be a professional product photography studio setting with clean, minimalist background (white or light gray). High-end e-commerce product page style with professional lighting, soft shadows, and no distracting elements. The person should be positioned as if modeling the product for a product catalog or e-commerce website."

### 구현 계획

- [ ] `generateCompositionPrompt` 함수에 `backgroundType` 파라미터 추가
- [ ] AI 이미지 생성기 UI에 배경 선택 옵션 추가 (모자 합성 시에만 표시)
- [ ] API에 `compositionBackground` 파라미터 추가
- [ ] 프롬프트에 배경 지시 추가

