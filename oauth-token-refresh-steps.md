# OAuth 토큰 재발급 단계별 가이드

## 🚨 현재 상황
- Google Ads API Compliance 팀에 문의 완료
- 응답 대기 중 (1-3 영업일)
- 임시 해결책으로 OAuth 토큰 재발급 필요

## 🔧 OAuth 2.0 Playground에서 새 토큰 발급

### 1단계: OAuth 2.0 Playground 접속
```
https://developers.google.com/oauthplayground/
```

### 2단계: OAuth 설정
1. **좌측 상단 "OAuth 2.0 configuration" 클릭**
2. **"Use your own OAuth credentials" 체크**
3. **Client ID 입력**: `983521706836-kquos2td8pb98kg0qi2hbmadad2jn18s.apps.googleusercontent.com`
4. **Client Secret 입력**: `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`

### 3단계: OAuth 범위 설정
**좌측 패널에서 다음 범위 입력:**
```
https://www.googleapis.com/auth/adwords
```

### 4단계: 인증 진행
1. **"Authorize APIs" 버튼 클릭**
2. **Google 계정으로 로그인** (taksoo.kim@gmail.com)
3. **권한 승인**

### 5단계: 토큰 교환
1. **"Exchange authorization code for tokens" 버튼 클릭**
2. **Refresh Token 복사** (새로운 토큰)

## 🔄 환경변수 업데이트

### 로컬 환경 (.env.local)
```bash
# 기존 토큰 백업
cp .env.local .env.local.backup

# 새 토큰으로 업데이트
GOOGLE_ADS_REFRESH_TOKEN=새로_발급받은_토큰
```

### Vercel 환경변수 업데이트
1. **Vercel Dashboard 접속**: https://vercel.com/dashboard
2. **프로젝트 선택**: win-masgolf-co-kr
3. **Settings → Environment Variables**
4. **GOOGLE_ADS_REFRESH_TOKEN 업데이트**

## 🧪 테스트 실행

### 로컬 테스트
```bash
node test-google-ads-local.js
```

### 관리자 페이지 테스트
1. **로컬 서버 실행**: `npm run dev`
2. **관리자 페이지 접속**: http://localhost:3000/admin/
3. **Google Ads 관리 탭 클릭**
4. **"진단 실행" 버튼 클릭**

## 📋 체크리스트

- [ ] OAuth 2.0 Playground에서 새 토큰 발급
- [ ] .env.local 파일 업데이트
- [ ] Vercel 환경변수 업데이트
- [ ] 로컬 테스트 실행
- [ ] 관리자 페이지에서 진단 실행
- [ ] Google 응답 대기 (1-3 영업일)

## 🎯 예상 결과

### 성공 시
- API 연결 성공
- 실제 Google Ads 데이터 표시
- "모의 데이터" 경고 사라짐

### 실패 시
- 여전히 authentication_error: 29
- Google 응답 대기 필요
- 계정 권한 문제 확인 필요
