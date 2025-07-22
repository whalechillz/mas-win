# 📊 Google Analytics 4 디버그 페이지 사용 가이드

## 🎯 목적
Google Analytics에서 실제로 데이터를 가져올 수 있는지 확인하고, 어떤 데이터를 추출할 수 있는지 테스트하는 페이지입니다.

## 📌 접속 방법
```
http://localhost:3000/ga4-debug
```

## 🔍 디버그 페이지에서 확인할 수 있는 것들

### 1. GA4 설정 상태
- ✅ 서비스 계정 이메일 설정 여부
- ✅ 서비스 계정 키 설정 여부
- ✅ GA4 속성 ID (497433231)

### 2. 실제 데이터 테스트
- **GA4 데이터 가져오기**: 캠페인별 메트릭 데이터
- **실시간 데이터 테스트**: 최근 30분간의 활성 사용자

### 3. 추출 가능한 데이터 목록
#### 메트릭 (측정값)
- 페이지 조회수
- 활성 사용자
- 신규 사용자
- 세션 수
- 이탈률
- 평균 세션 시간
- 이벤트 수
- 전환 수

#### 디멘션 (분류 기준)
- 날짜
- 페이지 경로
- 이벤트 이름
- 국가/도시
- 기기 카테고리
- 소스/매체
- 캠페인

#### 커스텀 이벤트
- phone_click (전화 클릭)
- quiz_complete (퀴즈 완료)
- booking_submit (예약 제출)
- contact_submit (문의 제출)
- scroll_depth (스크롤 깊이)

## 🛠️ 문제 해결

### "❌ 없음" 표시되는 경우
1. `.env.local` 파일에 다음 환경변수 추가:
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GA4_PROPERTY_ID=497433231
```

2. 서버 재시작:
```bash
npm run dev
```

### "GA4 연결 실패" 오류
1. Google Cloud Console에서 Google Analytics Data API 활성화
2. GA4 속성에 서비스 계정 권한 부여

## 📊 데이터 활용

디버그 페이지에서 확인한 데이터는:
1. 캠페인 KPI 대시보드에 표시됩니다
2. Supabase `campaign_metrics` 테이블에 저장됩니다
3. 실시간 모니터링에 사용됩니다

## 🚀 다음 단계

1. 서비스 계정 설정 완료
2. GA4 디버그 페이지에서 데이터 확인
3. 캠페인 대시보드에서 실제 데이터 표시 확인