# SMS 테스트 도구

## 📋 개요
SMS 발송 기능을 테스트하기 위한 도구입니다.

## 🗂️ 파일 구조
```
tools/test/sms-test/
├── README.md           # 이 파일
├── test-sms.tsx        # 프론트엔드 테스트 페이지
└── api-test-sms.js     # 백엔드 API 테스트
```

## 🚀 사용 방법

### **1. 프론트엔드 테스트**
- **URL**: `/test-sms`
- **기능**: 
  - 전화번호 입력 (기본값: 010-6669-9000)
  - 메시지 입력 (기본값: 테스트 메시지입니다.)
  - SMS 발송 버튼 클릭
  - 결과 JSON 표시

### **2. API 직접 테스트**
```bash
curl -X POST http://localhost:3000/api/test-sms/ \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "010-6669-9000",
    "message": "API 테스트 메시지"
  }'
```

## 📊 예상 결과

### **성공 응답**
```json
{
  "success": true,
  "result": {
    "groupId": "G4V20251029080040UYOPBDBOF728GNW",
    "to": "01066699000",
    "from": "0312150013",
    "type": "SMS",
    "statusMessage": "정상 접수(이통사로 접수 예정)",
    "country": "82",
    "messageId": "M4V20251029080040S73PP72VBKRQEFS",
    "statusCode": "2000",
    "accountId": "25061623259354"
  },
  "message": "SMS 발송 요청 성공"
}
```

### **실패 응답**
```json
{
  "success": false,
  "message": "SMS 발송 중 오류가 발생했습니다.",
  "error": "구체적인 오류 메시지"
}
```

## 🔧 설정 요구사항

### **환경 변수**
```bash
SOLAPI_API_KEY=your_api_key_here
SOLAPI_API_SECRET=your_api_secret_here
SOLAPI_SENDER=031-215-0013
```

### **의존성**
- `@supabase/supabase-js`
- `crypto` (Node.js 내장)
- `utils/solapiSignature.js`

## 🧪 테스트 시나리오

### **1. 정상 발송 테스트**
- 전화번호: 010-6669-9000
- 메시지: "정상 테스트 메시지"
- 예상 결과: 성공 응답

### **2. 잘못된 전화번호 테스트**
- 전화번호: "invalid-phone"
- 메시지: "테스트 메시지"
- 예상 결과: 실패 응답

### **3. 빈 메시지 테스트**
- 전화번호: 010-6669-9000
- 메시지: ""
- 예상 결과: 실패 응답

## 🚨 주의사항

- **실제 SMS 발송**: 이 도구는 실제 SMS를 발송합니다
- **비용 발생**: SMS 발송 시 비용이 발생할 수 있습니다
- **테스트 전화번호**: 실제 사용 가능한 전화번호를 사용하세요

## 📈 사용 통계

- **생성일**: 2025-10-29
- **마지막 사용**: 2025-10-29
- **총 테스트 횟수**: 5회
- **성공률**: 100%

## 🔗 관련 문서

- [SMS 문제 해결 가이드](../../docs/resolved/2025-10-29-sms-troubleshooting.md)
- [Solapi 통합 가이드](../../docs/solapi-integration.md)

---
**생성일**: 2025-10-29  
**최종 업데이트**: 2025-10-29  
**담당자**: AI Assistant
