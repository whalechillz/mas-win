# win.masgolf.co.kr

마스골프 웹사이트 프로젝트입니다.

## 📁 프로젝트 구조

```
win.masgolf.co.kr/
├── docs/                           # 📚 문서화 폴더
│   ├── sms-troubleshooting.md     # SMS 관련 문제 해결 가이드
│   ├── solapi-integration.md      # Solapi 통합 가이드
│   └── common-issues.md           # 자주 발생하는 문제들
├── pages/
│   ├── api/
│   │   ├── test-sms.js            # SMS 테스트 API
│   │   └── channels/sms/send.js   # SMS 발송 API
│   └── test-sms.tsx               # SMS 테스트 페이지
├── utils/
│   └── solapiSignature.js         # Solapi HMAC-SHA256 서명 생성
└── README.md
```

## 🚀 빠른 시작

### 1. 환경 설정
```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local)
SOLAPI_API_KEY=your_api_key_here
SOLAPI_API_SECRET=your_api_secret_here
SOLAPI_SENDER=031-215-0013
```

### 2. 로컬 개발 서버 시작
```bash
npm run dev
```

### 3. SMS 테스트
- 브라우저에서 `http://localhost:3000/test-sms` 접속
- 전화번호와 메시지 입력 후 "SMS 발송" 버튼 클릭

## 📚 중요 문서

### SMS 관련 문제 해결
- **[SMS 문제 해결 가이드](docs/sms-troubleshooting.md)** - SMS 발송 관련 자주 발생하는 문제들과 해결 방법
- **[Solapi 통합 가이드](docs/solapi-integration.md)** - Solapi API 통합 방법과 코드 예시
- **[자주 발생하는 문제들](docs/common-issues.md)** - 전체적인 문제 해결 가이드

## 🔧 주요 기능

### SMS 발송
- Solapi v4 API 사용
- HMAC-SHA256 인증
- 환경 변수 자동 정리 (줄바꿈 문자 제거)
- 실시간 테스트 페이지 제공

### 테스트 페이지
- `/test-sms` - SMS 발송 테스트
- 실시간 결과 확인
- 에러 메시지 표시

## 🚨 주의사항

### 환경 변수 설정
- Vercel 환경 변수 설정 시 앞뒤 공백, 줄바꿈 문자 제거
- `.env.local` 파일도 동일하게 관리

### API 사용
- Solapi v4 API만 사용 (v3는 더 이상 지원되지 않음)
- `message` 단일 객체 구조 사용 (배열 아님)
- ISO 8601 date 형식 사용

### 배포
- 모든 도메인이 동일한 코드베이스 공유
- `masgolf.co.kr`, `win.masgolf.co.kr`, `muziik.masgolf.co.kr` 등

## 🧪 테스트 방법

### 로컬 테스트
```bash
curl -X POST http://localhost:3000/api/test-sms/ \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "010-6669-9000", "message": "테스트 메시지"}'
```

### 배포 테스트
- `https://win.masgolf.co.kr/test-sms`
- `https://masgolf.co.kr/test-sms`

## 📞 지원

문제가 발생하면 다음 문서를 참조하세요:
1. [SMS 문제 해결 가이드](docs/sms-troubleshooting.md)
2. [자주 발생하는 문제들](docs/common-issues.md)
3. [Solapi 통합 가이드](docs/solapi-integration.md)

---

**개발자**: AI Assistant  
**최종 업데이트**: 2025-10-29  
**버전**: 1.0