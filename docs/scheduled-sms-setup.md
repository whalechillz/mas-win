# SMS 예약 발송 기능 가이드

## 📋 목차

1. [개요](#개요)
2. [데이터베이스 스키마](#데이터베이스-스키마)
3. [프론트엔드 기능](#프론트엔드-기능)
4. [백엔드 API](#백엔드-api)
5. [예약 발송 초안 생성 스크립트](#예약-발송-초안-생성-스크립트)
6. [타임존 처리](#타임존-처리)
7. [사용 사례](#사용-사례)
8. [E2E 테스트](#e2e-테스트)
9. [문제 해결](#문제-해결)

---

## 개요

SMS 예약 발송 기능은 특정 시간에 자동으로 SMS/MMS를 발송할 수 있도록 하는 기능입니다. 이 기능을 통해:

- **예약 시간 설정**: 원하는 날짜와 시간에 메시지 발송 예약
- **예약 시간 변경**: 발송 전까지 예약 시간 수정 가능
- **예약 취소**: 발송 전 예약 취소 가능
- **예약 목록 확인**: SMS 리스트에서 예약 시간 확인

---

## 데이터베이스 스키마

### 테이블 구조

`channel_sms` 테이블에 `scheduled_at` 컬럼이 추가되었습니다.

```sql
-- channel_sms 테이블에 scheduled_at 컬럼 추가
ALTER TABLE channel_sms 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;

-- 인덱스 추가 (예약 발송 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_channel_sms_scheduled_at 
ON channel_sms(scheduled_at) 
WHERE scheduled_at IS NOT NULL;
```

### 컬럼 설명

- **`scheduled_at`**: 예약 발송 시간 (TIMESTAMP, UTC 형식)
  - `NULL`: 예약 발송 없음 (즉시 발송 또는 초안)
  - `TIMESTAMP`: 예약 발송 시간

### 마이그레이션 실행

```bash
# SQL 파일 실행
psql -h [HOST] -U [USER] -d [DATABASE] -f sql/add-scheduled-at-to-channel-sms.sql
```

또는 Supabase 대시보드의 SQL Editor에서 직접 실행:

```sql
ALTER TABLE channel_sms 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_channel_sms_scheduled_at 
ON channel_sms(scheduled_at) 
WHERE scheduled_at IS NOT NULL;
```

---

## 프론트엔드 기능

### 1. SMS 편집 페이지 (`/admin/sms`)

#### 예약 발송 섹션

**위치**: 오른쪽 사이드바 (SMS/MMS 최적화 점수와 모바일 미리보기 사이)

**구성 요소**:

1. **예약 발송 사용 체크박스**
   - 예약 발송 기능 활성화/비활성화
   - 체크 해제 시 예약 시간 초기화

2. **예약 시간 입력 필드** (`datetime-local`)
   - 날짜와 시간 선택
   - 최소값: 현재 시간 이후만 선택 가능

3. **예약 시간 저장 버튼** (초안 상태일 때)
   - 예약 시간을 데이터베이스에 저장
   - 저장 후 "예약 발송하기" 버튼으로 변경

4. **예약 발송하기 버튼** (저장된 예약이 있을 때)
   - 예약 시간에 맞춰 메시지 발송
   - 초록색 버튼으로 표시

5. **시간 변경 버튼**
   - 저장된 예약 시간 수정
   - 수정 후 다시 저장 필요

6. **예약 취소 버튼**
   - 예약 시간 삭제
   - `scheduled_at`을 `NULL`로 설정

#### 상태 관리

```typescript
// 예약 발송 관련 상태
const [isScheduled, setIsScheduled] = useState(false);        // 예약 발송 사용 여부
const [scheduledAt, setScheduledAt] = useState('');          // 예약 시간 (ISO 문자열)
const [hasScheduledTime, setHasScheduledTime] = useState(false); // 저장된 예약 시간 존재 여부
```

#### 핸들러 함수

- **`handleSaveScheduledTime`**: 예약 시간 저장
- **`handleCancelScheduled`**: 예약 취소
- **`handleChangeScheduledTime`**: 예약 시간 변경

### 2. SMS 리스트 페이지 (`/admin/sms-list`)

#### 예약일 컬럼

**위치**: 테이블의 "예약일" 컬럼

**표시 내용**:
- 예약 시간이 있는 경우:
  - 포맷팅된 날짜/시간 (예: `11/19 10:00:00`)
  - 상대 시간 표시 (예: `(2시간 전)`)
  - 파란색으로 강조 표시
- 예약 시간이 없는 경우:
  - `-` 표시

#### 포맷팅 함수

```typescript
// Solapi 스타일 날짜/시간 포맷팅
function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}:${seconds}`;
}

// 상대 시간 표시
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) {
    return `(${diffSec}초 전)`;
  } else if (diffMin < 60) {
    return `(${diffMin}분 전)`;
  } else if (diffHour < 24) {
    return `(${diffHour}시간 전)`;
  } else if (diffDay < 7) {
    return `(${diffDay}일 전)`;
  } else if (diffWeek < 4) {
    return `(${diffWeek}주 전)`;
  } else {
    const diffMonth = Math.floor(diffDay / 30);
    return `(${diffMonth}개월 전)`;
  }
}
```

---

## 백엔드 API

### 1. SMS CRUD API (`/api/admin/sms`)

#### POST - 예약 발송 초안 생성

**요청 본문**:
```json
{
  "message": "메시지 내용",
  "type": "MMS",
  "status": "draft",
  "recipientNumbers": ["010-1234-5678", "010-9876-5432"],
  "imageUrl": "https://example.com/image.jpg",
  "shortLink": "https://short.link/abc123",
  "scheduledAt": "2025-11-19T10:00:00.000Z"
}
```

**응답**:
```json
{
  "success": true,
  "smsContent": {
    "id": 88,
    "scheduled_at": "2025-11-19T10:00:00.000Z",
    ...
  }
}
```

#### PUT - 예약 시간 업데이트

**요청 본문**:
```json
{
  "id": 88,
  "scheduledAt": "2025-11-19T11:00:00.000Z"
}
```

**응답**:
```json
{
  "success": true,
  "smsContent": {
    "id": 88,
    "scheduled_at": "2025-11-19T11:00:00.000Z",
    ...
  }
}
```

#### GET - SMS 조회 (예약 시간 포함)

**응답**:
```json
{
  "success": true,
  "smsContent": {
    "id": 88,
    "message_text": "메시지 내용",
    "scheduled_at": "2025-11-19T10:00:00.000Z",
    "status": "draft",
    ...
  }
}
```

### 2. SMS 리스트 API (`/api/channels/sms/list`)

**응답**:
```json
{
  "success": true,
  "messages": [
    {
      "id": 88,
      "message_text": "메시지 내용",
      "scheduled_at": "2025-11-19T10:00:00.000Z",
      "status": "draft",
      ...
    }
  ],
  "total": 1
}
```

---

## 예약 발송 초안 생성 스크립트

### 1. 비구매자 대상 예약 발송 스크립트

**파일**: `scripts/create-scheduled-draft-excluding-200.js`

**기능**:
- 200명 발송된 메시지의 그룹 ID를 기준으로 발송된 번호 추출
- 고객 DB에서 비구매자 목록 조회
- 발송된 200명 제외한 나머지 비구매자 필터링
- 내일 오전 10시로 예약 발송 시간 설정
- 예약 발송 초안 생성

**사용 방법**:
```bash
# 환경 변수 설정 (.env.local)
LOCAL_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 스크립트 실행
node scripts/create-scheduled-draft-excluding-200.js
```

**주요 함수**:
```javascript
// 내일 아침 10시 계산
function getTomorrow10AM() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  return tomorrow.toISOString();
}

// 비구매자 목록 조회
async function getNonPurchasers() {
  // first_purchase_date와 last_purchase_date 모두 null인 고객
  // opt_out이 false인 고객
  // phone이 null이 아닌 고객
}
```

### 2. 구매자 대상 예약 발송 스크립트

**파일**: `scripts/create-scheduled-draft-for-purchasers.js`

**기능**:
- 고객 DB에서 구매자 목록 조회
- 수신거부가 아닌 고객만 필터링
- 내일 오전 11시로 예약 발송 시간 설정
- 예약 발송 초안 생성

**사용 방법**:
```bash
node scripts/create-scheduled-draft-for-purchasers.js
```

**주요 함수**:
```javascript
// 구매자 목록 조회
async function getPurchasers() {
  // first_purchase_date와 last_purchase_date 모두 존재하는 고객
  // opt_out이 false인 고객
  // phone이 null이 아닌 고객
}

// 내일 오전 11시 계산
function getTomorrow11AM() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  return tomorrow.toISOString();
}
```

---

## 타임존 처리

### 문제점

- **데이터베이스**: UTC 형식으로 저장
- **프론트엔드**: 로컬 시간으로 표시 필요
- **`datetime-local` 입력**: 로컬 시간 형식 필요

### 해결 방법

#### 1. 로드 시 UTC → 로컬 시간 변환

```typescript
// SMS 데이터 로드 시
if (sms.scheduled_at) {
  // UTC → 로컬 시간 변환
  const utcDate = new Date(sms.scheduled_at);
  const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
  setScheduledAt(localDate.toISOString().slice(0, 16));
  setIsScheduled(true);
  setHasScheduledTime(true);
}
```

#### 2. 저장 시 로컬 시간 → UTC 변환

```typescript
// 예약 시간 저장 시
const localDate = new Date(scheduledAt);
const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
const scheduledAtUTC = utcDate.toISOString();

// API 호출
await fetch('/api/admin/sms', {
  method: 'PUT',
  body: JSON.stringify({
    id: smsId,
    scheduledAt: scheduledAtUTC
  })
});
```

#### 3. 표시 시 UTC → 로컬 시간 변환

```typescript
// 리스트에서 표시할 때
const scheduledDate = new Date(message.scheduled_at);
const formatted = scheduledDate.toLocaleString('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
});
```

---

## 사용 사례

### 사례 1: 비구매자 대상 예약 발송

**시나리오**: 200명 발송 후 나머지 비구매자(1108명)에게 내일 오전 10시 예약 발송

**절차**:
1. 200명 발송된 메시지의 그룹 ID 확인
2. `scripts/create-scheduled-draft-excluding-200.js` 실행
3. 스크립트가 자동으로:
   - 발송된 200명 번호 추출
   - 비구매자 목록 조회
   - 200명 제외한 나머지 필터링
   - 내일 오전 10시로 예약 초안 생성
4. SMS 편집 페이지에서 "예약 발송하기" 버튼 클릭

### 사례 2: 구매자 대상 예약 발송

**시나리오**: 구매자 전체에게 내일 오전 11시 예약 발송

**절차**:
1. `scripts/create-scheduled-draft-for-purchasers.js` 실행
2. 스크립트가 자동으로:
   - 구매자 목록 조회
   - 내일 오전 11시로 예약 초안 생성
3. SMS 편집 페이지에서 "예약 발송하기" 버튼 클릭

### 사례 3: 예약 시간 변경

**시나리오**: 예약된 메시지의 발송 시간 변경

**절차**:
1. SMS 편집 페이지에서 예약된 메시지 열기
2. "시간 변경" 버튼 클릭
3. 새로운 날짜/시간 선택
4. "예약 시간 저장" 버튼 클릭
5. "예약 발송하기" 버튼으로 다시 확인

### 사례 4: 예약 취소

**시나리오**: 예약된 메시지 취소

**절차**:
1. SMS 편집 페이지에서 예약된 메시지 열기
2. "예약 취소" 버튼 클릭
3. 예약 시간이 삭제되고 초안 상태로 변경

---

## E2E 테스트

### 예약 시간 일관성 확인 스크립트

**파일**: `e2e-test/check-scheduled-time-consistency.js`

**기능**:
- Playwright를 사용한 자동화 테스트
- SMS 리스트 페이지에서 예약 시간 확인
- 예약 시간 표시 일관성 검증

**사용 방법**:
```bash
# 환경 변수 설정
export ADMIN_EMAIL=your_email@example.com
export ADMIN_PASSWORD=your_password
export LOCAL_URL=http://localhost:3000

# 테스트 실행
node e2e-test/check-scheduled-time-consistency.js
```

**테스트 항목**:
1. 로그인
2. SMS 리스트 페이지 이동
3. 예약 시간이 있는 메시지 찾기
4. 예약 시간 표시 확인
5. 예약 시간 포맷팅 확인
6. 상대 시간 표시 확인

---

## 문제 해결

### 문제 1: 예약 시간이 잘못 표시됨

**증상**: 데이터베이스의 시간과 화면에 표시되는 시간이 다름

**원인**: 타임존 변환 문제

**해결 방법**:
1. 로드 시 UTC → 로컬 시간 변환 확인
2. 저장 시 로컬 시간 → UTC 변환 확인
3. `toISOString()` 사용 시 UTC로 변환되는 것 확인

### 문제 2: 예약 시간 저장이 안 됨

**증상**: "예약 시간 저장" 버튼 클릭 후 저장되지 않음

**원인**: API 호출 실패 또는 데이터베이스 오류

**해결 방법**:
1. 브라우저 개발자 도구에서 네트워크 요청 확인
2. API 응답 확인
3. 데이터베이스 로그 확인
4. `scheduled_at` 컬럼 존재 여부 확인

### 문제 3: 예약 발송이 실행되지 않음

**증상**: 예약 시간이 지났는데도 발송되지 않음

**원인**: 예약 발송 스케줄러 미구현 또는 오류

**해결 방법**:
1. 예약 발송 스케줄러 확인
2. Cron Job 또는 배치 작업 확인
3. 로그 확인

### 문제 4: 예약 시간 변경 후 이전 시간이 표시됨

**증상**: 시간 변경 후에도 이전 시간이 표시됨

**원인**: 상태 업데이트 누락 또는 캐시 문제

**해결 방법**:
1. 상태 업데이트 확인 (`setHasScheduledTime`, `setScheduledAt`)
2. 페이지 새로고침
3. 브라우저 캐시 삭제

---

## 참고 자료

- **데이터베이스 스키마**: `sql/add-scheduled-at-to-channel-sms.sql`
- **비구매자 예약 스크립트**: `scripts/create-scheduled-draft-excluding-200.js`
- **구매자 예약 스크립트**: `scripts/create-scheduled-draft-for-purchasers.js`
- **E2E 테스트**: `e2e-test/check-scheduled-time-consistency.js`
- **API 엔드포인트**: 
  - `/api/admin/sms` (CRUD)
  - `/api/channels/sms/list` (리스트 조회)

---

## 업데이트 이력

- **2025-11-19**: 초기 문서 작성
  - 데이터베이스 스키마 추가
  - 프론트엔드 기능 구현
  - 예약 발송 초안 생성 스크립트 추가
  - 타임존 처리 구현
  - E2E 테스트 추가

---

## 문의 및 지원

문제가 발생하거나 추가 기능이 필요한 경우, 개발팀에 문의하세요.

