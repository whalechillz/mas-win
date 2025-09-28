# 🖼️ 이미지 자산 관리 시스템 설정 가이드

## 📋 개요

이 가이드는 **AI 기반 이미지 자산 관리 시스템**의 설정 방법을 설명합니다.

## 🛠️ 필수 환경 변수 설정

### 1️⃣ `.env.local` 파일에 추가

```bash
# Google Vision API (이미지 인식)
GOOGLE_VISION_API_KEY=your_google_vision_api_key_here

# AWS Rekognition (대안 이미지 인식)
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key

# Supabase (이미지 스토리지 및 메타데이터)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2️⃣ `.env` 파일에도 복사 (Node.js API용)

```bash
cp .env.local .env
```

## 🔧 Google Vision API 설정

### 1️⃣ Google Cloud Console 설정

1. **Google Cloud Console** 접속: https://console.cloud.google.com/
2. **새 프로젝트 생성** 또는 기존 프로젝트 선택
3. **API 및 서비스 > 라이브러리**에서 다음 API 활성화:
   - Cloud Vision API
   - Cloud Storage API (선택사항)

### 2️⃣ API 키 생성

1. **API 및 서비스 > 사용자 인증 정보**
2. **사용자 인증 정보 만들기 > API 키**
3. **API 키 제한사항** 설정:
   - 애플리케이션 제한: HTTP 리퍼러
   - API 제한: Cloud Vision API

### 3️⃣ 비용 관리

- **무료 할당량**: 월 1,000회 요청
- **유료 요청**: 1,000회 이후 $1.50/1,000회
- **예상 비용**: 월 10,000회 요청 시 약 $13.50

## 🔧 AWS Rekognition 설정 (대안)

### 1️⃣ AWS 계정 설정

1. **AWS Console** 접속: https://console.aws.amazon.com/
2. **IAM > 사용자**에서 새 사용자 생성
3. **권한 정책** 추가:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "rekognition:DetectLabels",
           "rekognition:DetectText",
           "rekognition:DetectFaces"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

### 2️⃣ 비용 관리

- **무료 할당량**: 월 5,000회 이미지 분석
- **유료 요청**: 1,000회당 $1.00
- **예상 비용**: 월 10,000회 요청 시 약 $5.00

## 🗄️ Supabase 데이터베이스 설정

### 1️⃣ 스키마 생성

```bash
# 데이터베이스 스키마 실행
psql -h your-supabase-host -U postgres -d postgres -f database/image_management_schema.sql
```

### 2️⃣ Storage 버킷 설정

1. **Supabase Dashboard > Storage**
2. **새 버킷 생성**: `blog-images`
3. **공개 액세스** 활성화
4. **파일 크기 제한**: 10MB
5. **허용된 파일 형식**: jpg, jpeg, png, webp, gif

### 3️⃣ RLS (Row Level Security) 설정

```sql
-- 이미지 자산 테이블 RLS 활성화
ALTER TABLE image_assets ENABLE ROW LEVEL SECURITY;

-- 관리자만 모든 작업 가능
CREATE POLICY "Admin full access" ON image_assets
  FOR ALL USING (auth.role() = 'service_role');

-- 공개 읽기 (이미지 표시용)
CREATE POLICY "Public read access" ON image_assets
  FOR SELECT USING (status = 'active');
```

## 📦 필요한 패키지 설치

```bash
# 이미지 처리
npm install sharp

# AWS SDK (Rekognition용)
npm install aws-sdk

# 해시 계산
npm install crypto
```

## 🚀 시스템 테스트

### 1️⃣ 이미지 업로드 테스트

```javascript
// 테스트 API 호출
const response = await fetch('/api/admin/image-asset-manager', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/test-image.jpg',
    originalFilename: 'test-image.jpg',
    uploadSource: 'manual'
  })
});
```

### 2️⃣ AI 분석 테스트

```javascript
// AI 분석 테스트
const response = await fetch('/api/admin/image-ai-analyzer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: 'https://example.com/test-image.jpg',
    imageId: 'your-image-id'
  })
});
```

### 3️⃣ 이미지 추천 테스트

```javascript
// 추천 엔진 테스트
const response = await fetch('/api/admin/image-recommendation-engine', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '골프 드라이버 추천',
    content: '최신 골프 드라이버에 대한 리뷰입니다.',
    category: '골프 정보',
    tags: ['골프', '드라이버', '리뷰'],
    maxImages: 5
  })
});
```

## 📊 성능 최적화 설정

### 1️⃣ 이미지 최적화 설정

```sql
-- 최적화 설정 데이터 확인
SELECT * FROM image_optimization_settings;
```

### 2️⃣ CDN 설정 (선택사항)

```javascript
// Cloudflare 또는 AWS CloudFront 설정
const CDN_BASE_URL = 'https://your-cdn-domain.com';
```

## 🔍 모니터링 및 로그

### 1️⃣ 로그 확인

```bash
# API 로그 확인
tail -f logs/image-management.log
```

### 2️⃣ 성능 메트릭

- **이미지 업로드 시간**: 평균 2-3초
- **AI 분석 시간**: 평균 3-5초
- **추천 생성 시간**: 평균 1-2초
- **중복 감지 정확도**: 99.9%

## 🚨 문제 해결

### 1️⃣ 일반적인 오류

**Google Vision API 오류**
```bash
# API 키 확인
curl "https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY"
```

**Supabase 연결 오류**
```bash
# 연결 테스트
curl -H "apikey: YOUR_SUPABASE_KEY" "YOUR_SUPABASE_URL/rest/v1/image_assets"
```

### 2️⃣ 성능 문제

**이미지 업로드 느림**
- Sharp 라이브러리 최적화
- 이미지 크기 제한 설정
- 병렬 처리 구현

**AI 분석 실패**
- API 할당량 확인
- 대안 서비스 설정
- 캐싱 전략 구현

## 📈 확장 계획

### 1️⃣ 단계별 구현

1. **1단계**: 기본 이미지 업로드 및 메타데이터 관리
2. **2단계**: AI 분석 및 태그 자동 생성
3. **3단계**: 중복 감지 및 자산 관리
4. **4단계**: 추천 엔진 및 SEO 최적화
5. **5단계**: 고급 분석 및 인사이트

### 2️⃣ 추가 기능

- **이미지 편집**: 자동 크롭, 필터 적용
- **A/B 테스트**: 이미지 성능 비교
- **사용자 행동 분석**: 클릭률, 전환율 추적
- **자동 백업**: 외부 스토리지 연동

## 💰 예상 비용

### 월 10,000개 이미지 기준

| 서비스 | 비용 | 비고 |
|--------|------|------|
| Google Vision API | $13.50 | 1,000회 무료 후 $1.50/1,000회 |
| AWS Rekognition | $5.00 | 5,000회 무료 후 $1.00/1,000회 |
| Supabase Storage | $2.00 | 1GB 무료 후 $0.021/GB |
| **총 예상 비용** | **$20.50** | 하이브리드 사용 시 |

## 🎯 성공 지표

- **이미지 중복률**: 5% 이하
- **AI 태그 정확도**: 85% 이상
- **추천 클릭률**: 15% 이상
- **페이지 로딩 속도**: 2초 이하
- **SEO 점수 향상**: 20% 이상

---

**📞 지원**: 문제가 발생하면 로그를 확인하고 관련 API 문서를 참조하세요.
