# SMS 발송 문제 해결 가이드

## 🚨 자주 발생하는 문제들

### 1. 환경 변수에 줄바꿈 문자 포함
**문제**: `Invalid character in header content ["Authorization"]`
**원인**: `SOLAPI_API_KEY` 또는 `SOLAPI_API_SECRET`에 `\n` 문자가 포함됨
**해결**: `utils/solapiSignature.js`에서 자동으로 제거하도록 구현됨

```javascript
// utils/solapiSignature.js
const cleanApiKey = String(apiKey).replace(/[\s\n\r\t\f\v]/g, '').trim();
const cleanApiSecret = String(apiSecret).replace(/[\s\n\r\t\f\v]/g, '').trim();
```

### 2. 잘못된 Solapi API 버전 사용
**문제**: `404 - Cannot POST /messages/v3/send`
**원인**: v3 엔드포인트 사용 (더 이상 지원되지 않음)
**해결**: v4 API 사용

```javascript
// ❌ 잘못된 방법
fetch('https://api.solapi.com/messages/v3/send')

// ✅ 올바른 방법
fetch('https://api.solapi.com/messages/v4/send')
```

### 3. 잘못된 메시지 페이로드 구조
**문제**: `"message" 필수입니다.], "messages" 사용할 수 없습니다.`
**원인**: v4 API는 `messages` 배열이 아닌 `message` 단일 객체를 요구
**해결**: 단일 `message` 객체 사용

```javascript
// ❌ 잘못된 방법
{
  messages: [{ to: "...", from: "...", text: "..." }]
}

// ✅ 올바른 방법
{
  message: { to: "...", from: "...", text: "..." }
}
```

### 4. 잘못된 date 형식
**문제**: `"date" must be a valid ISO 8601 date`
**원인**: Unix timestamp 사용
**해결**: ISO 8601 형식 사용

```javascript
// ❌ 잘못된 방법
const date = Math.floor(Date.now() / 1000).toString();

// ✅ 올바른 방법
const date = new Date().toISOString();
```

### 5. Next.js API 라우트 export 방식
**문제**: `Page /api/test-sms does not export a default function`
**원인**: CommonJS 방식 사용
**해결**: ES6 모듈 방식 사용

```javascript
// ❌ 잘못된 방법
module.exports = async function handler(req, res) { ... }

// ✅ 올바른 방법
export default async function handler(req, res) { ... }
```

## 🔧 해결된 코드 구조

### utils/solapiSignature.js
```javascript
import crypto from 'crypto';

export function createSolapiSignature(apiKey, apiSecret) {
  // API Key와 Secret에서 모든 공백, 줄바꿈, 탭 문자 제거
  const cleanApiKey = String(apiKey).replace(/[\s\n\r\t\f\v]/g, '').trim();
  const cleanApiSecret = String(apiSecret).replace(/[\s\n\r\t\f\v]/g, '').trim();
  
  // ISO 8601 형식 사용
  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const data = date + salt;
  const signature = crypto.createHmac('sha256', cleanApiSecret).update(data).digest('hex');
  
  // 헤더 값에서 줄바꿈, 탭 문자만 제거 (공백은 유지)
  const authHeader = `HMAC-SHA256 apiKey=${cleanApiKey}, date=${date}, salt=${salt}, signature=${signature}`.replace(/[\n\r\t\f\v]/g, '');
  
  return {
    'Authorization': authHeader,
    'Content-Type': 'application/json'
  };
}
```

### pages/api/test-sms.js
```javascript
import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../utils/solapiSignature.js';

// ... 환경 변수 설정 ...

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { phoneNumber, message } = req.body;
    
    // ... 유효성 검사 ...
    
    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET),
      body: JSON.stringify({
        message: {  // ← messages 배열이 아닌 message 객체
          to: cleanPhone,
          from: cleanSender,
          text: message,
          type: 'SMS'
        }
      })
    });

    // ... 응답 처리 ...
  } catch (error) {
    // ... 에러 처리 ...
  }
}
```

## 🧪 테스트 방법

### 1. 로컬 테스트
```bash
curl -X POST http://localhost:3000/api/test-sms/ \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "010-6669-9000",
    "message": "테스트 메시지"
  }'
```

### 2. 배포된 버전 테스트
- `https://win.masgolf.co.kr/test-sms`
- `https://masgolf.co.kr/test-sms`

## 📋 체크리스트

### 새로운 SMS 기능 개발 시:
- [ ] Solapi v4 API 사용
- [ ] `message` 단일 객체 구조 사용
- [ ] `createSolapiSignature` 함수 사용
- [ ] ES6 모듈 형식 사용
- [ ] `/test-sms`에서 테스트

### 환경 변수 설정 시:
- [ ] 앞뒤 공백 제거
- [ ] 줄바꿈 문자 제거
- [ ] Vercel에서 설정 후 테스트

### 배포 후:
- [ ] `/test-sms` 페이지에서 테스트
- [ ] 실제 SMS 수신 확인
- [ ] 로그에서 오류 확인

## 🚀 성공 응답 예시
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

## 📞 연락처
- 개발자: AI Assistant
- 최종 업데이트: 2025-10-29
- 버전: 1.0
