# 자주 발생하는 문제 해결 가이드

## 🚨 SMS 관련 문제

### 1. Authorization 헤더 오류
**오류**: `Invalid character in header content ["Authorization"]`
**원인**: 환경 변수에 줄바꿈 문자(`\n`) 포함
**해결**: `utils/solapiSignature.js`에서 자동 제거

### 2. Solapi API 404 오류
**오류**: `Cannot POST /messages/v3/send`
**원인**: v3 API 사용 (더 이상 지원되지 않음)
**해결**: v4 API 사용 (`/messages/v4/send`)

### 3. 메시지 구조 오류
**오류**: `"message" 필수입니다.], "messages" 사용할 수 없습니다.`
**원인**: v4 API는 `messages` 배열이 아닌 `message` 객체 요구
**해결**: 단일 `message` 객체 사용

### 4. 날짜 형식 오류
**오류**: `"date" must be a valid ISO 8601 date`
**원인**: Unix timestamp 사용
**해결**: `new Date().toISOString()` 사용

## 🚨 Next.js 관련 문제

### 1. API 라우트 export 오류
**오류**: `Page /api/test-sms does not export a default function`
**원인**: CommonJS 방식 사용
**해결**: ES6 모듈 방식 사용

```javascript
// ❌ 잘못된 방법
module.exports = async function handler(req, res) { ... }

// ✅ 올바른 방법
export default async function handler(req, res) { ... }
```

### 2. 모듈 import 오류
**오류**: `Module not found: Can't resolve '../../../utils/solapiSignature'`
**원인**: 확장자 누락 또는 잘못된 경로
**해결**: `.js` 확장자 명시

```javascript
// ✅ 올바른 방법
import { createSolapiSignature } from '../../utils/solapiSignature.js';
```

### 3. Trailing Slash 리다이렉트
**오류**: `308 Permanent Redirect`
**원인**: Next.js의 trailing slash 처리
**해결**: URL에 trailing slash 추가

```bash
# ❌ 잘못된 방법
curl -X POST https://example.com/api/test-sms

# ✅ 올바른 방법
curl -X POST https://example.com/api/test-sms/
```

## 🚨 배포 관련 문제

### 1. 환경 변수 누락
**오류**: `SMS 서비스 설정이 완료되지 않았습니다`
**원인**: Vercel 환경 변수 미설정
**해결**: Vercel 대시보드에서 환경 변수 설정

### 2. 도메인 리다이렉트
**오류**: `Redirecting...`
**원인**: 도메인 간 리다이렉트 설정
**해결**: 올바른 도메인 사용

```bash
# 사용 가능한 도메인들
https://win.masgolf.co.kr/test-sms
https://masgolf.co.kr/test-sms
https://mas-win-git-main-taksoo-kims-projects.vercel.app/test-sms
```

## 🔧 해결 방법 체크리스트

### SMS 발송 문제 해결 순서
1. [ ] 환경 변수 확인 (줄바꿈 문자 제거)
2. [ ] Solapi v4 API 사용 확인
3. [ ] `message` 단일 객체 구조 확인
4. [ ] ISO 8601 date 형식 확인
5. [ ] ES6 모듈 export 확인
6. [ ] `/test-sms` 페이지에서 테스트

### 배포 문제 해결 순서
1. [ ] Vercel 환경 변수 설정 확인
2. [ ] 올바른 도메인 사용
3. [ ] Trailing slash 추가
4. [ ] 배포 완료 대기 (30-60초)
5. [ ] 실제 테스트 수행

## 📋 디버깅 명령어

### 로컬 테스트
```bash
# 로컬 서버 시작
npm run dev

# API 테스트
curl -X POST http://localhost:3000/api/test-sms/ \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "010-6669-9000", "message": "테스트"}'
```

### 배포 테스트
```bash
# Vercel 도메인 테스트
curl -X POST https://mas-win-git-main-taksoo-kims-projects.vercel.app/api/test-sms/ \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "010-6669-9000", "message": "테스트"}'
```

## 🚀 성공 확인 방법

### 1. API 응답 확인
```json
{
  "success": true,
  "result": {
    "statusMessage": "정상 접수(이통사로 접수 예정)",
    "statusCode": "2000"
  }
}
```

### 2. 실제 SMS 수신 확인
- 테스트 전화번호로 실제 SMS 수신
- Solapi 콘솔에서 발송 내역 확인

### 3. 로그 확인
- Vercel 로그에서 오류 메시지 확인
- 브라우저 개발자 도구에서 네트워크 탭 확인

## 📞 지원 정보
- 개발자: AI Assistant
- 최종 업데이트: 2025-10-29
- 버전: 1.0
