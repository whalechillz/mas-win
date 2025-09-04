# Google Ads API Refresh Token 재발급 가이드

## 🔍 현재 상황

**진단 결과:**
- ✅ Customer ID: `7571427013` (광교골프 관리자) - 올바르게 설정됨
- ✅ 환경변수: 모두 유효함
- ✅ API 클라이언트 초기화: 성공
- ✅ Customer 객체 생성: 성공
- ❌ API 쿼리 테스트: 실패

**추정 원인:** Refresh Token 만료

## 🔧 해결 방법

### 1. Google Ads API OAuth 토큰 재발급

#### 방법 1: Google OAuth 2.0 Playground 사용

1. **Google OAuth 2.0 Playground 접속**
   - URL: https://developers.google.com/oauthplayground/

2. **OAuth 2.0 설정**
   - 좌측 상단의 설정 아이콘 클릭
   - "Use your own OAuth credentials" 체크
   - Client ID: `your_client_id.apps.googleusercontent.com`
   - Client Secret: `GOCSPX-your_client_secret`

3. **API 스코프 선택**
   - 좌측에서 "Google Ads API" 검색
   - `https://www.googleapis.com/auth/adwords` 선택

4. **인증 진행**
   - "Authorize APIs" 버튼 클릭
   - Google 계정으로 로그인
   - 권한 승인

5. **Refresh Token 획득**
   - "Exchange authorization code for tokens" 버튼 클릭
   - 새로 발급된 Refresh Token 복사

#### 방법 2: 직접 OAuth 2.0 플로우 구현

```javascript
// OAuth 2.0 인증 URL 생성
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${REDIRECT_URI}&` +
  `scope=https://www.googleapis.com/auth/adwords&` +
  `response_type=code&` +
  `access_type=offline&` +
  `prompt=consent`;

// 인증 코드를 Refresh Token으로 교환
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: AUTH_CODE,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  }),
});
```

### 2. Vercel 환경변수 업데이트

새로 발급받은 Refresh Token을 Vercel에 업데이트:

```bash
GOOGLE_ADS_REFRESH_TOKEN=새로_발급받은_refresh_token
```

### 3. 테스트 및 확인

환경변수 업데이트 후:

1. **배포 완료 대기** (약 1-2분)
2. **관리자 대시보드**에서 진단 도구 실행
3. **API 연결 성공** 확인

## 🎯 예상 결과

Refresh Token 재발급 후:
- ✅ API 쿼리 테스트 성공
- ✅ 실제 Google Ads 데이터 수집
- ✅ 관리자 대시보드에서 실시간 데이터 표시
- ✅ "모의 데이터" 표시 제거

## 📞 문제 해결

만약 여전히 문제가 발생한다면:

1. **Client ID/Secret 확인**: OAuth 2.0 설정이 올바른지 확인
2. **스코프 확인**: `https://www.googleapis.com/auth/adwords` 스코프 포함
3. **계정 권한 확인**: Customer ID에 대한 API 접근 권한 확인
4. **로그 확인**: Vercel 함수 로그에서 상세 오류 확인

## 🔄 다음 단계

1. **Refresh Token 재발급** (OAuth 2.0 Playground 사용 권장)
2. **Vercel 환경변수 업데이트**
3. **배포 완료 대기**
4. **API 연결 테스트**
5. **실제 데이터 확인**

**Refresh Token 재발급이 Google Ads API 연결 문제의 핵심 해결책입니다!** 🎯
