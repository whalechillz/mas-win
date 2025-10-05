# Google API 비활성화 가이드

## 🚨 비용 절약을 위한 Google API 비활성화 방법

### 1. Google AI API 비활성화
```bash
# .env.local 파일에 추가
GOOGLE_AI_API_KEY=disabled
```

### 2. Google Analytics API 비활성화
```bash
# .env.local 파일에 추가
GOOGLE_ANALYTICS_DISABLED=true
```

### 3. Google Ads API 비활성화
```bash
# .env.local 파일에 추가
GOOGLE_ADS_DISABLED=true
```

## 📊 현재 과금 현황

### Google Cloud Console에서 확인된 과금:
- **Generative Language API**: 663,595 요청 (91% 오류율)
- **Google Analytics Data API**: 68 요청
- **Google Ads API**: 1 요청 (100% 오류율)

### 주요 원인:
1. **Google AI 이미지 생성 API** - 과도한 요청
2. **Google Analytics 실시간 데이터 수집** - 자동 실행
3. **Google Ads 캠페인 관리** - 자동 실행

## 🔧 수정된 파일들

### Google AI API 파일들:
- `pages/api/generate-blog-image-google.js` ✅
- `pages/api/analyze-image-google-ai.js` ✅
- `pages/api/recreate-image-google-ai.js` ✅

### Google Analytics API 파일들:
- `pages/api/ga4-test.ts` ✅
- `pages/api/ga4-realtime.ts` ✅

### Google Ads API 파일들:
- `pages/api/google-ads/campaigns.ts` ✅

## 🎯 권장사항

1. **즉시 비활성화**: 위의 환경 변수들을 설정하여 API 호출 중단
2. **모니터링**: Google Cloud Console에서 과금 현황 지속 확인
3. **대안 사용**: FAL AI, Replicate 등 다른 AI 서비스 활용
4. **필요시 재활성화**: 비용 문제 해결 후 필요시 재활성화

## ⚠️ 주의사항

- API 비활성화 후 해당 기능들은 작동하지 않습니다
- 사용자에게 적절한 안내 메시지가 표시됩니다
- 필요시 언제든지 재활성화 가능합니다
