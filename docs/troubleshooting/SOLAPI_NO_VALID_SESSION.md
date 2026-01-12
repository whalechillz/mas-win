# Solapi "No valid session" 오류 원인 및 해결 방법

## 🔴 오류 현상
- 감사 메시지 발송 시 "No valid session" 오류 발생
- API는 200 OK를 반환하지만 실제 발송은 실패 (0건 성공, 1건 실패)

## 🔍 원인 분석

### 1. 환경 변수 미설정
- `SOLAPI_API_KEY`: 미설정 또는 빈 문자열
- `SOLAPI_API_SECRET`: 미설정 또는 빈 문자열  
- `SOLAPI_SENDER`: 미설정 또는 빈 문자열

### 2. 환경 변수 검증 로직 문제
- 기존 검증: `!SOLAPI_API_KEY`만 체크
- 문제: 빈 문자열(`""`)은 `!SOLAPI_API_KEY`가 `false`가 되어 검증 통과
- 결과: 빈 값으로 Solapi API에 요청 전송 → "No valid session" 오류

### 3. 오류 발생 흐름
```
1. 환경 변수가 빈 문자열("")로 설정됨
2. 환경 변수 검증 통과 (빈 문자열은 truthy로 간주되지 않지만, || 연산자로 인해 통과)
3. createSolapiSignature() 함수가 빈 값으로 인증 헤더 생성
4. Solapi API에 빈 인증 정보로 요청 전송
5. Solapi API가 "No valid session" 오류 반환
```

## ✅ 해결 방법

### 1. 환경 변수 설정 확인
`.env.local` 파일에 다음 변수가 올바르게 설정되어 있는지 확인:

```bash
SOLAPI_API_KEY=your_actual_api_key_here
SOLAPI_API_SECRET=your_actual_api_secret_here
SOLAPI_SENDER=031-215-0013
```

### 2. 환경 변수 검증 강화 (수정 완료)
- 빈 문자열도 체크하도록 수정
- `.trim()`으로 공백만 있는 경우도 체크
- 명확한 오류 메시지 제공

### 3. 서버 재시작
환경 변수를 수정한 후 Next.js 개발 서버를 재시작:

```bash
# 서버 종료 후
npm run dev
```

### 4. Solapi 대시보드 확인
- Solapi 대시보드에서 API 키/시크릿이 유효한지 확인
- 만료되었거나 변경된 경우 새로 발급받아 환경 변수 업데이트

## 📝 수정된 코드

### `pages/api/channels/sms/send.js`
```javascript
// 환경 변수 검증 (빈 문자열도 체크)
if (!SOLAPI_API_KEY || !SOLAPI_API_KEY.trim() || 
    !SOLAPI_API_SECRET || !SOLAPI_API_SECRET.trim() || 
    !SOLAPI_SENDER || !SOLAPI_SENDER.trim()) {
  console.error('🔴 솔라피 환경 변수 누락 또는 빈 값:', {
    hasApiKey: !!SOLAPI_API_KEY && SOLAPI_API_KEY.trim().length > 0,
    hasApiSecret: !!SOLAPI_API_SECRET && SOLAPI_API_SECRET.trim().length > 0,
    hasSender: !!SOLAPI_SENDER && SOLAPI_SENDER.trim().length > 0,
    apiKeyLength: SOLAPI_API_KEY?.length || 0,
    apiSecretLength: SOLAPI_API_SECRET?.length || 0,
    senderLength: SOLAPI_SENDER?.length || 0
  });
  return res.status(500).json({ 
    success: false, 
    message: 'SMS 서비스 설정이 완료되지 않았습니다. 환경 변수 SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER를 확인해주세요.',
    error: 'ENV_VARIABLES_MISSING',
    hint: '.env.local 파일에 Solapi 환경 변수가 올바르게 설정되어 있는지 확인해주세요.'
  });
}
```

## 🧪 테스트 방법

1. 환경 변수 확인:
```bash
node -e "console.log('SOLAPI_API_KEY:', process.env.SOLAPI_API_KEY ? '설정됨' : '미설정');"
```

2. 감사 메시지 발송 테스트:
   - 설문 조사 관리 페이지에서 "감사 메시지" 버튼 클릭
   - 오류 메시지 확인 (환경 변수가 없으면 명확한 오류 메시지 표시)

## 📅 수정 일자
2026-01-09
