# 🚨 Google Analytics 실시간 데이터 연동이 안 되는 이유

## 현재 상황
- **표시되는 데이터**: Supabase에 저장된 더미 데이터 (조회수 1,234)
- **실제 GA4 데이터**: ❌ 연동되지 않음
- **Google Ads 데이터**: ❌ 연동되지 않음

## 문제 원인
1. **GA4 API 연동 코드가 없음**
2. **Google 서비스 계정 설정이 없음**
3. **환경변수가 설정되지 않음**

## 📌 즉시 해결 방법

### Step 1: 필요한 패키지 설치
```bash
npm install googleapis --legacy-peer-deps
```

### Step 2: 환경변수 추가 (.env.local)
```bash
# Google Analytics 4
GOOGLE_SERVICE_ACCOUNT_EMAIL=masgolf-ga4-reader@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GA4_PROPERTY_ID=497433231
```

### Step 3: Google Cloud Console에서 서비스 계정 생성

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com
   - 프로젝트: My First Project (또는 새 프로젝트 생성)

2. **APIs & Services > Credentials**
   - Create Credentials > Service Account
   - 이름: `masgolf-ga4-reader`
   - Create and Continue

3. **키 생성**
   - Keys 탭 > Add Key > Create new key
   - JSON 선택
   - 다운로드된 JSON 파일 열기

4. **JSON에서 값 복사**
   ```json
   {
     "client_email": "이 값을 GOOGLE_SERVICE_ACCOUNT_EMAIL에",
     "private_key": "이 값을 GOOGLE_SERVICE_ACCOUNT_KEY에"
   }
   ```

### Step 4: GA4에 서비스 계정 권한 부여

1. **Google Analytics 4 접속**
   - https://analytics.google.com

2. **관리 > 속성 액세스 관리**
   - 사용자 추가 클릭
   - 이메일: [서비스 계정 이메일]
   - 역할: 뷰어
   - 추가

### Step 5: API 활성화

1. **Google Cloud Console**
   - APIs & Services > Library
   - "Google Analytics Data API" 검색
   - Enable 클릭

### Step 6: 서버 재시작 및 테스트

```bash
# 서버 재시작
npm run dev

# API 테스트 (새 터미널)
curl http://localhost:3000/api/ga4-campaign-metrics
```

## 🎯 예상 결과

API가 성공하면:
```json
{
  "success": true,
  "data": {
    "2025-07": {
      "campaign_id": "2025-07",
      "views": 2847,  // 실제 GA4 페이지뷰
      "unique_visitors": 1523,  // 실제 활성 사용자
      "phone_clicks": 89,  // 실제 전화 클릭 이벤트
      "new_users": 1102  // 실제 신규 사용자
    }
  }
}
```

## ⚠️ 주의사항

1. **서비스 계정 키는 절대 공개하지 마세요**
2. **.env.local은 .gitignore에 포함되어야 함**
3. **GA4 속성 ID 확인**: 관리 > 속성 설정에서 확인
4. **데이터 지연**: GA4 데이터는 최대 24시간 지연될 수 있음

## 🔄 자동 업데이트 (선택사항)

### Vercel Cron Job 설정
```javascript
// pages/api/cron/update-metrics.ts
export default async function handler(req, res) {
  // 매시간 실행
  await fetch('https://win.masgolf.co.kr/api/ga4-campaign-metrics');
  res.status(200).json({ updated: true });
}
```

### vercel.json
```json
{
  "crons": [{
    "path": "/api/cron/update-metrics",
    "schedule": "0 * * * *"
  }]
}
```

---

이 설정을 완료하면 캠페인 KPI 대시보드에 **실제 Google Analytics 데이터**가 표시됩니다!