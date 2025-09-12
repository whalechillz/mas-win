# Google Ads API OAuth 토큰 재발급 가이드

## 🚨 현재 문제
- **오류**: `invalid_client (401 Unauthorized)`
- **원인**: OAuth Refresh Token 만료 또는 인증 설정 문제

## 🔧 해결 방법

### 1. OAuth 2.0 Playground에서 새 토큰 발급

1. **OAuth 2.0 Playground 접속**
   - https://developers.google.com/oauthplayground/

2. **OAuth 범위 설정**
   ```
   https://www.googleapis.com/auth/adwords
   ```

3. **클라이언트 ID 설정**
   - 우측 상단 "Settings" 클릭
   - "Use your own OAuth credentials" 체크
   - Client ID: `983521706836-kquos2td8pb98kg0qi2hbmadad2jn18s.apps.googleusercontent.com`
   - Client Secret: `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`

4. **인증 진행**
   - "Authorize APIs" 클릭
   - Google 계정으로 로그인
   - 권한 승인

5. **토큰 교환**
   - "Exchange authorization code for tokens" 클릭
   - **Refresh Token** 복사

### 2. 환경변수 업데이트

```bash
# .env.local 파일에서 업데이트
GOOGLE_ADS_REFRESH_TOKEN=새로_발급받은_토큰
```

### 3. Vercel 환경변수 업데이트

1. **Vercel Dashboard 접속**
   - https://vercel.com/dashboard

2. **프로젝트 선택**
   - win-masgolf-co-kr

3. **Settings → Environment Variables**
   - `GOOGLE_ADS_REFRESH_TOKEN` 업데이트

### 4. 테스트

```bash
# 로컬 테스트
node test-google-ads-local.js

# 관리자 페이지에서 진단 실행
http://localhost:3000/admin/
```

## 📋 체크리스트

- [ ] OAuth 2.0 Playground에서 새 토큰 발급
- [ ] .env.local 파일 업데이트
- [ ] Vercel 환경변수 업데이트
- [ ] 로컬 테스트 실행
- [ ] 관리자 페이지에서 진단 실행
- [ ] 실제 데이터 확인

## 🔍 추가 확인사항

### Google Cloud Console 설정
1. **API 및 서비스 → 사용 설정된 API**
   - Google Ads API 활성화 확인

2. **OAuth 2.0 클라이언트 ID**
   - 승인된 리디렉션 URI에 `http://localhost:3000` 추가
   - 승인된 JavaScript 원본에 `http://localhost:3000` 추가

### Google Ads API Center
1. **Developer Token 상태**
   - 승인 상태 확인
   - 테스트 계정에서 프로덕션으로 변경 필요시

2. **계정 권한**
   - Customer ID `6412482148`에 대한 API 접근 권한 확인
