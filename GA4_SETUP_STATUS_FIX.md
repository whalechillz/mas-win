# 🚨 GA4 디버그 페이지 설정 상태 해결

## 현재 문제
- **서비스 계정 이메일**: ❌ 없음
- **서비스 계정 키**: ❌ 없음
- **GA4 속성 ID**: ✅ 497433231 (기본값 사용 중)

## 📌 즉시 해결 방법

### 방법 1: 기존 서비스 계정이 있는 경우

이미 Google Cloud에서 `masgolf-ga4-reader` 서비스 계정을 만들었다면:

1. **서비스 계정 키 다시 다운로드**
   - https://console.cloud.google.com/iam-admin/serviceaccounts
   - 서비스 계정 클릭 > Keys 탭 > Add Key > Create new key > JSON

2. **.env.local에 추가**
   ```bash
   # Google Analytics 4
   GOOGLE_SERVICE_ACCOUNT_EMAIL=masgolf-ga4-reader@your-project.iam.gserviceaccount.com
   GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

### 방법 2: 새로 만들기

```bash
# 가이드 실행
chmod +x setup-ga4-service-account.sh
./setup-ga4-service-account.sh
```

## 🔍 스크롤 문제는 해결됨
- 페이지 하단 여백 추가
- 전체 화면 스크롤 가능

## 📊 설정 완료 후 보게 될 것
- 서비스 계정 이메일: ✅ 설정됨
- 서비스 계정 키: ✅ 설정됨
- GA4 속성 ID: ✅ 497433231
- **실제 Google Analytics 데이터** 표시

## ⚠️ 중요: Vercel 배포 시
Vercel Dashboard > Settings > Environment Variables에서도 추가:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_KEY`

## 🚀 다음 명령어
```bash
# 변경사항 커밋
git add . && git commit -m "fix: GA4 디버그 페이지 스크롤 문제 해결" && git push
```