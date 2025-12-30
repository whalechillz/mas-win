# 카카오 API 연동 요구사항

## 📋 필요한 정보

### 1. 카카오 비즈니스 API 키
카카오 비즈니스 파트너센터에서 발급받은 API 키가 필요합니다.

**필요한 환경 변수:**
```env
# 카카오 REST API 키 (앱 키)
KAKAO_REST_API_KEY=your_rest_api_key

# 카카오 Admin 키 (서버 키)
KAKAO_ADMIN_KEY=your_admin_key

# 플러스친구 ID (채널 ID)
KAKAO_PLUS_FRIEND_ID=your_plus_friend_id

# 카카오 비즈니스 파트너센터 URL
KAKAO_BUSINESS_URL=https://business.kakao.com
```

**확인 위치:**
- 카카오 비즈니스 파트너센터 → 설정 → API 관리
- 또는 카카오 개발자 콘솔: https://developers.kakao.com

---

## 🔌 카카오 API 엔드포인트

### 1. 친구톡 발송 API
**문서:** https://developers.kakao.com/docs/latest/ko/kakaotalk-channel/rest-api#send-friendtalk

**엔드포인트:**
```
POST https://kapi.kakao.com/v1/api/talk/friends/message/default/send
```

**헤더:**
```
Authorization: KakaoAK {KAKAO_ADMIN_KEY}
Content-Type: application/x-www-form-urlencoded
```

**요청 예시:**
```javascript
const response = await fetch('https://kapi.kakao.com/v1/api/talk/friends/message/default/send', {
  method: 'POST',
  headers: {
    'Authorization': `KakaoAK ${KAKAO_ADMIN_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    receiver_uuids: JSON.stringify(['uuid1', 'uuid2']),
    template_object: JSON.stringify({
      object_type: 'text',
      text: '메시지 내용',
      link: {
        web_url: 'https://www.masgolf.co.kr/survey',
        mobile_web_url: 'https://www.masgolf.co.kr/survey'
      },
      button_title: '설문 참여하기'
    })
  })
});
```

### 2. 알림톡 발송 API
**문서:** https://developers.kakao.com/docs/latest/ko/kakaotalk-channel/rest-api#send-alimtalk

**옵션 1: 카카오 API 직접 사용**
```
POST https://kapi.kakao.com/v1/api/talk/memo/default/send
```

**옵션 2: Solapi를 통한 알림톡 발송 (현재 시스템 사용 중)**
- Solapi API를 통해 알림톡 발송
- 템플릿 ID 필요
- `pages/api/bookings/notify-customer.ts` 참고

---

## 📊 데이터베이스 쿼리

### 1. `template_type` 컬럼 추가 (필요한 경우)

**Supabase SQL Editor에서 실행:**

```sql
-- template_type 컬럼 추가
ALTER TABLE channel_kakao 
ADD COLUMN IF NOT EXISTS template_type VARCHAR(50) DEFAULT 'BASIC_TEXT';

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_channel_kakao_template_type 
ON channel_kakao(template_type);

CREATE INDEX IF NOT EXISTS idx_channel_kakao_status 
ON channel_kakao(status);

CREATE INDEX IF NOT EXISTS idx_channel_kakao_sent_at 
ON channel_kakao(sent_at);
```

### 2. 카카오 그룹 ID 컬럼 추가 (SMS의 솔라피 그룹 ID처럼)

```sql
-- 카카오 비즈니스 파트너센터 그룹 ID 저장
ALTER TABLE channel_kakao 
ADD COLUMN IF NOT EXISTS kakao_group_id VARCHAR(100);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_channel_kakao_group_id 
ON channel_kakao(kakao_group_id);
```

### 3. 발송 결과 상세 정보 저장

```sql
-- 발송 결과 상세 정보 (JSONB)
ALTER TABLE channel_kakao 
ADD COLUMN IF NOT EXISTS send_result JSONB;

-- 예시 구조:
-- {
--   "totalCount": 100,
--   "successCount": 95,
--   "failCount": 5,
--   "failReasons": [...],
--   "sentAt": "2025-01-01T10:00:00Z"
-- }
```

---

## 🔄 카카오 API 연동 구현 위치

### 1. 발송 API
**파일:** `pages/api/channels/kakao/send.ts` (신규 생성 필요)

**기능:**
- 친구톡 발송
- 알림톡 발송
- 발송 결과 저장
- `message_logs` 업데이트

### 2. 웹훅 수신
**파일:** `pages/api/kakao/webhook.ts` (신규 생성 필요)

**기능:**
- 카카오에서 발송 결과 수신
- `message_logs` 업데이트
- `channel_kakao` 상태 업데이트

### 3. 친구 목록 조회
**파일:** `pages/api/kakao/friends.ts` (신규 생성 필요)

**기능:**
- 카카오 친구 UUID 목록 조회
- 친구 그룹 관리

---

## 📝 구현 체크리스트

### Phase 1: 기본 설정
- [ ] 카카오 비즈니스 파트너센터 API 키 발급
- [ ] 환경 변수 설정 (`.env.local`)
- [ ] `template_type` 컬럼 추가 (DB)
- [ ] `kakao_group_id` 컬럼 추가 (DB)

### Phase 2: API 연동
- [ ] 친구톡 발송 API 구현
- [ ] 알림톡 발송 API 구현 (Solapi 또는 카카오 API)
- [ ] 발송 결과 저장 로직
- [ ] `message_logs` 업데이트

### Phase 3: 웹훅 및 모니터링
- [ ] 웹훅 엔드포인트 구현
- [ ] 발송 상태 실시간 조회
- [ ] 에러 처리 및 재시도 로직

---

## 🔗 참고 링크

1. **카카오 비즈니스 파트너센터**
   - https://business.kakao.com

2. **카카오 개발자 문서**
   - https://developers.kakao.com/docs/latest/ko/kakaotalk-channel/rest-api

3. **Solapi 알림톡 API**
   - https://docs.solapi.com/kakao-talk/alimtalk

---

## 💡 현재 시스템과의 통합

### 기존 Solapi 알림톡 사용 중
- `pages/api/bookings/notify-customer.ts`에서 Solapi를 통한 알림톡 발송
- 템플릿 ID 기반 발송
- 변수 치환 지원

### 통합 방안
1. **친구톡**: 카카오 API 직접 사용
2. **알림톡**: Solapi 또는 카카오 API 선택 가능하도록
3. **발송 결과**: 통합된 `message_logs` 테이블 사용

