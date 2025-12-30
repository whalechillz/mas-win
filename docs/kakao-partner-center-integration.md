# 카카오 파트너센터 메시지 연동 가이드

## 📋 개요

카카오 비즈니스 파트너센터에서 등록한 메시지를 시스템과 동기화하여 관리할 수 있습니다.

## 🔌 API 엔드포인트

### 1. 수동 동기화 API
**파일:** `pages/api/kakao/manual-sync.ts`

**엔드포인트:**
```
POST /api/kakao/manual-sync
```

**요청 Body:**
```json
{
  "kakaoMessageId": "16147105",  // 카카오 파트너센터 메시지 ID (필수)
  "channelKakaoId": 123,          // channel_kakao 테이블 ID (선택, 있으면 업데이트)
  "title": "메시지 제목",          // 선택
  "content": "메시지 내용",        // 선택
  "status": "sent",               // 선택: 'sent', 'draft', 'scheduled'
  "sentAt": "2025-12-30T14:10:00Z", // 선택
  "sentCount": 1746,              // 선택
  "successCount": 1700,           // 선택
  "failCount": 46,                // 선택
  "buttonText": "참여하기",        // 선택
  "buttonLink": "https://www.masgolf.co.kr/survey" // 선택
}
```

**응답:**
```json
{
  "success": true,
  "message": "메시지가 동기화되었습니다.",
  "data": { ... },
  "kakaoMessageId": "16147105"
}
```

### 2. 자동 동기화 API (카카오 API 연동 시)
**파일:** `pages/api/kakao/sync-message.ts`

**엔드포인트:**
```
POST /api/kakao/sync-message
```

**요청 Body:**
```json
{
  "kakaoMessageId": "16147105",
  "channelKakaoId": 123  // 선택
}
```

**기능:**
- 카카오 비즈니스 API를 통해 메시지 정보 자동 조회
- `channel_kakao` 테이블과 자동 동기화

---

## 📊 사용 방법

### 방법 1: 리스트 페이지에서 동기화

1. `/admin/kakao-list` 페이지 접속
2. 동기화할 메시지의 "동기화" 버튼 클릭
3. 카카오 파트너센터 메시지 ID 입력 (예: 16147105)
4. 자동으로 `channel_kakao` 테이블과 동기화

### 방법 2: API 직접 호출

```javascript
// 수동 동기화
const response = await fetch('/api/kakao/manual-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    kakaoMessageId: '16147105',
    channelKakaoId: 123, // 선택
    status: 'sent',
    sentCount: 1746,
    successCount: 1700,
    failCount: 46
  })
});

const data = await response.json();
```

---

## 🔄 동기화 프로세스

1. **카카오 파트너센터에서 메시지 등록**
   - 카카오 비즈니스 파트너센터에서 메시지 작성 및 등록
   - 메시지 ID 확인 (예: 16147105)

2. **시스템에 동기화**
   - 리스트 페이지에서 "동기화" 버튼 클릭
   - 또는 API 직접 호출

3. **자동 업데이트**
   - `channel_kakao` 테이블에 `kakao_group_id` 저장
   - 발송 상태, 발송 결과 등 정보 동기화

---

## 📝 데이터베이스 구조

### `channel_kakao` 테이블

```sql
-- 카카오 파트너센터 메시지 ID 저장
kakao_group_id VARCHAR(100)  -- 카카오 파트너센터 메시지 ID

-- 발송 결과
sent_count INTEGER           -- 총 발송 수
success_count INTEGER        -- 성공 수
fail_count INTEGER           -- 실패 수
sent_at TIMESTAMP            -- 발송 시간
```

---

## 🔗 카카오 파트너센터 링크

동기화된 메시지는 리스트에서 카카오 메시지 ID를 클릭하면 카카오 파트너센터로 이동합니다:

```
https://business.kakao.com/_vSVuV/messages/{kakao_group_id}
```

---

## 💡 향후 개선 사항

1. **자동 동기화**
   - 카카오 비즈니스 API를 통한 자동 메시지 조회
   - 주기적 상태 업데이트 (cron job)

2. **웹훅 연동**
   - 카카오에서 발송 결과를 웹훅으로 수신
   - 실시간 상태 업데이트

3. **발송 결과 상세 조회**
   - 성공/실패 상세 내역
   - 수신자별 발송 상태

