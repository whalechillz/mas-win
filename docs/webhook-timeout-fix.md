# 웹훅 타임아웃 문제 해결

## 📋 문제 상황

**발생 일시**: 2025-12-28  
**에러 메시지**: 
```
웹훅이 데이터 전달을 시도하였으나 실패하여 안내드립니다.
현재 실패 횟수: 4
다음 전달 시간: 2025-12-28 12:16:43
```

**웹훅 URL**: `https://win.masgolf.co.kr/api/solapi/webhook`

## 🔍 문제 원인

1. **외부 API 호출 지연**
   - 웹훅 핸들러 내부에서 Solapi API를 재조회할 때 타임아웃이 없음
   - `https://api.solapi.com/messages/v4/groups/${groupId}` 호출 시 응답이 지연되면 전체 웹훅 응답이 지연됨
   - Solapi 웹훅 서버는 일정 시간 내 응답이 없으면 실패로 처리

2. **영향 범위**
   - 웹훅 실패는 SMS/MMS **발송 자체에는 영향 없음** (발송은 독립적으로 동작)
   - 다만 `channel_sms` 테이블의 상태 업데이트가 지연되거나 누락될 수 있음
   - `contact_events` 기록이 누락될 수 있음

## ✅ 해결 방법

### 적용된 수정사항

**파일**: `pages/api/solapi/webhook.js`

1. **타임아웃 유틸리티 함수 추가** (11-30줄)
```javascript
const fetchWithTimeout = async (url, options, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`요청 시간 초과 (${timeoutMs}ms)`);
    }
    throw error;
  }
};
```

2. **Solapi API 호출에 타임아웃 적용** (217줄)
```javascript
// 기존
const groupInfoResponse = await fetch(
  `https://api.solapi.com/messages/v4/groups/${groupId}`,
  { method: 'GET', headers: authHeaders }
);

// 수정 후
const groupInfoResponse = await fetchWithTimeout(
  `https://api.solapi.com/messages/v4/groups/${groupId}`,
  { method: 'GET', headers: authHeaders },
  5000 // 5초 타임아웃
);
```

## 🎯 효과

- ✅ 웹훅 응답 지연 방지: Solapi API가 느려도 5초 후 자동 중단
- ✅ SMS/MMS 발송 안정성 유지: 웹훅 실패해도 발송 기능은 정상 동작
- ✅ 데이터 일관성 유지: 타임아웃 발생 시 기존 로직으로 폴백하여 처리 계속 진행

## 📊 배포 상태

**현재 상태**: ⚠️ **아직 커밋/배포되지 않음**

```bash
# 변경된 파일
pages/api/solapi/webhook.js (modified, not staged)

# 배포 전 확인사항
1. 로컬에서 테스트 완료
2. 타임아웃 발생 시 로그 확인
3. 웹훅 정상 동작 확인
```

## 🚀 배포 절차

1. 변경사항 커밋
```bash
git add pages/api/solapi/webhook.js
git commit -m "fix: 웹훅 타임아웃 문제 해결 - Solapi API 호출에 5초 타임아웃 적용"
```

2. 배포 (Vercel 자동 배포 또는 수동 배포)

3. 배포 후 확인
   - Solapi 웹훅 관리 페이지에서 실패 횟수 확인
   - 웹훅 로그에서 타임아웃 관련 메시지 확인

## 📝 참고사항

- **SMS/MMS 발송 기능**: 웹훅과 독립적으로 동작하므로 영향 없음
- **타임아웃 시간**: 5초로 설정 (필요시 조정 가능)
- **폴백 로직**: 타임아웃 발생 시 기존 시간 기반 검색 로직으로 자동 전환

## 🔗 관련 파일

- `pages/api/solapi/webhook.js` - 웹훅 핸들러
- `pages/api/channels/sms/send.js` - SMS 발송 API (독립 동작)

---
**작성일**: 2025-12-28  
**수정일**: 2025-12-28

