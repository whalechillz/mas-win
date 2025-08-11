# 🔑 Google Ads API 설정 정보 찾기 가이드

## 📍 필요한 4가지 정보와 찾는 방법

### 1. `GOOGLE_ADS_CLIENT_ID` & `GOOGLE_ADS_CLIENT_SECRET`
**📍 위치**: Google Cloud Console
**🔗 링크**: https://console.cloud.google.com/

#### 단계별 찾기:
1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/ 이동
   - 광교골프 계정으로 로그인

2. **프로젝트 선택 또는 생성**
   - 기존 프로젝트가 있다면 선택
   - 없다면 "새 프로젝트" 생성

3. **APIs & Services → Credentials**
   - 왼쪽 메뉴에서 "APIs & Services" 클릭
   - "사용자 인증 정보(Credentials)" 클릭

4. **OAuth 2.0 클라이언트 ID 생성**
   ```
   + CREATE CREDENTIALS → OAuth client ID
   Application type: Web application
   Name: MASGOLF Google Ads API
   Authorized redirect URIs: 
   - http://localhost:3000/auth/google/callback
   - https://win.masgolf.co.kr/auth/google/callback
   ```

5. **클라이언트 ID와 시크릿 복사**
   - **Client ID**: `123456789.apps.googleusercontent.com` 형태
   - **Client Secret**: `GOCSPX-abcd1234...` 형태

---

### 2. `GOOGLE_ADS_DEVELOPER_TOKEN`
**📍 위치**: Google Ads Manager (MCC 계정)
**🔗 링크**: https://ads.google.com/

#### 단계별 찾기:
1. **Google Ads 접속**
   - https://ads.google.com/ 이동
   - 광교골프 MCC 계정으로 로그인

2. **도구 및 설정 → API 센터**
   ```
   우측 상단 도구 아이콘 🔧 → 설정 → API 센터
   ```

3. **Developer Token 신청/확인**
   - "Developer Token" 섹션 확인
   - 없다면 "토큰 요청" 클릭
   - **승인까지 1-2일 소요**

4. **토큰 형태**
   ```
   예시: ABcdeFGhiJKlmnOP1234567890
   ```

---

### 3. `GOOGLE_ADS_REFRESH_TOKEN`
**📍 위치**: OAuth 2.0 Playground 또는 직접 생성
**🔗 링크**: https://developers.google.com/oauthplayground/

#### 방법 1: OAuth 2.0 Playground 사용
1. **OAuth 2.0 Playground 접속**
   - https://developers.google.com/oauthplayground/

2. **설정 구성**
   ```
   설정 ⚙️ 클릭
   ✅ Use your own OAuth credentials 체크
   OAuth Client ID: (위에서 복사한 Client ID)
   OAuth Client secret: (위에서 복사한 Client Secret)
   ```

3. **Scope 선택**
   ```
   Step 1: Select & authorize APIs
   검색: google ads
   선택: https://www.googleapis.com/auth/adwords
   "Authorize APIs" 클릭
   ```

4. **인증 및 토큰 생성**
   ```
   Step 2: Exchange authorization code for tokens
   "Exchange authorization code for tokens" 클릭
   ```

5. **Refresh Token 복사**
   ```
   Refresh token: 1//abcd-efgh-ijkl...
   ```

#### 방법 2: 코드로 직접 생성
```javascript
// 임시 토큰 생성 스크립트 (브라우저 콘솔에서 실행)
const clientId = 'your-client-id';
const clientSecret = 'your-client-secret';
const redirectUri = 'http://localhost:3000/auth/google/callback';

// 1단계: 인증 URL 생성
const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=https://www.googleapis.com/auth/adwords&response_type=code&access_type=offline&prompt=consent`;

console.log('1. 이 URL로 이동하세요:', authUrl);
console.log('2. 인증 후 리다이렉트 URL에서 code 파라미터 복사');
console.log('3. 아래 함수에 code 입력');

async function getRefreshToken(authCode) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: authCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  });
  const data = await response.json();
  console.log('Refresh Token:', data.refresh_token);
  return data.refresh_token;
}
```

---

## 🎯 현재 가지고 있는 정보

### ✅ 이미 설정된 것들
```env
# GA4 설정
GA4_PROPERTY_ID=497433231 ✅
GOOGLE_SERVICE_ACCOUNT_EMAIL=masgolf-ga4-reader@academic-moon-454803-i8.iam.gserviceaccount.com ✅
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----..." ✅

# Google Ads Customer IDs
GOOGLE_ADS_MANAGER_CUSTOMER_ID=7571427013 ✅
GOOGLE_ADS_MASGOLF1_ID=7398653521 ✅
GOOGLE_ADS_MASGOLF2_ID=6417483168 ✅
GOOGLE_ADS_SINGSING_ID=4495437776 ✅
```

### ❌ 필요한 것들
```env
# Google Ads API 인증 정보
GOOGLE_ADS_CLIENT_ID=your-client-id
GOOGLE_ADS_CLIENT_SECRET=your-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=your-developer-token
GOOGLE_ADS_REFRESH_TOKEN=your-refresh-token
```

---

## ⚠️ 주의사항

### Developer Token 승인 과정
- **신청 후 1-2일 소요**
- **Google 검토 필요**
- **MCC 계정에서만 신청 가능**

### 보안 주의사항
- **Refresh Token은 만료되지 않음** → 안전하게 보관
- **Client Secret은 절대 공개 금지**
- **Production 환경에서만 사용**

---

## 🚀 설정 완료 후 테스트

### 환경변수 설정 후
```bash
# 로컬에서 테스트
curl http://localhost:3000/api/test-google-ads-connection

# 응답 예시
{
  "status": "✅ Google Ads 연결 준비 완료",
  "setupProgress": "5/5"
}
```

### Vercel 배포용
```bash
# Vercel Dashboard → Settings → Environment Variables
GOOGLE_ADS_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-abcd1234efgh5678
GOOGLE_ADS_DEVELOPER_TOKEN=ABcdeFGhiJKlmnOP1234567890
GOOGLE_ADS_REFRESH_TOKEN=1//abcd-efgh-ijkl-mnop
```

---

## 📞 도움이 필요하다면

1. **Google Cloud Console 접근 문제**: 광교골프 계정 관리자 권한 확인
2. **Developer Token 승인 지연**: Google Ads 고객지원 문의
3. **OAuth 설정 문제**: 리다이렉트 URI 정확성 확인

**예상 소요 시간: 30분 ~ 2일 (Developer Token 승인 대기 시간 포함)**