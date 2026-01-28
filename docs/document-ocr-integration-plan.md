# 문서 OCR 통합 계획서

## 📋 개요

고객 이미지 관리 시스템에 문서 OCR(Optical Character Recognition) 기능을 추가하여, 스캔된 문서 이미지에서 텍스트를 자동으로 추출하고 메타데이터를 생성하는 기능을 구현합니다.

**생성일**: 2026-01-28  
**버전**: 1.0  
**상태**: 계획 단계

---

## 🎯 목표

1. **문서 텍스트 추출**: 스캔된 문서 이미지에서 텍스트를 자동으로 추출
2. **메타데이터 자동 생성**: 추출된 텍스트를 기반으로 메타데이터 자동 생성
3. **사용자 선택 옵션**: 사용자가 OCR 사용 여부를 선택할 수 있도록 UI 제공
4. **비용 효율적 운영**: OCR 사용 시에만 Google Vision API 호출

---

## 🤔 구현 방식 선택

### 옵션 1: 라디오 버튼에 OCR 옵션 추가 (추천)

**장점:**
- ✅ 사용자가 명시적으로 OCR 사용 여부를 선택 가능
- ✅ 문서가 아닌 이미지에 OCR을 사용하지 않아 비용 절약
- ✅ UI가 명확하고 직관적
- ✅ 사용자가 OCR 결과를 확인하고 수정할 수 있는 기회 제공

**단점:**
- ⚠️ 사용자가 매번 선택해야 함 (하지만 문서 업로드 시에만 표시 가능)

**구현 방식:**
```typescript
// 문서 감지 시에만 OCR 옵션 표시
if (isDocument) {
  // 라디오 버튼: 골프 AI, 일반 메타 생성, OCR (구글 비전)
} else {
  // 라디오 버튼: 골프 AI, 일반 메타 생성
}
```

### 옵션 2: 자동 감지 후 OCR 자동 실행

**장점:**
- ✅ 사용자 개입 없이 자동 처리
- ✅ UX가 간단함

**단점:**
- ⚠️ 문서가 아닌 이미지도 OCR을 시도할 수 있음 (비용 낭비)
- ⚠️ 사용자가 OCR 사용 여부를 제어할 수 없음
- ⚠️ OCR 결과를 확인할 기회가 없음

**구현 방식:**
```typescript
// detectCustomerImageType에서 문서 감지 시 자동으로 OCR 실행
if (typeDetection.type === 'docs') {
  const ocrResult = await extractTextWithGoogleVision(imageUrl);
  // OCR 결과를 메타데이터에 포함
}
```

### 🎯 추천: 옵션 1 (라디오 버튼 추가)

**이유:**
1. **비용 효율성**: 문서가 아닌 이미지에 OCR을 사용하지 않음
2. **사용자 제어**: 사용자가 OCR 사용 여부를 명시적으로 선택
3. **확장성**: 향후 다른 OCR 서비스 추가 시 유연하게 대응 가능
4. **명확성**: UI가 명확하여 사용자가 기능을 이해하기 쉬움

## 🔄 OCR 서비스 선택: FAL AI vs Google Vision

### FAL AI OCR (추천)

**장점:**
- ✅ 이미 FAL AI API 키 사용 중 (추가 설정 불필요)
- ✅ Google Cloud Platform 계정 생성 불필요
- ✅ 통합된 API 사용으로 관리 편의성
- ✅ 빠른 설정 및 배포

**단점:**
- ⚠️ 정확도는 Google Vision API보다 낮을 수 있음
- ⚠️ 비용 정보 확인 필요

**모델:**
- `fal-ai/got-ocr/v2`: 다양한 문서 타입 지원
- `fal-ai/florence-2-large/ocr`: 고급 OCR

### Google Vision API

**장점:**
- ✅ 매우 높은 정확도
- ✅ 한글 인식 우수
- ✅ 문서 구조 인식 (DOCUMENT_TEXT_DETECTION)

**단점:**
- ⚠️ Google Cloud Platform 계정 생성 필요
- ⚠️ 결제 계정 연결 필요
- ⚠️ 추가 API 키 관리 필요

**결론:**
- **1순위**: FAL AI OCR (빠른 구현, 추가 설정 불필요)
- **2순위**: Google Vision API (더 높은 정확도 필요 시)

---

## 🔧 Google Cloud Vision API 설정 가이드

### 1. Google Cloud Platform 계정 생성

1. **Google Cloud Console 접속**
   - URL: https://console.cloud.google.com/
   - Google 계정으로 로그인

2. **프로젝트 생성**
   - 상단 프로젝트 선택 드롭다운 클릭
   - "새 프로젝트" 클릭
   - 프로젝트 이름 입력 (예: "masgolf-ocr")
   - "만들기" 클릭

3. **결제 계정 설정** (필수)
   - 좌측 메뉴: "결제" → "결제 계정 연결"
   - 신용카드 정보 입력
   - **참고**: 첫 1,000회 요청은 무료, 이후 $1.50/1,000회

### 2. Vision API 활성화

1. **API 라이브러리 접속**
   - URL: https://console.cloud.google.com/apis/library/vision.googleapis.com
   - 또는 좌측 메뉴: "API 및 서비스" → "라이브러리" → "Cloud Vision API" 검색

2. **API 활성화**
   - "사용 설정" 버튼 클릭
   - 활성화 완료까지 대기 (1-2분)

### 3. API 키 생성

1. **사용자 인증 정보 페이지 접속**
   - URL: https://console.cloud.google.com/apis/credentials
   - 또는 좌측 메뉴: "API 및 서비스" → "사용자 인증 정보"

2. **API 키 생성**
   - 상단 "+ 사용자 인증 정보 만들기" 클릭
   - "API 키" 선택
   - 생성된 API 키 복사

3. **API 키 제한 설정** (보안 강화, 선택사항)
   - 생성된 API 키 클릭
   - "애플리케이션 제한사항" → "HTTP 리퍼러(웹사이트)" 선택
   - 허용된 리퍼러 추가 (예: `https://win.masgolf.co.kr/*`)
   - "API 제한사항" → "Cloud Vision API" 선택
   - "저장" 클릭

### 4. 환경 변수 설정

`.env.local` 또는 Vercel 환경 변수에 추가:

```bash
# Google Cloud Vision API
GOOGLE_VISION_API_KEY=your_api_key_here
```

**보안 주의사항:**
- API 키는 절대 Git에 커밋하지 마세요
- `.env.local`은 `.gitignore`에 포함되어 있어야 합니다
- Vercel에서는 환경 변수로 설정하세요

### 5. 비용 관리

**가격 정보:**
- 첫 1,000회/월: 무료
- 이후: $1.50/1,000회 (약 ₩2,000/1,000회)
- TEXT_DETECTION: $1.50/1,000회
- DOCUMENT_TEXT_DETECTION: $1.50/1,000회 (더 정확)

**비용 절감 방법:**
1. 문서가 아닌 이미지에는 OCR 사용 안 함
2. 사용자가 명시적으로 선택한 경우에만 OCR 실행
3. API 호출 제한 설정 (일일/월별 할당량)
4. 캐싱: 동일 이미지 재처리 방지

**할당량 설정:**
- Google Cloud Console → "API 및 서비스" → "할당량"
- "Cloud Vision API" 선택
- 일일 할당량 제한 설정 (예: 1,000회)

---

## 📝 FAL AI에서 OCR 사용 가능 여부

### ✅ FAL AI에서 OCR 직접 사용 가능!

**발견:**
- FAL AI는 OCR 기능을 제공합니다!
- **GOT OCR 2.0**: 다양한 문서 타입 지원 (일반 문서, 표, 차트, 수식 등)
- **Florence-2 Large OCR**: 고급 비전 모델 기반 OCR

**FAL AI OCR 모델:**
1. **GOT OCR 2.0** (`fal-ai/got-ocr/v2`)
   - 다양한 문서 타입 지원
   - 표, 차트, 수식, 악보 등 인식
   - 상업적 사용 가능

2. **Florence-2 Large OCR** (`fal-ai/florence-2-large/ocr`)
   - 프롬프트 기반 OCR
   - 텍스트 추출 및 영역 정보 제공

**사용 방법:**
```typescript
import { fal } from '@fal-ai/client';

const result = await fal.subscribe('fal-ai/got-ocr/v2', {
  input: {
    image_url: imageUrl
  }
});

const extractedText = result.text;
```

**장점:**
- ✅ 이미 FAL AI API 키 사용 중 (추가 설정 불필요)
- ✅ Google Cloud Platform 계정 생성 불필요
- ✅ 통합된 API 사용으로 관리 편의성
- ✅ 상업적 사용 가능

**비용:**
- FAL AI OCR 모델별 가격 확인 필요 (FAL AI 대시보드에서 확인)
- 일반적으로 Google Vision API보다 저렴할 수 있음

**결론:**
- **FAL AI OCR 추천**: 이미 FAL AI를 사용 중이므로 추가 설정 없이 바로 사용 가능
- **Google Vision API**: 더 높은 정확도가 필요한 경우 대안으로 고려

---

## 🏗️ 구현 계획

### Phase 1: UI 개선 (라디오 버튼 추가)

**파일**: `components/admin/CustomerImageUploadModal.tsx`

**변경 사항:**
1. `metadataType` 타입 확장: `'golf-ai' | 'general' | 'ocr'`
2. 문서 감지 시 OCR 옵션 표시
3. OCR 선택 시 안내 메시지 표시

**코드 예시:**
```typescript
// 문서 감지 로직 (파일명 또는 이미지 내용 기반)
const isDocument = fileName.includes('doc') || 
                   fileName.includes('사양서') || 
                   fileName.includes('문서');

// 라디오 버튼 조건부 렌더링
{isDocument && (
  <label className="flex items-center space-x-2 cursor-pointer">
    <input
      type="radio"
      name="metadataType"
      value="ocr"
      checked={metadataType === 'ocr'}
      onChange={(e) => setMetadataType('ocr')}
    />
    <span>OCR (구글 비전)</span>
    <span className="text-xs text-gray-500">(텍스트 추출)</span>
  </label>
)}
```

### Phase 2: OCR API 엔드포인트 생성

**파일**: `pages/api/admin/extract-document-text.ts`

**옵션 A: FAL AI OCR 사용 (추천)**

**기능:**
1. FAL AI OCR API 호출
2. GOT OCR 2.0 또는 Florence-2 Large 사용
3. 추출된 텍스트 반환
4. 에러 처리 및 로깅

**코드 구조:**
```typescript
import { fal } from '@fal-ai/client';

export default async function handler(req, res) {
  const { imageUrl, ocrProvider = 'fal' } = req.body;
  
  try {
    if (ocrProvider === 'fal') {
      // FAL AI OCR 사용
      const result = await fal.subscribe('fal-ai/got-ocr/v2', {
        input: {
          image_url: imageUrl
        }
      });
      
      return res.status(200).json({
        success: true,
        text: result.text,
        provider: 'fal-ai'
      });
    } else {
      // Google Vision API 사용
      const ocrResult = await extractTextWithGoogleVision(imageUrl);
      return res.status(200).json({
        success: true,
        text: ocrResult.text,
        fullTextAnnotation: ocrResult.fullTextAnnotation,
        provider: 'google-vision'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

**옵션 B: Google Vision API 사용**

**기능:**
1. Google Vision API 호출
2. TEXT_DETECTION 또는 DOCUMENT_TEXT_DETECTION 사용
3. 추출된 텍스트 반환
4. 에러 처리 및 로깅

**코드 구조:**
```typescript
async function extractTextWithGoogleVision(imageUrl: string) {
  const googleApiKey = process.env.GOOGLE_VISION_API_KEY;
  
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          image: { source: { imageUri: imageUrl } },
          features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }]
        }]
      })
    }
  );
  
  const data = await response.json();
  return {
    text: data.responses[0]?.fullTextAnnotation?.text || '',
    fullTextAnnotation: data.responses[0]?.fullTextAnnotation
  };
}
```

### Phase 3: 메타데이터 생성 API 수정

**파일**: `pages/api/admin/create-customer-image-metadata.ts`

**변경 사항:**
1. `metadataType === 'ocr'`인 경우 OCR API 호출
2. OCR 결과를 메타데이터에 포함
3. 추출된 텍스트를 `description` 또는 별도 필드에 저장

**코드 예시:**
```typescript
if (metadataType === 'ocr') {
  // OCR API 호출
  const ocrResponse = await fetch(`${baseUrl}/api/admin/extract-document-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl: tempUploadResult.url })
  });
  
  const ocrResult = await ocrResponse.json();
  
  // OCR 결과를 메타데이터에 포함
  metadataPayload.description = ocrResult.text || '';
  metadataPayload.ocr_text = ocrResult.text; // 별도 필드
  metadataPayload.ocr_extracted = true;
}
```

### Phase 4: 데이터베이스 스키마 확장 (선택사항)

**테이블**: `image_assets`

**추가 필드:**
- `ocr_text` (TEXT): 추출된 텍스트 전체
- `ocr_extracted` (BOOLEAN): OCR 사용 여부
- `ocr_confidence` (FLOAT): OCR 신뢰도 (0-1)

**SQL:**
```sql
ALTER TABLE image_assets
ADD COLUMN IF NOT EXISTS ocr_text TEXT,
ADD COLUMN IF NOT EXISTS ocr_extracted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ocr_confidence FLOAT;
```

---

## 📊 비용 예상

### 시나리오 1: 월 100개 문서 업로드
- OCR 호출: 100회
- 비용: 무료 (1,000회 무료 할당량 내)

### 시나리오 2: 월 2,000개 문서 업로드
- OCR 호출: 2,000회
- 무료: 1,000회
- 유료: 1,000회 × $1.50/1,000회 = $1.50 (약 ₩2,000)

### 시나리오 3: 월 10,000개 문서 업로드
- OCR 호출: 10,000회
- 무료: 1,000회
- 유료: 9,000회 × $1.50/1,000회 = $13.50 (약 ₩18,000)

---

## ✅ 체크리스트

### 설정 단계
- [ ] Google Cloud Platform 계정 생성
- [ ] 프로젝트 생성
- [ ] 결제 계정 연결
- [ ] Cloud Vision API 활성화
- [ ] API 키 생성
- [ ] API 키 제한 설정 (선택사항)
- [ ] 환경 변수 설정 (`.env.local` 또는 Vercel)
- [ ] 할당량 제한 설정 (선택사항)

### 개발 단계
- [ ] UI 개선: 라디오 버튼 추가
- [ ] OCR API 엔드포인트 생성
- [ ] 메타데이터 생성 API 수정
- [ ] 에러 처리 및 로깅
- [ ] 테스트: 문서 이미지 OCR 테스트
- [ ] 데이터베이스 스키마 확장 (선택사항)

### 배포 단계
- [ ] 로컬 환경 테스트
- [ ] 스테이징 환경 배포 및 테스트
- [ ] 프로덕션 환경 배포
- [ ] 모니터링 설정 (비용 추적)

---

## 🔗 참고 자료

### 공식 문서
- Google Cloud Vision API: https://cloud.google.com/vision/docs
- Vision API 가격: https://cloud.google.com/vision/pricing
- Vision API Node.js 클라이언트: https://cloud.google.com/nodejs/docs/reference/vision/latest

### API 엔드포인트
- REST API: `https://vision.googleapis.com/v1/images:annotate`
- TEXT_DETECTION: 이미지에서 텍스트 추출
- DOCUMENT_TEXT_DETECTION: 문서 구조 인식 (더 정확)

### 예제 코드
```typescript
const response = await fetch(
  `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { source: { imageUri: imageUrl } },
        features: [
          { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
        ]
      }]
    })
  }
);
```

---

## 📝 결론

1. **구현 방식**: 라디오 버튼에 OCR 옵션 추가 (옵션 1) 추천
2. **Google Vision API**: 직접 Google Cloud Platform에서 설정 필요
3. **FAL AI**: OCR 기능 없음, Google Vision API를 별도로 사용해야 함
4. **비용**: 첫 1,000회/월 무료, 이후 $1.50/1,000회
5. **구현 순서**: UI 개선 → OCR API 생성 → 메타데이터 생성 API 수정 → 테스트 → 배포
