# 솔라피 그룹 ID 자동 연결 문제 해결

## 문제 상황

459번 메시지가 솔라피에서 재발송되었지만, SMS/MMS 관리 페이지의 "그룹 ID 자동 연결" 기능이 작동하지 않았습니다.

### 원인 분석

1. **시간 기반 검색의 한계**
   - "그룹 ID 자동 연결" 기능은 그룹 생성 시간 기준 ±10분 범위에서 `sent_at`으로만 메시지를 검색합니다.
   - 재발송의 경우:
     - 원래 발송 시간과 재발송 시간이 다를 수 있음
     - `sent_at`이 원래 발송 시간으로 설정되어 있을 수 있음
     - 재발송 시 그룹 생성 시간이 원래 발송 시간과 다름

2. **검색 범위 제한**
   - `sent_at`만 검색하여 `created_at`은 검색하지 않음
   - 재발송된 그룹의 생성 시간과 메시지의 `created_at`이 더 가까울 수 있음

## 해결 방법

### 1. 459번 메시지 수동 복구 ✅

**스크립트**: `scripts/fix-message-459-manual-update.js`

- 솔라피 대시보드에서 확인한 값으로 직접 업데이트:
  - 성공: 196건
  - 실패: 1건
  - 총: 200건
  - 그룹 ID: G4V20260120135037L2B2QM6MIE1TG09

### 2. "그룹 ID 자동 연결" 기능 개선 ✅

**파일**: `pages/api/admin/auto-link-solapi-groups.js`

**개선 사항**:
- `sent_at`과 `created_at` 모두로 검색하도록 변경
- 재발송 케이스에서도 메시지를 찾을 수 있도록 개선
- 중복 제거 로직 추가

**변경 전**:
```javascript
let query = supabase
  .from('channel_sms')
  .select('...')
  .gte('sent_at', startTime.toISOString())
  .lte('sent_at', endTime.toISOString())
```

**변경 후**:
```javascript
// sent_at과 created_at 모두로 검색
const [sentAtResult, createdAtResult] = await Promise.all([
  queryWithSentAt,
  queryWithCreatedAt
]);

const timeBasedMessages = [
  ...(sentAtResult.data || []),
  ...(createdAtResult.data || [])
].filter((msg, idx, self) => 
  idx === self.findIndex(m => m.id === msg.id)
); // 중복 제거
```

## 향후 개선 방안

1. **그룹 ID 패턴 매칭**
   - 그룹 ID의 타임스탬프 부분을 추출하여 더 정확한 매칭
   - 예: `G4V20260120135037...` → `2026-01-20 13:50:37`

2. **수신자 수 기반 매칭**
   - 그룹의 메시지 수와 DB의 수신자 수가 일치하는 메시지 찾기
   - 시간 범위 내에서 가장 가까운 메시지 선택

3. **개별 동기화 버튼 추가**
   - 각 메시지에 "개별 동기화" 버튼 추가
   - 특정 메시지 ID와 그룹 ID를 직접 지정하여 동기화

## 관련 파일

- `scripts/fix-message-459-manual-update.js`: 459번 메시지 수동 복구 스크립트
- `scripts/fix-message-459-solapi-sync.js`: 솔라피 API 기반 동기화 스크립트
- `pages/api/admin/auto-link-solapi-groups.js`: 그룹 ID 자동 연결 API (개선됨)
- `pages/api/admin/sync-solapi-status.js`: 솔라피 상태 동기화 API

## 참고

- 솔라피 그룹 ID 형식: `G4V{YYYYMMDDHHMMSS}{랜덤문자열}`
- 그룹 생성 시간은 그룹 ID의 타임스탬프 부분에서 추출 가능
- 재발송 시 새로운 그룹 ID가 생성되거나 기존 그룹 ID가 재사용될 수 있음
