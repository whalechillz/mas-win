# Solapi 통합 가이드

## 📋 개요
이 문서는 Solapi SMS/MMS API를 Next.js 프로젝트에 통합하는 방법을 설명합니다.

## 🔑 환경 변수 설정

### Vercel 환경 변수
```bash
SOLAPI_API_KEY=your_api_key_here
SOLAPI_API_SECRET=your_api_secret_here
SOLAPI_SENDER=031-215-0013
```

### .env.local (로컬 개발용)
```bash
SOLAPI_API_KEY=your_api_key_here
SOLAPI_API_SECRET=your_api_secret_here
SOLAPI_SENDER=031-215-0013
```

## 🛠️ 핵심 컴포넌트

### 1. HMAC-SHA256 서명 생성 유틸리티
**파일**: `utils/solapiSignature.js`

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

### 2. SMS 발송 API
**파일**: `pages/api/test-sms.js`

```javascript
import { createClient } from '@supabase/supabase-js';
import { createSolapiSignature } from '../../utils/solapiSignature.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SOLAPI_API_KEY = process.env.SOLAPI_API_KEY || "";
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET || "";
const SOLAPI_SENDER = process.env.SOLAPI_SENDER || "";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ success: false, message: '전화번호와 메시지는 필수입니다.' });
    }

    if (!SOLAPI_API_KEY || !SOLAPI_API_SECRET || !SOLAPI_SENDER) {
      return res.status(500).json({ success: false, message: 'SMS 서비스 설정이 완료되지 않았습니다.' });
    }

    // 전화번호 정리
    const cleanPhone = phoneNumber.replace(/[\-\s]/g, '');
    const cleanSender = SOLAPI_SENDER.replace(/[\-\s]/g, '');

    // Solapi v4 API로 단순 발송
    const authHeaders = createSolapiSignature(SOLAPI_API_KEY, SOLAPI_API_SECRET);

    const response = await fetch('https://api.solapi.com/messages/v4/send', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        message: {
          to: cleanPhone,
          from: cleanSender,
          text: message,
          type: 'SMS'
        }
      })
    });

    const result = await response.json();
    console.log('Solapi 응답:', result);

    if (!response.ok) {
      throw new Error(`Solapi API 오류: ${response.status} - ${JSON.stringify(result)}`);
    }

    return res.status(200).json({ success: true, result, message: 'SMS 발송 요청 성공' });

  } catch (error) {
    console.error('SMS 발송 오류:', error);
    return res.status(500).json({ success: false, message: 'SMS 발송 중 오류가 발생했습니다.', error: error.message });
  }
}
```

## 🧪 테스트 페이지
**파일**: `pages/test-sms.tsx`

```typescript
import React, { useState } from 'react';

export default function TestSMS() {
  const [phoneNumber, setPhoneNumber] = useState('010-6669-9000');
  const [message, setMessage] = useState('테스트 메시지입니다.');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSendSMS = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, message }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({ success: false, message: '클라이언트 오류 발생', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span role="img" aria-label="mobile phone" className="mr-2">📱</span> SMS 테스트
        </h1>

        <div className="mb-4">
          <label htmlFor="phoneNumber" className="block text-gray-700 text-sm font-bold mb-2">
            전화번호
          </label>
          <input
            type="text"
            id="phoneNumber"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="예: 010-1234-5678"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">
            메시지
          </label>
          <textarea
            id="message"
            rows={4}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="테스트 메시지를 입력하세요."
          ></textarea>
        </div>

        <button
          onClick={handleSendSMS}
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? '발송 중...' : 'SMS 발송'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-2">결과:</h2>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap break-all">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 🔍 API 엔드포인트

### Solapi v4 API
- **단일 메시지 발송**: `https://api.solapi.com/messages/v4/send`
- **그룹 메시지 발송**: `https://api.solapi.com/messages/v4/groups`

### 프로젝트 API
- **SMS 테스트**: `/api/test-sms`
- **SMS 발송**: `/api/channels/sms/send`

## 📊 응답 코드

### 성공 응답
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

### 에러 응답
```json
{
  "success": false,
  "message": "SMS 발송 중 오류가 발생했습니다.",
  "error": "구체적인 오류 메시지"
}
```

## 🚨 주의사항

1. **환경 변수 관리**: API Key와 Secret에 줄바꿈 문자가 포함되지 않도록 주의
2. **API 버전**: Solapi v4 API만 사용 (v3는 더 이상 지원되지 않음)
3. **메시지 구조**: v4 API는 `message` 단일 객체를 요구 (배열 아님)
4. **날짜 형식**: ISO 8601 형식 사용 (`toISOString()`)
5. **헤더 정리**: Authorization 헤더에서 줄바꿈 문자 제거

## 📞 지원
- 개발자: AI Assistant
- 최종 업데이트: 2025-10-29
- 버전: 1.0
