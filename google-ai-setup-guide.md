# Google AI API 설정 가이드

## 🚀 Google AI API 무료 가입 방법

### 1단계: Google AI Studio 접속
```
https://aistudio.google.com/
```

### 2단계: Google 계정으로 로그인
- Google 계정이 없으면 새로 생성
- 기존 Gmail 계정 사용 가능

### 3단계: API 키 생성
1. "Get API Key" 클릭
2. "Create API Key" 선택
3. 새 프로젝트 생성 또는 기존 프로젝트 선택
4. API 키 복사 (예: `AIzaSyC...`)

### 4단계: 환경 변수 설정

#### 로컬 개발 환경 (.env.local)
```bash
GOOGLE_AI_API_KEY=AIzaSyC_your_api_key_here
```

#### Vercel 배포 환경
1. Vercel 대시보드 접속
2. 프로젝트 선택
3. Settings > Environment Variables
4. `GOOGLE_AI_API_KEY` 추가

### 5단계: 무료 할당량 확인
```
- 월 15회 무료 이미지 생성
- 월 1,500회 무료 텍스트 분석
- 충분한 무료 할당량 제공
```

## 🔧 지원하는 기능

### 1. 이미지 분석 (Vision API)
- 이미지 내용 설명
- 스타일, 색상, 구성 요소 분석
- 골프 관련 요소 감지
- 한국인/한국적 요소 인식

### 2. 이미지 생성 (Imagen API)
- 분석된 이미지 설명으로 새 이미지 생성
- 고품질 실사 이미지
- 16:9 비율 지원
- 안전 필터 적용

### 3. 텍스트 분석 (Gemini API)
- 콘텐츠 품질 분석
- SEO 최적화 제안
- 키워드 추출

## 📝 사용 예시

### 이미지 분석
```javascript
const response = await fetch('/api/analyze-image-google-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrl: 'https://example.com/image.jpg' })
});
```

### 이미지 재생성
```javascript
const response = await fetch('/api/recreate-image-google-ai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    analysisData: analysisResult,
    originalImageUrl: 'https://example.com/image.jpg'
  })
});
```

## ⚠️ 주의사항

1. **API 키 보안**: API 키를 공개 저장소에 커밋하지 마세요
2. **할당량 관리**: 무료 할당량을 초과하지 않도록 주의하세요
3. **이미지 품질**: 생성된 이미지는 원본과 다를 수 있습니다
4. **응답 시간**: AI 처리로 인해 응답 시간이 길 수 있습니다

## 🆘 문제 해결

### API 키 오류
```
Error: Google AI API 키가 설정되지 않았습니다.
```
→ 환경 변수 `GOOGLE_AI_API_KEY` 확인

### 할당량 초과
```
Error: Quota exceeded
```
→ 다음 달까지 대기하거나 유료 플랜 고려

### 이미지 생성 실패
```
Error: Google AI Imagen API 오류
```
→ 프롬프트 길이 및 내용 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. API 키가 올바르게 설정되었는지
2. 인터넷 연결 상태
3. Google AI Studio에서 API 상태 확인
4. 할당량 사용량 확인
