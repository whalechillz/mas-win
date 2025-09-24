# 🔑 Google Vision API 설정 가이드

## 1. Google Cloud Console 설정

### 단계 1: 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 이름: `masgolf-seo-optimization`

### 단계 2: Vision API 활성화
1. **API 및 서비스** → **라이브러리** 이동
2. "Vision API" 검색
3. **사용 설정** 클릭

### 단계 3: 서비스 계정 생성
1. **IAM 및 관리** → **서비스 계정** 이동
2. **서비스 계정 만들기** 클릭
3. 이름: `masgolf-vision-api`
4. 역할: **Cloud Vision API 사용자**

### 단계 4: API 키 생성
1. **API 및 서비스** → **사용자 인증 정보** 이동
2. **사용자 인증 정보 만들기** → **API 키** 선택
3. 생성된 API 키 복사

## 2. 환경변수 설정

### .env.local 파일에 추가:
```bash
# Google Vision API
GOOGLE_VISION_API_KEY=your_api_key_here

# API 사용량 제한 (월 1000회 무료)
GOOGLE_VISION_QUOTA_LIMIT=1000
```

## 3. API 사용량 및 비용

### 무료 할당량:
- **월 1,000회** 무료
- **1,001~5,000회**: $1.50 per 1,000 units
- **5,001회 이상**: $0.60 per 1,000 units

### 예상 비용 (MASGOLF 기준):
- 월 100개 이미지 업로드: **무료**
- 월 500개 이미지 업로드: **무료**
- 월 1,000개 이미지 업로드: **무료**
- 월 2,000개 이미지 업로드: **$1.50**

## 4. 실제 구현 예시

### API 키 설정 후:
```javascript
// .env.local
GOOGLE_VISION_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxx

// 실제 이미지 분석 결과 예시:
{
  "labels": [
    {"description": "Golf club", "score": 0.98},
    {"description": "Sports equipment", "score": 0.95},
    {"description": "Golf", "score": 0.92}
  ],
  "objects": [
    {"name": "Golf club", "score": 0.97},
    {"name": "Golf ball", "score": 0.85}
  ],
  "text": "MASGOLF Driver",
  "colors": [
    {"color": {"red": 45, "green": 80, "blue": 22}, "score": 0.3},
    {"color": {"red": 255, "green": 255, "blue": 255}, "score": 0.2}
  ]
}
```

## 5. 대안 방법 (API 없이)

### 현재 구현된 기본 SEO 최적화:
```javascript
// 파일명 기반 키워드 추출
const extractKeywordsFromFilename = (filename) => {
  // masgolf-driver-golf-club.jpg
  // → ['마스골프', '드라이버', '골프', '클럽']
};

// SEO Alt 텍스트 생성
const generateSEOAltText = (filename, keywords) => {
  // "MASGOLF 드라이버 골프 클럽 이미지 - 골프 장비 전문"
};
```

### 수동 태그 입력 시스템:
```javascript
// 관리자가 직접 태그 입력
const manualTagInput = {
  category: "드라이버",
  brand: "MASGOLF",
  model: "고반발 드라이버",
  keywords: ["골프", "드라이버", "클럽", "스윙"]
};
```

## 6. 권장사항

### 단기 (API 없이):
1. **파일명 규칙화**: `masgolf-{제품}-{카테고리}-{연도}.jpg`
2. **수동 태그 입력**: 관리자 인터페이스에서 직접 입력
3. **템플릿 시스템**: 자주 사용하는 태그 템플릿 제공

### 장기 (API 사용):
1. **Google Vision API**: 정확한 이미지 분석
2. **자동 태그 생성**: AI 기반 키워드 추출
3. **고급 SEO**: 이미지 내용 기반 최적화

## 7. 비용 대비 효과

### API 사용 시 예상 효과:
- **검색 정확도**: 80% → 95%
- **태그 품질**: 수동 → AI 자동
- **SEO 효과**: 기본 → 고급
- **관리 시간**: 100% → 20%

### 결론:
월 1,000개 이미지 이하라면 **무료**로 사용 가능하며, SEO 효과는 **현재보다 3-5배 향상** 예상됩니다.
