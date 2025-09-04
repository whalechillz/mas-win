# Google Ads API Customer ID 수정 가이드

## 🔍 문제 진단 결과

플레이라이트를 통해 Google Ads API 센터에 접속하여 확인한 결과:

### ✅ 확인된 정보
- **개발자 토큰**: `SuzbNF-lwuyiXz040NdIlQ`
- **액세스 수준**: `기본 액세스` (프로덕션 사용 가능)
- **API 연락처 이메일**: `taksoo.kim@gmail.com`
- **회사 이름**: `MASGOLF`
- **회사 URL**: `https://win.masgolf.co.kr`

### 📊 사용 가능한 Customer ID 목록
1. **MASGOLF2**: `641-748-3168` (6417483168) - **활성 계정** ⭐
2. **광교골프 관리자**: `757-142-7013` (7571427013) - 관리자 계정
3. **마쓰구 1**: `739-865-3521` (7398653521)
4. **싱싱골프**: `449-543-7776` (4495437776)
5. **마쓰구 3**: `638-685-2846` (6386852846) - 취소됨

## 🔧 해결 방법

### 1. Vercel 환경변수 업데이트

Vercel 대시보드에서 다음 환경변수를 업데이트하세요:

```bash
# 현재 설정 (추정)
GOOGLE_ADS_CUSTOMER_ID=현재_설정된_ID

# 새로운 설정 (MASGOLF2 계정 사용)
GOOGLE_ADS_CUSTOMER_ID=6417483168
```

### 2. 환경변수 확인

다음 환경변수들이 올바르게 설정되어 있는지 확인하세요:

```bash
GOOGLE_ADS_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-your_client_secret
GOOGLE_ADS_DEVELOPER_TOKEN=SuzbNF-lwuyiXz040NdIlQ
GOOGLE_ADS_CUSTOMER_ID=6417483168
GOOGLE_ADS_REFRESH_TOKEN=1//your_refresh_token
```

### 3. 테스트 방법

환경변수 업데이트 후 다음 API를 호출하여 테스트하세요:

```bash
curl "https://win.masgolf.co.kr/api/debug/google-ads-detailed-test"
```

### 4. 예상 결과

성공 시 다음과 같은 응답을 받을 수 있습니다:

```json
{
  "step": "API 쿼리 테스트",
  "status": "성공",
  "message": "Google Ads API 연결 성공",
  "data": {
    "accountInfo": {
      "customer.id": "6417483168",
      "customer.descriptive_name": "MASGOLF2",
      "customer.currency_code": "KRW",
      "customer.time_zone": "Asia/Seoul"
    }
  }
}
```

## 🎯 권장사항

1. **MASGOLF2 계정 (6417483168) 사용**: 플레이라이트에서 확인한 활성 계정
2. **환경변수 업데이트**: Vercel 대시보드에서 즉시 업데이트
3. **테스트 실행**: 업데이트 후 API 테스트로 확인
4. **관리자 대시보드 확인**: Google Ads 관리 탭에서 실제 데이터 확인

## 📞 문제 해결

만약 여전히 문제가 발생한다면:

1. **Refresh Token 확인**: OAuth 토큰이 유효한지 확인
2. **권한 확인**: Customer ID에 대한 API 접근 권한 확인
3. **로그 확인**: Vercel 함수 로그에서 상세 오류 확인

## 🔄 다음 단계

Customer ID 수정 후:
1. Google Ads 관리 탭에서 실제 데이터 확인
2. 캠페인 성과 데이터 수집 확인
3. 실시간 데이터 업데이트 확인
