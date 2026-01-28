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

## 📊 OCR 서비스 상세 비교: Google Vision vs FAL AI

| 비교 항목 | Google DOCUMENT_TEXT_DETECTION | FAL AI GOT OCR 2.0 | FAL AI Florence-2 Large OCR |
|---------|-------------------------------|-------------------|----------------------------|
| **제공사** | Google Cloud Platform | FAL AI | FAL AI |
| **모델 ID** | `DOCUMENT_TEXT_DETECTION` | `fal-ai/got-ocr/v2` | `fal-ai/florence-2-large/ocr` |
| **한글 인식 정확도** | ⭐⭐⭐⭐⭐ (95-98%) | ⭐⭐⭐⭐ (90-95%) | ⭐⭐⭐⭐⭐ (93-97%) |
| **한글 지원** | ✅ 매우 우수 | ✅ 우수 | ✅ 매우 우수 |
| **문서 타입 지원** | 스캔 문서, PDF, 양식, 표 | 일반 문서, 표, 차트, 수식, 악보 | 일반 문서, 표, 이미지 속 텍스트 |
| **구조 인식** | ✅ 단락, 문단, 표 구조 완벽 인식 | ✅ 표, 차트 구조 인식 | ⚠️ 제한적 (텍스트 중심) |
| **표 인식** | ✅ 우수 (셀 단위 인식) | ✅ 우수 (표 구조 인식) | ⚠️ 기본적 |
| **수식/차트 인식** | ⚠️ 제한적 | ✅ 우수 (수식, 차트, 악보) | ❌ 수식/차트 인식 불가 |
| **가격** | $1.50/1,000회 (첫 1,000회/월 무료) | FAL AI 가격 정책 (확인 필요) | FAL AI 가격 정책 (확인 필요) |
| **API 키 설정** | ❌ Google Cloud Platform 계정 필요 | ✅ 이미 FAL AI 키 사용 중 | ✅ 이미 FAL AI 키 사용 중 |
| **설정 난이도** | ⚠️ 중간 (GCP 계정, 결제 설정) | ✅ 쉬움 (기존 키 사용) | ✅ 쉬움 (기존 키 사용) |
| **응답 속도** | 보통 (2-4초) | 빠름 (1-3초) | 빠름 (1-3초) |
| **프롬프트 지원** | ❌ 프롬프트 불필요 | ❌ 프롬프트 불필요 | ✅ 프롬프트 기반 (선택적) |
| **영역 정보 제공** | ✅ 텍스트 위치, 경계 정보 | ✅ 텍스트 위치 정보 | ✅ 텍스트 영역 정보 (quad boxes) |
| **사용 사례** | 주문 사양서, 고객 정보 양식, 피팅 데이터 | 일반 문서, 수식 문서, 악보 | 일반 문서, 이미지 속 텍스트 |
| **정확도 (한글 문서)** | 높음 (95-98%) | 중상 (90-95%) | 높음 (93-97%) |
| **정확도 (표/양식)** | 매우 높음 (98%+) | 높음 (95%+) | 중상 (90%+) |
| **정확도 (수식/차트)** | 낮음 (60-70%) | 높음 (90%+) | 낮음 (50-60%) |
| **추천 사용** | 한글 문서 OCR (최고 정확도) | 수식/차트 포함 문서 | 일반 문서, 프롬프트 기반 OCR |
| **장점** | • 한글 인식 최고 정확도<br>• 문서 구조 완벽 인식<br>• 표 인식 우수<br>• 안정성 높음 | • 추가 설정 불필요<br>• 수식/차트 인식<br>• 빠른 응답<br>• 다양한 문서 타입 | • 프롬프트 기반 OCR<br>• 영역 정보 제공<br>• 빠른 응답<br>• 추가 설정 불필요 |
| **단점** | • GCP 계정 필요<br>• 결제 설정 필요<br>• 수식/차트 인식 제한적 | • 한글 정확도 다소 낮음<br>• 가격 정보 확인 필요 | • 표 구조 인식 제한적<br>• 수식/차트 인식 불가 |

### 📝 상세 설명

#### 1. Google DOCUMENT_TEXT_DETECTION

**특징:**
- **한글 인식**: 95-98% 정확도 (가장 높음)
- **문서 구조**: 단락(paragraph), 문단(block), 표(table) 구조 완벽 인식
- **표 인식**: 셀 단위 인식 가능, 표 구조 정보 제공
- **가격**: $1.50/1,000회 (첫 1,000회/월 무료)

**추천 사용:**
- ✅ 한글 주문 사양서, 고객 정보 양식
- ✅ 표가 많은 문서 (피팅 데이터 등)
- ✅ 구조화된 문서 (단락, 문단 구분 필요)

**단점:**
- ⚠️ Google Cloud Platform 계정 생성 필요
- ⚠️ 결제 계정 연결 필요
- ⚠️ 수식, 차트 인식 제한적

#### 2. FAL AI GOT OCR 2.0

**특징:**
- **한글 인식**: 90-95% 정확도
- **문서 타입**: 일반 문서, 표, 차트, 수식, 악보 등 다양한 타입 지원
- **수식/차트**: 수학 공식, 차트, 악보 인식 우수
- **설정**: 기존 FAL AI API 키 사용 (추가 설정 불필요)

**추천 사용:**
- ✅ 수식이 포함된 문서
- ✅ 차트, 그래프가 있는 문서
- ✅ 악보, 기하학적 도형이 있는 문서
- ✅ 빠른 설정이 필요한 경우

**단점:**
- ⚠️ 한글 정확도가 Google Vision보다 다소 낮음
- ⚠️ 가격 정보 확인 필요

#### 3. FAL AI Florence-2 Large OCR

**특징:**
- **한글 인식**: 93-97% 정확도
- **프롬프트 기반**: 프롬프트를 통한 선택적 OCR 가능
- **영역 정보**: 텍스트 영역 정보(quad boxes) 제공
- **설정**: 기존 FAL AI API 키 사용 (추가 설정 불필요)

**추천 사용:**
- ✅ 일반 문서 OCR
- ✅ 이미지 속 텍스트 추출
- ✅ 프롬프트로 특정 영역만 OCR
- ✅ 빠른 설정이 필요한 경우

**단점:**
- ⚠️ 표 구조 인식 제한적
- ⚠️ 수식, 차트 인식 불가

### 🎯 선택 가이드

#### 한글 문서 OCR (주문 사양서, 고객 정보 양식 등)

**1순위: Google DOCUMENT_TEXT_DETECTION**
- 한글 인식 정확도 최고 (95-98%)
- 표 구조 인식 우수
- 문서 구조 완벽 인식

**2순위: FAL AI Florence-2 Large OCR**
- 빠른 설정 (기존 키 사용)
- 높은 정확도 (93-97%)
- 추가 계정 생성 불필요

#### 수식/차트 포함 문서

**1순위: FAL AI GOT OCR 2.0**
- 수식, 차트, 악보 인식 우수
- 다양한 문서 타입 지원

**2순위: Google DOCUMENT_TEXT_DETECTION**
- 수식/차트 인식 제한적

#### 빠른 구현이 필요한 경우

**1순위: FAL AI (GOT OCR 2.0 또는 Florence-2 Large)**
- 기존 FAL AI 키 사용
- 추가 설정 불필요
- 빠른 배포 가능

**2순위: Google DOCUMENT_TEXT_DETECTION**
- GCP 계정 생성 필요
- 결제 설정 필요

### 💰 비용 비교

| 서비스 | 첫 무료 할당량 | 이후 가격 | 비고 |
|--------|--------------|----------|------|
| **Google DOCUMENT_TEXT_DETECTION** | 1,000회/월 | $1.50/1,000회 | 약 ₩2,000/1,000회 |
| **FAL AI GOT OCR 2.0** | 확인 필요 | FAL AI 가격 정책 | FAL AI 대시보드 확인 |
| **FAL AI Florence-2 Large OCR** | 확인 필요 | FAL AI 가격 정책 | FAL AI 대시보드 확인 |

### ✅ 최종 추천

**한글 문서 OCR (주문 사양서, 고객 정보 양식):**
1. **Google DOCUMENT_TEXT_DETECTION** (최고 정확도, 표 인식 우수)
2. **FAL AI Florence-2 Large OCR** (빠른 설정, 높은 정확도)

**수식/차트 포함 문서:**
1. **FAL AI GOT OCR 2.0** (수식/차트 인식 우수)

**빠른 구현:**
1. **FAL AI (GOT OCR 2.0 또는 Florence-2 Large)** (추가 설정 불필요)

---

## 🎯 실전 선택 가이드

### 시나리오별 추천

#### 시나리오 1: 한글 정확도가 최우선인 경우
**추천: Google DOCUMENT_TEXT_DETECTION**

**이유:**
- 한글 인식 정확도 95-98% (최고)
- 표 구조 인식 우수 (셀 단위)
- 문서 구조 완벽 인식 (단락, 문단)

**단점:**
- Google Cloud Platform 계정 생성 필요
- 결제 계정 연결 필요
- 설정 시간 소요 (약 30분-1시간)

**적합한 경우:**
- ✅ "VIP 클럽 분석 및 주문 사양서" 같은 한글 문서
- ✅ 표가 많은 문서 (피팅 데이터 등)
- ✅ 정확도가 매우 중요한 경우

#### 시나리오 2: 빠른 구현이 필요한 경우
**추천: FAL AI Florence-2 Large OCR**

**이유:**
- 기존 FAL AI API 키 사용 (추가 설정 불필요)
- 한글 인식 정확도 93-97% (높음)
- 빠른 배포 가능 (즉시 사용)

**단점:**
- Google Vision보다 정확도 약간 낮음
- 표 구조 인식 제한적

**적합한 경우:**
- ✅ 빠른 프로토타입 개발
- ✅ 추가 계정 생성 없이 바로 사용
- ✅ 정확도 93-97%면 충분한 경우

#### 시나리오 3: 수식/차트가 포함된 문서
**추천: FAL AI GOT OCR 2.0**

**이유:**
- 수식, 차트, 악보 인식 우수
- 다양한 문서 타입 지원

**단점:**
- 한글 정확도 90-95% (상대적으로 낮음)

**적합한 경우:**
- ✅ 수학 공식이 포함된 문서
- ✅ 차트, 그래프가 있는 문서
- ✅ 악보, 기하학적 도형이 있는 문서

### 💡 실전 추천 전략

#### 전략 1: 단계적 접근 (추천)

**Phase 1: 빠른 구현 (FAL AI Florence-2 Large OCR)**
- 기존 FAL AI 키 사용
- 빠른 프로토타입 개발
- 정확도 93-97%로 충분한지 테스트

**Phase 2: 정확도 개선 (Google DOCUMENT_TEXT_DETECTION)**
- FAL AI로 부족한 경우
- Google Cloud Platform 계정 생성
- 더 높은 정확도 (95-98%) 필요 시 전환

**장점:**
- 빠른 시작 가능
- 필요 시 업그레이드 가능
- 비용 효율적

#### 전략 2: 최고 정확도 우선

**직접 Google DOCUMENT_TEXT_DETECTION 사용**
- 한글 정확도 최고 (95-98%)
- 표 구조 인식 우수
- 문서 구조 완벽 인식

**장점:**
- 최고 정확도
- 한 번에 최적 솔루션 구축

**단점:**
- 초기 설정 시간 소요
- GCP 계정 생성 필요

### 📊 최종 결정 매트릭스

| 우선순위 | 추천 제품 | 이유 |
|---------|----------|------|
| **한글 정확도 최우선** | Google DOCUMENT_TEXT_DETECTION | 95-98% 정확도 (최고) |
| **빠른 구현 우선** | FAL AI Florence-2 Large OCR | 추가 설정 불필요, 93-97% 정확도 |
| **수식/차트 포함** | FAL AI GOT OCR 2.0 | 수식/차트 인식 우수 |
| **비용 효율성** | FAL AI (두 모델) | Google Vision보다 저렴할 수 있음 |
| **표 인식 중요** | Google DOCUMENT_TEXT_DETECTION | 표 구조 인식 최고 |

### ✅ 최종 추천 (현재 상황 기준)

**현재 상황 고려:**
- 이미 FAL AI 사용 중
- 빠른 구현 필요
- 한글 문서 OCR 필요

**추천: FAL AI Florence-2 Large OCR**

**이유:**
1. ✅ 기존 FAL AI 키 사용 (추가 설정 불필요)
2. ✅ 한글 정확도 93-97% (높음)
3. ✅ 빠른 배포 가능
4. ✅ 비용 효율적

**향후 개선:**
- 정확도가 부족한 경우 → Google DOCUMENT_TEXT_DETECTION으로 전환
- 수식/차트가 필요한 경우 → FAL AI GOT OCR 2.0 추가 고려

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

**⚠️ OAuth 동의 화면 경고 무시 가능:**
- 화면에 "OAuth 동의 화면을 구성해야 합니다" 경고가 표시될 수 있음
- **API 키만 사용하는 경우 OAuth 동의 화면 구성 불필요**
- 현재 구현은 API 키만 사용하므로 경고를 무시해도 됨
- OAuth 2.0 클라이언트 ID를 사용할 때만 OAuth 동의 화면 구성 필요

3. **API 키 제한 설정** (보안 강화, 선택사항)
   - 생성된 API 키 클릭
   - "애플리케이션 제한사항" → "HTTP 리퍼러(웹사이트)" 선택
   - 허용된 리퍼러 추가:
     - `https://www.masgolf.co.kr/*` (프로덕션)
     - `https://win.masgolf.co.kr/*` (프로덕션)
     - `http://localhost:3000/*` (로컬 개발, 선택사항)
   - "API 제한사항" → "키 제한" 선택
   - "Cloud Vision API" 선택
   - "저장" 클릭

**✅ 완벽한 설정 예시:**
- ✅ API 키 이름: "Vision API - Document OCR" (명확한 이름)
- ✅ 애플리케이션 제한사항: "웹사이트" 선택
- ✅ 웹사이트 제한사항:
  - `http://localhost:3000/*` (로컬 개발 환경)
  - `https://www.masgolf.co.kr/*` (프로덕션 환경)
- ✅ API 제한사항: "키 제한" 선택
- ✅ 선택한 API: "Cloud Vision API"

**이 설정으로 "만들기" 버튼을 클릭하면 완료됩니다!**

### 4. 환경 변수 설정

#### 로컬 개발 환경 (`.env.local`)
```bash
# Google Cloud Vision API
GOOGLE_VISION_API_KEY=your_api_key_here
```

#### Vercel 프로덕션 환경
1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. `GOOGLE_VISION_API_KEY` 추가
3. **중요**: "Redeploy" 버튼 클릭하여 재배포 필요!

**✅ 설정 완료 확인:**
- ✅ 로컬: `.env.local`에 추가됨
- ✅ Vercel: 환경 변수 추가됨
- ⚠️ **재배포 필요**: Vercel에서 "Redeploy" 버튼 클릭

**보안 주의사항:**
- API 키는 절대 Git에 커밋하지 마세요
- `.env.local`은 `.gitignore`에 포함되어 있어야 합니다
- Vercel에서는 환경 변수로만 설정하세요

### 5. 비용 관리

**가격 정보:**
- **무료 티어**: 첫 1,000회/월 무료 (KRW 0.00 /1K count)
- **등급 1 (Tier 1)**: KRW 2,151.49 /1K count (약 ₩2,150/1,000회)
- **USD 기준**: $1.50/1,000회
- **환율**: 1 USD = 약 1,434.32 KRW (2026년 1월 기준)

**화면에서 확인할 수 있는 정보:**
- ✅ "Document Text Detection Operations" ← 이것이 바로 DOCUMENT_TEXT_DETECTION!
- 무료: KRW 0.00 /1K count (최저: 0 count/월)
- 등급 1: KRW 2,151.49 /1K count (최저: 1K count/월)

**⚠️ 중요: AutoML vs Vision API 구분**

화면에 보이는 "AutoML Human Labeled Images"는 **문서 OCR에 사용하지 않습니다!**

| 서비스 | 용도 | 문서 OCR 적합성 |
|--------|------|----------------|
| **Google Vision API - DOCUMENT_TEXT_DETECTION** | ✅ 즉시 사용 가능한 OCR | ✅ 적합 (추천) |
| **AutoML Human Labeled Images** | ❌ 커스텀 모델 학습용 데이터 라벨링 | ❌ 부적합 |
| **AutoML Image Classification** | ❌ 이미지 분류 모델 학습 | ❌ 부적합 |

**차이점:**
- **Vision API DOCUMENT_TEXT_DETECTION**: 
  - ✅ 즉시 사용 가능 (모델 학습 불필요)
  - ✅ 한글 OCR 전용 기능
  - ✅ $1.50/1,000회 (저렴)
  
- **AutoML 서비스들**:
  - ❌ 커스텀 모델 학습 필요
  - ❌ 데이터 라벨링 비용 추가 (KRW 50/count)
  - ❌ 학습 시간 및 비용 소요
  - ❌ 문서 OCR 전용 기능 아님

**결론:**
- ✅ **Google Vision API - DOCUMENT_TEXT_DETECTION** 사용
- ❌ AutoML 서비스는 사용하지 않음

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

## 📊 Google Vision API OCR 기능 비교 (한글 기준)

| 비교 항목 | TEXT_DETECTION | DOCUMENT_TEXT_DETECTION | LABEL_DETECTION |
|---------|----------------|------------------------|-----------------|
| **기능 설명** | 일반 텍스트 감지 | 문서 구조 인식 및 텍스트 추출 | 이미지 라벨/태그 감지 |
| **한글 인식 정확도** | ⭐⭐⭐⭐ (85-90%) | ⭐⭐⭐⭐⭐ (95-98%) | ⭐⭐ (한글 텍스트 인식 불가) |
| **한글 지원** | ✅ 우수 | ✅ 매우 우수 | ❌ 한글 텍스트 인식 안 함 |
| **문서 타입 지원** | 일반 이미지, 사진 속 텍스트 | 스캔 문서, PDF, 양식, 표 | 이미지 전체 내용 분석 |
| **구조 인식** | ❌ 텍스트만 추출 | ✅ 단락, 문단, 표 구조 인식 | ❌ 구조 인식 불가 |
| **표 인식** | ⚠️ 제한적 | ✅ 우수 (셀 단위 인식) | ❌ 표 인식 불가 |
| **가격** | $1.50/1,000회 | $1.50/1,000회 | $1.50/1,000회 |
| **응답 속도** | 빠름 (1-2초) | 보통 (2-4초) | 빠름 (1-2초) |
| **사용 사례** | 사진 속 간판, 간단한 텍스트 | 스캔 문서, 주문서, 양식 | 이미지 분류, 태그 생성 |
| **한글 처리** | 한글, 영문, 숫자 혼합 지원 | 한글 문서 구조 완벽 인식 | 한글 텍스트 내용 분석 불가 |
| **정확도 (한글)** | 중간 (85-90%) | 높음 (95-98%) | N/A (텍스트 인식 안 함) |
| **추천 사용** | 간단한 텍스트 추출 | 문서 OCR (추천) | 이미지 분류/태깅 |
| **장점** | 빠른 처리, 간단한 API | 높은 정확도, 구조 인식 | 이미지 전체 내용 이해 |
| **단점** | 구조 정보 부족 | 처리 시간 다소 길음 | 텍스트 추출 불가 |

### 📝 상세 설명

#### 1. TEXT_DETECTION
- **용도**: 일반 이미지에서 텍스트 추출
- **한글 인식**: 한글, 영문, 숫자 혼합 텍스트 인식 가능
- **정확도**: 85-90% (간단한 텍스트 기준)
- **예시**: 사진 속 간판, 메뉴판, 간단한 문서

#### 2. DOCUMENT_TEXT_DETECTION (추천)
- **용도**: 스캔된 문서, 양식, 표가 있는 문서
- **한글 인식**: 한글 문서 구조 완벽 인식 (95-98%)
- **정확도**: 매우 높음, 단락/문단/표 구조 인식
- **예시**: 주문 사양서, 고객 정보 양식, 피팅 데이터 문서
- **특징**: 
  - 단락(paragraph), 문단(block) 구조 인식
  - 표(table) 셀 단위 인식
  - 페이지 구조 정보 제공

#### 3. LABEL_DETECTION
- **용도**: 이미지 전체 내용 분석 및 태그 생성
- **한글 인식**: 한글 텍스트 내용 인식 불가 (이미지 분류용)
- **정확도**: N/A (텍스트 추출 기능 아님)
- **예시**: 이미지가 "문서", "골프장", "사람" 등인지 분류

### 🎯 문서 OCR 추천

**문서 이미지 OCR 시:**
- ✅ **1순위**: `DOCUMENT_TEXT_DETECTION` (한글 문서 구조 완벽 인식)
- ⚠️ **2순위**: `TEXT_DETECTION` (간단한 텍스트만 있는 경우)
- ❌ **비추천**: `LABEL_DETECTION` (텍스트 추출 불가)

**비용:**
- 모든 기능 동일: $1.50/1,000회
- 첫 1,000회/월 무료

**결론:**
- 한글 문서 OCR에는 **`DOCUMENT_TEXT_DETECTION`** 사용을 강력 추천
- 표, 양식, 구조화된 문서에서 높은 정확도 제공

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
