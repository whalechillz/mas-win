# 예약 관리 커뮤니케이션 계획서

## 📋 문서 정보
- **작성일**: 2025-11-24
- **상태**: 계획 단계
- **우선순위**: 높음

---

## 1. 현재 시스템 상태

### ✅ 구현된 기능
- **솔라피(Solapi) SMS/MMS API 연동 완료**
  - 파일: `pages/api/channels/sms/send.js`
  - 기능: SMS, LMS, MMS 발송 가능
  - 카카오톡 알림톡/친구톡 타입 지원 (`messageType: 'ALIMTALK'`)

- **슬랙 알림 구현 완료**
  - 파일: `pages/api/slack/notify.js`, `pages/api/slack/notify-beautiful.js`
  - 기능: 예약 생성 시 관리자에게 슬랙 알림 전송

- **예약 생성 시 슬랙 알림 전송**
  - 파일: `pages/api/booking.js` (126-169줄)
  - 관리자에게 예약 정보 즉시 전달

### ❌ 미구현 기능
- 고객에게 카카오톡/문자 전송
- 예약 확정 시 고객 알림
- 카카오톡 알림톡/친구톡 실제 발송 (코드만 존재, 템플릿 미등록)

---

## 2. 권장 커뮤니케이션 플로우

### 플로우 1: 예약 신청 시 (고객 → 시스템)

```
고객이 예약 신청
    ↓
[1] 시스템: 예약 DB 저장
    ↓
[2] 시스템 → 관리자: 슬랙 알림 (즉시) ✅ 구현됨
    - 고객명, 연락처, 예약일시, 서비스 정보
    - 예약 승인/거부 버튼 (선택사항)
    ↓
[3] 시스템 → 고객: 솔라피 카카오톡 알림톡 (즉시) ❌ 미구현
    - 예약 접수 확인 메시지
    - "예약 가능 여부 확인 후 연락드리겠습니다"
    - 실패 시 → SMS로 대체 발송
```

### 플로우 2: 예약 확정 시 (관리자 → 고객)

```
관리자가 예약 승인 (status: 'pending' → 'confirmed')
    ↓
[1] 시스템: 예약 상태 업데이트 ✅ 구현됨
    ↓
[2] 시스템 → 고객: 솔라피 카카오톡 알림톡 ❌ 미구현
    - 예약 확정 안내
    - 예약일시, 장소, 담당자 정보
    - 실패 시 → SMS로 대체 발송
    ↓
[3] 시스템 → 관리자: 슬랙 알림 (선택사항) ❌ 미구현
    - "예약이 확정되었습니다" 확인 메시지
```

### 플로우 3: 예약 완료 후 (시스템 → 고객)

```
예약 완료 (status: 'confirmed' → 'completed')
    ↓
[1] 시스템 → 고객: 솔라피 카카오톡 알림톡 (선택사항) ❌ 미구현
    - 감사 메시지
    - 다음 예약 유도 (리텐션)
```

---

## 3. 솔라피 연동 가능 여부

### ✅ 가능합니다!

현재 시스템에 솔라피 연동이 완전히 구현되어 있습니다.

#### 확인된 기능
- **SMS/MMS 발송 API**: `pages/api/channels/sms/send.js`
- **솔라피 서명 생성 유틸리티**: `utils/solapiSignature.js`
- **카카오톡 알림톡/친구톡 타입 지원**: `messageType: 'ALIMTALK'`, `'FRIENDTALK'`
- **환경 변수 설정**: `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER`

#### 필요한 작업
1. **카카오톡 알림톡 템플릿 등록** (솔라피 대시보드에서) ✅ 진행 중
   - 예약 접수 확인 템플릿 (공통) ✅ 등록 완료 - `예약 접수 확인 (시니어)` (검수진행중)
   - 예약 확정 안내 템플릿 (시니어용) ✅ 등록 완료 - `예약 확정 안내(시니어)N` (검수진행중)
   - 예약 확정 안내 템플릿 (하이테크용) ✅ 등록 완료 - `예약 확정 안내 (하이테크)N` (검수진행중)
   - 기본안내 템플릿 ⏳ 등록 필요 (알리고에서 내용 확인 후 등록)
2. **예약 생성/확정 시 솔라피 API 호출 추가**
3. **실패 시 SMS 대체 발송 로직 구현**

---

## 4. 등록된 카카오톡 알림톡 템플릿

### 4.1 예약 접수 확인 (공통) ✅

**템플릿 이름**: `예약 접수 확인 (시니어)`
**사용 대상**: 시니어 + 하이테크 공통 사용
**템플릿 코드**: `m3A9EGCj2y` (검수진행중)

**내용**:
```
#{고객명}님, 안녕하세요! 마쓰구골프입니다.

시타 예약 요청이 접수되었습니다.
예약 가능 여부를 확인한 후 연락드리겠습니다.

[예약 정보]
▶ 예약일: #{날짜}
▶ 시간: #{시간}
▶ 서비스: #{서비스명}

[안내사항]
⊙ 예약 확정 후 다시 안내드리겠습니다.
⊙ 일정 변경이 필요하시면 언제든지 연락주세요.

☎ 마쓰구 수원본점
수원시 영통구 법조로149번길 200
TEL 031-215-0013
OPEN 09:00~18:00(월~금)
```

**버튼**:
- MASSGOO 홈페이지 (https://www.masgolf.co.kr/) - 외부 브라우저로 링크 열기 ✅

**변수**:
- `#{고객명}`
- `#{날짜}`
- `#{시간}`
- `#{서비스명}`

**사용 결정**:
- ✅ 시니어/하이테크 구분 없이 공통 사용
- 이유: 예약 접수 확인은 정보 전달이 주 목적이므로 브랜딩 차이가 크지 않음

---

### 4.2 예약 확정 안내 (시니어용) ✅

**템플릿 이름**: `예약 확정 안내(시니어)N`
**템플릿 코드**: `TBD` (검수진행중)

**내용**:
```
#{고객명}님, 안녕하세요! 마쓰구골프입니다.

시타 예약이 확정되었습니다.
예약하신 일시에 방문해 주시기 바랍니다.

[예약 정보]
▶ 예약일: #{날짜}
▶ 시간: #{시간}
▶ 서비스: #{서비스명}
📍 장소: 마쓰구 스튜디오

☎ 마쓰구 수원본점
수원시 영통구 법조로149번길 200
TEL 031-215-0013
OPEN 09:00~18:00(월~금)
```

**버튼**:
- 찾아오시는 길 안내 (https://www.masgolf.co.kr/contact) - 외부 브라우저로 링크 열기 ✅

**변수**:
- `#{고객명}`
- `#{날짜}`
- `#{시간}`
- `#{서비스명}`

---

### 4.3 예약 확정 안내 (하이테크용) ✅

**템플릿 이름**: `예약 확정 안내 (하이테크)N`
**템플릿 코드**: `TBD` (검수진행중)

**내용**:
```
#{고객명}님, 안녕하세요! 마쓰구 (MASSGOO)입니다.

시타 예약이 확정되었습니다.
예약하신 일시에 방문해 주시기 바랍니다.

[예약 정보]
▶ 예약일: #{날짜}
▶ 시간: #{시간}
▶ 서비스: #{서비스명}
📍 장소: 마쓰구 스튜디오

☎ 마쓰구 수원본점
수원시 영통구 법조로149번길 200
TEL 031-215-0013
OPEN 09:00~18:00(월~금)
```

**버튼**:
- 찾아오시는 길 안내 (https://www.masgolf.co.kr/contact) - 외부 브라우저로 링크 열기 ✅

**변수**:
- `#{고객명}`
- `#{날짜}`
- `#{시간}`
- `#{서비스명}`

**차이점**:
- 인사말: "마쓰구골프" → "마쓰구 (MASSGOO)" (글로벌 브랜드 인식 강조)

---

### 4.4 기본안내 ⏳

**템플릿 이름**: `기본안내`
**알리고 코드**: TI_8967
**상태**: 등록 필요

**확인 필요 사항**:
- 알리고에서 템플릿 내용 전체 확인
- 버튼 유무 및 설정 확인
- 현재 버튼 링크 URL 확인
- 개선 사항 도출

**예상 개선 사항**:
- URL 변경: `mas9golf.com` → `masgolf.co.kr`
- 버튼명 개선
- 내용 최신화

---

## 4. 구현 계획

### Phase 1: 예약 신청 시 고객 알림 (우선순위: 높음)

**파일**: `pages/api/bookings.ts` (POST 요청 처리 후)

**구현 위치**: 예약 생성 성공 후 (`insertError` 체크 후)

**기능**:
- 고객에게 카카오톡 알림톡 발송
- 실패 시 SMS로 대체 발송
- 알림 실패해도 예약은 성공 처리 (에러 무시)

**메시지 타입**: `booking_received`

### Phase 2: 예약 확정 시 고객 알림 (우선순위: 높음)

**파일**: `pages/api/bookings/[id].ts` 또는 `components/admin/bookings/BookingListView.tsx`

**구현 위치**: 예약 상태가 `'confirmed'`로 변경될 때

**기능**:
- 고객에게 확정 알림 발송
- 실패 시 SMS로 대체 발송

**메시지 타입**: `booking_confirmed`

### Phase 3: 솔라피 고객 알림 API 생성 (우선순위: 높음)

**새 파일**: `pages/api/bookings/notify-customer.ts`

**기능**:
- 솔라피 카카오톡 알림톡 발송
- 실패 시 SMS 대체 발송
- 메시지 템플릿 관리
- 발송 로그 저장 (선택사항)

**파라미터**:
```typescript
{
  bookingId: string;
  type: 'booking_received' | 'booking_confirmed';
  phone: string;
  name: string;
  date: string;
  time: string;
  service_type: string;
}
```

### Phase 4: 예약 완료 후 감사 메시지 (우선순위: 중)

**구현 위치**: 예약 상태가 `'completed'`로 변경될 때

**기능**:
- 고객에게 감사 메시지 발송
- 다음 예약 유도 (리텐션)

---

## 5. 메시지 템플릿 제안

### 템플릿 1: 예약 접수 확인 (booking_received)

**카카오톡 알림톡**:
```
[마쓰구골프] 안녕하세요, {고객명}님!

시타 예약 요청이 접수되었습니다.
예약 가능 여부를 확인한 후 연락드리겠습니다.

📅 예약일시: {날짜} {시간}
🏌️ 서비스: {서비스명}

문의: 031-215-0013
```

**SMS 대체 메시지**:
```
[마쓰구골프] {고객명}님, 시타 예약 요청이 접수되었습니다. 예약 가능 여부 확인 후 연락드리겠습니다. 예약일시: {날짜} {시간} 문의: 031-215-0013
```

### 템플릿 2: 예약 확정 안내 (booking_confirmed)

**카카오톡 알림톡**:
```
[마쓰구골프] {고객명}님, 예약이 확정되었습니다! 🎉

📅 예약일시: {날짜} {시간}
📍 장소: 마쓰구골프 [수원 본점]
👤 담당: Massgoo Studio

예약 변경이 필요하시면 연락주세요.
031-215-0013
```

**SMS 대체 메시지**:
```
[마쓰구골프] {고객명}님, 예약이 확정되었습니다! 예약일시: {날짜} {시간}, 장소: 마쓰구골프 [수원 본점] 문의: 031-215-0013
```

### 템플릿 3: 예약 완료 감사 (booking_completed) - 선택사항

**카카오톡 알림톡**:
```
[마쓰구골프] {고객명}님, 시타 체험 감사합니다! 🙏

오늘의 시타가 도움이 되셨기를 바랍니다.
추가 문의사항이 있으시면 언제든 연락주세요.

다음 예약: https://masgolf.co.kr/try-a-massgoo
문의: 031-215-0013
```

---

## 6. 솔라피 카카오톡 알림톡 템플릿 등록 가이드

### 필수 작업 (솔라피 대시보드)

1. **템플릿 등록**
   - 솔라피 대시보드 → 알림톡 → 템플릿 등록
   - 템플릿 코드 발급 받기

2. **템플릿 변수 설정**
   - `{고객명}`, `{날짜}`, `{시간}`, `{서비스명}` 등

3. **카카오톡 비즈니스 채널 연동**
   - 솔라피와 카카오톡 비즈니스 채널 연결 확인

### 환경 변수 추가 (선택사항)

```bash
# .env.local
SOLAPI_KAKAO_TEMPLATE_BOOKING_RECEIVED=템플릿코드1
SOLAPI_KAKAO_TEMPLATE_BOOKING_CONFIRMED=템플릿코드2
```

---

## 7. 기존 SMS / 카카오 / Slack API 재사용 계획

### 7-1. 기존 SMS API 구조 정리

- **콘텐츠/스케줄 관리 API**  
  - `pages/api/admin/sms.js`  
    - SMS/MMS 콘텐츠 생성·수정·조회  
    - 예약 발송 시간(`scheduledAt`), 이미지 URL, 수신자 목록 등 메타데이터를 Supabase 테이블에 저장

- **예약 발송/일괄 발송 API (Solapi 호출)**  
  - `pages/api/admin/send-scheduled-sms.js`  
    - Supabase에서 발송 대상 SMS 레코드 로드  
    - `utils/solapiSignature.js` 로 인증 헤더 생성  
    - `https://api.solapi.com/messages/v4/send-many` 호출로 실제 발송  
    - 응답의 `groupId`, `results` 를 바탕으로 성공/실패 카운트 및 `solapi_group_id` 저장

- **채널별 직접 발송 API (공용 발송 엔드포인트)**  
  - `pages/api/channels/sms/send.js`  
    - 단일/다중 번호에 대해 SMS/LMS/MMS 및 카카오 알림톡/친구톡(`messageType: 'ALIMTALK' | 'FRIENDTALK'`) 발송  
    - 향후 **예약 알림용 Notification 서비스**에서 직접 호출해, 기존 SMS 인프라를 그대로 재사용

> **정리**: 예약 알림을 위해 새 Solapi 연동을 만들 필요는 없고,  
> `pages/api/channels/sms/send.js` 를 **예약 알림용 공용 발송 API** 로 사용하는 것이 가장 안전하다.

### 7-2. 예약 알림용 Notification API 설계

- **새 파일**: `pages/api/bookings/notify-customer.ts`
- **역할**:
  1. `bookingId`로 Supabase에서 예약 + 고객 정보 조회
  2. 비즈니스 타입(`booking_received` / `booking_confirmed` / `booking_completed`)에 따라
     - 사용할 **템플릿 키**와 **치환 변수** 결정
  3. 내부에서 `pages/api/channels/sms/send.js` 로 요청을 보내
     - 우선 `messageType: 'ALIMTALK'` 으로 발송 시도
     - 실패/비가입/차단 시 `messageType: 'SMS'` 로 자동 fallback
  4. 발송 결과(`groupId`, `status`)를 `booking_notifications` 테이블에 저장 (선택)

```ts
// 프론트/어드민에서 호출 시그니처 예시
POST /api/bookings/notify-customer
{
  bookingId: string;
  notificationType: 'booking_received' | 'booking_confirmed' | 'booking_completed';
}
```

관리자 UI에서는 **“확정 + 알림 보내기” 버튼**이 이 API를 호출하도록 구현한다.

### 7-3. 카카오 콘텐츠 Slack 연동 API 활용

현재 카카오톡 콘텐츠 시스템에서 이미 Slack 연동이 구현되어 있다.

- **Slack 유틸리티**  
  - `lib/slack-notification.js`  
    - `sendSlackNotification(message, webhookUrl?)`  
    - `formatKakaoContentSlackMessage(params)`  
    - Slack Webhook URL 기반으로 JSON payload 전송

- **카카오 콘텐츠용 Slack API**  
  - `pages/api/kakao-content/slack-send-account.js`  
  - `pages/api/kakao-content/slack-daily-notification.js`  
  - `pages/api/kakao-content/auto-generate-today.js`

#### 예약 알림용 Slack API 계획

- **새 파일**: `pages/api/slack/booking-notify.js`

```ts
POST /api/slack/booking-notify
{
  type: 'booking_created' | 'booking_confirmed',
  bookingId: string;
}
```

- **내부 동작**:
  1. `bookingId`로 예약 + 고객 정보 조회
  2. 별도 포맷 함수 `formatBookingSlackMessage(booking, type)` 로 텍스트 생성  
  3. `sendSlackNotification` 호출로 `#예약-알림` 채널에 전송

- **예약 API와의 연결**:
  - `pages/api/bookings.ts` (예약 생성): 성공 시 `booking_created` 타입으로 호출  
  - `pages/api/bookings/[id].ts` (예약 상태 변경): `status` 가 `confirmed` 로 변경될 때 `booking_confirmed` 타입으로 호출

### 7-4. 메뉴/관리 UI 방향

- **메시지/알림 통합 메뉴** (권장)
  - 기존 `📱 SMS 관리`, `💬 카카오 채널`, `📱 카톡 콘텐츠` 메뉴는 유지
  - 예약 관련 알림은 별도 탭 또는 섹션 **“예약 알림 센터”** 로 묶어
    - 예약별 발송 이력 (카카오/문자/Slack) 조회
    - 재발송, 실패 사유 확인 기능 제공

- **1:1 고객 메시지 (후속 단계)**  
  - 고객 상세/예약 히스토리 화면에서 “1:1 메시지” 탭을 두고  
  - 카카오 친구톡 / SMS 를 같은 UI에서 보내고, 이력을 타임라인으로 관리

---

## 8. 구현 우선순위

### 🔴 높음 (즉시 구현)
1. ✅ 서비스명 통계 확인 및 변경
2. 예약 신청 시 고객 알림 (카카오톡 → SMS 대체)
3. 예약 확정 시 고객 알림 (카카오톡 → SMS 대체)
4. 솔라피 고객 알림 API 생성

### 🟡 중간 (1주일 내)
5. 예약 완료 후 감사 메시지
6. 알림 발송 로그 저장
7. 관리자 대시보드에 알림 발송 상태 표시

### 🟢 낮음 (향후)
8. 예약 리마인더 (예약 전날/당일)
9. 예약 취소 시 알림
10. 예약 변경 시 알림

---

## 9. 기술 스택

- **메시지 발송**: 솔라피(Solapi) API
- **카카오톡**: 알림톡/친구톡
- **SMS 대체**: 솔라피 SMS API
- **관리자 알림**: 슬랙 웹훅
- **데이터베이스**: Supabase

---

## 10. 참고 파일

- `pages/api/channels/sms/send.js` - 솔라피 SMS/MMS 발송 API
- `pages/api/slack/notify.js` - 슬랙 알림 API
- `utils/solapiSignature.js` - 솔라피 서명 생성 유틸리티
- `pages/api/bookings.ts` - 예약 생성 API
- `pages/api/bookings/[id].ts` - 예약 수정 API

---

## 11. 다음 단계

1. ✅ 서비스명 통계 확인 (진행 중)
2. 솔라피 카카오톡 알림톡 템플릿 등록
3. `pages/api/bookings/notify-customer.ts` API 생성
4. 예약 생성 시 알림 연동
5. 예약 확정 시 알림 연동
6. 테스트 및 모니터링

---

## 12. 최종 요약 (실행 관점)

- **핵심 목표**  
  - 예약 생성/확정/완료 시, 고객에게 **카카오 알림톡 우선 + 실패 시 SMS 대체**,  
    내부 담당자에게는 **Slack 알림**을 보내는 일원화된 Notification 레이어 구축

- **재사용할 기존 모듈**  
  - SMS/카카오 발송: `pages/api/channels/sms/send.js`, `pages/api/admin/send-scheduled-sms.js`, `pages/api/admin/sms.js`, `utils/solapiSignature.js`  
  - Slack: `lib/slack-notification.js`, `pages/api/slack/notify.js`, `pages/api/kakao-content/slack-*.js`

- **신규로 추가할 핵심 API**  
  - `/api/bookings/notify-customer`: 예약 ID + 알림 타입만 넘기면 Solapi(SMS/카카오)를 통해 고객에게 알림 발송  
  - `/api/slack/booking-notify`: 예약 생성/확정 이벤트를 Slack `#예약-알림` 채널로 전송

- **Admin UX 방향**  
  - 예약 리스트/상세에 “예약 확정 + 알림 발송” 버튼 추가 → `/api/bookings/notify-customer` 호출  
  - “예약 알림 센터”(또는 예약 상세 하단 섹션)에서 알림 이력/성공여부/재발송 관리

- **실행 순서**  
  1. Solapi에서 카카오 알림톡 템플릿 승인 완료  
  2. `/api/bookings/notify-customer` 구현 및 예약 생성/확정 로직에 연동  
  3. `/api/slack/booking-notify` 구현 및 예약 생성/확정 이벤트에 연동  
  4. Admin UI에 버튼·이력 섹션 추가  
  5. 실제 고객/테스트 번호 대상 E2E 테스트 및 모니터링

---

**최종 업데이트**: 2025-11-24



- **SMS 대체**: 솔라피 SMS API
- **관리자 알림**: 슬랙 웹훅
- **데이터베이스**: Supabase

---

## 10. 참고 파일

- `pages/api/channels/sms/send.js` - 솔라피 SMS/MMS 발송 API
- `pages/api/slack/notify.js` - 슬랙 알림 API
- `utils/solapiSignature.js` - 솔라피 서명 생성 유틸리티
- `pages/api/bookings.ts` - 예약 생성 API
- `pages/api/bookings/[id].ts` - 예약 수정 API

---

## 11. 다음 단계

1. ✅ 서비스명 통계 확인 (진행 중)
2. 솔라피 카카오톡 알림톡 템플릿 등록
3. `pages/api/bookings/notify-customer.ts` API 생성
4. 예약 생성 시 알림 연동
5. 예약 확정 시 알림 연동
6. 테스트 및 모니터링

---

## 12. 최종 요약 (실행 관점)

- **핵심 목표**  
  - 예약 생성/확정/완료 시, 고객에게 **카카오 알림톡 우선 + 실패 시 SMS 대체**,  
    내부 담당자에게는 **Slack 알림**을 보내는 일원화된 Notification 레이어 구축

- **재사용할 기존 모듈**  
  - SMS/카카오 발송: `pages/api/channels/sms/send.js`, `pages/api/admin/send-scheduled-sms.js`, `pages/api/admin/sms.js`, `utils/solapiSignature.js`  
  - Slack: `lib/slack-notification.js`, `pages/api/slack/notify.js`, `pages/api/kakao-content/slack-*.js`

- **신규로 추가할 핵심 API**  
  - `/api/bookings/notify-customer`: 예약 ID + 알림 타입만 넘기면 Solapi(SMS/카카오)를 통해 고객에게 알림 발송  
  - `/api/slack/booking-notify`: 예약 생성/확정 이벤트를 Slack `#예약-알림` 채널로 전송

- **Admin UX 방향**  
  - 예약 리스트/상세에 “예약 확정 + 알림 발송” 버튼 추가 → `/api/bookings/notify-customer` 호출  
  - “예약 알림 센터”(또는 예약 상세 하단 섹션)에서 알림 이력/성공여부/재발송 관리

- **실행 순서**  
  1. Solapi에서 카카오 알림톡 템플릿 승인 완료  
  2. `/api/bookings/notify-customer` 구현 및 예약 생성/확정 로직에 연동  
  3. `/api/slack/booking-notify` 구현 및 예약 생성/확정 이벤트에 연동  
  4. Admin UI에 버튼·이력 섹션 추가  
  5. 실제 고객/테스트 번호 대상 E2E 테스트 및 모니터링

---

**최종 업데이트**: 2025-11-24



- **SMS 대체**: 솔라피 SMS API
- **관리자 알림**: 슬랙 웹훅
- **데이터베이스**: Supabase

---

## 10. 참고 파일

- `pages/api/channels/sms/send.js` - 솔라피 SMS/MMS 발송 API
- `pages/api/slack/notify.js` - 슬랙 알림 API
- `utils/solapiSignature.js` - 솔라피 서명 생성 유틸리티
- `pages/api/bookings.ts` - 예약 생성 API
- `pages/api/bookings/[id].ts` - 예약 수정 API

---

## 11. 다음 단계

1. ✅ 서비스명 통계 확인 (진행 중)
2. 솔라피 카카오톡 알림톡 템플릿 등록
3. `pages/api/bookings/notify-customer.ts` API 생성
4. 예약 생성 시 알림 연동
5. 예약 확정 시 알림 연동
6. 테스트 및 모니터링

---

## 12. 최종 요약 (실행 관점)

- **핵심 목표**  
  - 예약 생성/확정/완료 시, 고객에게 **카카오 알림톡 우선 + 실패 시 SMS 대체**,  
    내부 담당자에게는 **Slack 알림**을 보내는 일원화된 Notification 레이어 구축

- **재사용할 기존 모듈**  
  - SMS/카카오 발송: `pages/api/channels/sms/send.js`, `pages/api/admin/send-scheduled-sms.js`, `pages/api/admin/sms.js`, `utils/solapiSignature.js`  
  - Slack: `lib/slack-notification.js`, `pages/api/slack/notify.js`, `pages/api/kakao-content/slack-*.js`

- **신규로 추가할 핵심 API**  
  - `/api/bookings/notify-customer`: 예약 ID + 알림 타입만 넘기면 Solapi(SMS/카카오)를 통해 고객에게 알림 발송  
  - `/api/slack/booking-notify`: 예약 생성/확정 이벤트를 Slack `#예약-알림` 채널로 전송

- **Admin UX 방향**  
  - 예약 리스트/상세에 “예약 확정 + 알림 발송” 버튼 추가 → `/api/bookings/notify-customer` 호출  
  - “예약 알림 센터”(또는 예약 상세 하단 섹션)에서 알림 이력/성공여부/재발송 관리

- **실행 순서**  
  1. Solapi에서 카카오 알림톡 템플릿 승인 완료  
  2. `/api/bookings/notify-customer` 구현 및 예약 생성/확정 로직에 연동  
  3. `/api/slack/booking-notify` 구현 및 예약 생성/확정 이벤트에 연동  
  4. Admin UI에 버튼·이력 섹션 추가  
  5. 실제 고객/테스트 번호 대상 E2E 테스트 및 모니터링

---

**최종 업데이트**: 2025-11-24



- **SMS 대체**: 솔라피 SMS API
- **관리자 알림**: 슬랙 웹훅
- **데이터베이스**: Supabase

---

## 10. 참고 파일

- `pages/api/channels/sms/send.js` - 솔라피 SMS/MMS 발송 API
- `pages/api/slack/notify.js` - 슬랙 알림 API
- `utils/solapiSignature.js` - 솔라피 서명 생성 유틸리티
- `pages/api/bookings.ts` - 예약 생성 API
- `pages/api/bookings/[id].ts` - 예약 수정 API

---

## 11. 다음 단계

1. ✅ 서비스명 통계 확인 (진행 중)
2. 솔라피 카카오톡 알림톡 템플릿 등록
3. `pages/api/bookings/notify-customer.ts` API 생성
4. 예약 생성 시 알림 연동
5. 예약 확정 시 알림 연동
6. 테스트 및 모니터링

---

## 12. 최종 요약 (실행 관점)

- **핵심 목표**  
  - 예약 생성/확정/완료 시, 고객에게 **카카오 알림톡 우선 + 실패 시 SMS 대체**,  
    내부 담당자에게는 **Slack 알림**을 보내는 일원화된 Notification 레이어 구축

- **재사용할 기존 모듈**  
  - SMS/카카오 발송: `pages/api/channels/sms/send.js`, `pages/api/admin/send-scheduled-sms.js`, `pages/api/admin/sms.js`, `utils/solapiSignature.js`  
  - Slack: `lib/slack-notification.js`, `pages/api/slack/notify.js`, `pages/api/kakao-content/slack-*.js`

- **신규로 추가할 핵심 API**  
  - `/api/bookings/notify-customer`: 예약 ID + 알림 타입만 넘기면 Solapi(SMS/카카오)를 통해 고객에게 알림 발송  
  - `/api/slack/booking-notify`: 예약 생성/확정 이벤트를 Slack `#예약-알림` 채널로 전송

- **Admin UX 방향**  
  - 예약 리스트/상세에 “예약 확정 + 알림 발송” 버튼 추가 → `/api/bookings/notify-customer` 호출  
  - “예약 알림 센터”(또는 예약 상세 하단 섹션)에서 알림 이력/성공여부/재발송 관리

- **실행 순서**  
  1. Solapi에서 카카오 알림톡 템플릿 승인 완료  
  2. `/api/bookings/notify-customer` 구현 및 예약 생성/확정 로직에 연동  
  3. `/api/slack/booking-notify` 구현 및 예약 생성/확정 이벤트에 연동  
  4. Admin UI에 버튼·이력 섹션 추가  
  5. 실제 고객/테스트 번호 대상 E2E 테스트 및 모니터링

---

**최종 업데이트**: 2025-11-24



- **SMS 대체**: 솔라피 SMS API
- **관리자 알림**: 슬랙 웹훅
- **데이터베이스**: Supabase

---

## 10. 참고 파일

- `pages/api/channels/sms/send.js` - 솔라피 SMS/MMS 발송 API
- `pages/api/slack/notify.js` - 슬랙 알림 API
- `utils/solapiSignature.js` - 솔라피 서명 생성 유틸리티
- `pages/api/bookings.ts` - 예약 생성 API
- `pages/api/bookings/[id].ts` - 예약 수정 API

---

## 11. 다음 단계

1. ✅ 서비스명 통계 확인 (진행 중)
2. 솔라피 카카오톡 알림톡 템플릿 등록
3. `pages/api/bookings/notify-customer.ts` API 생성
4. 예약 생성 시 알림 연동
5. 예약 확정 시 알림 연동
6. 테스트 및 모니터링

---

## 12. 최종 요약 (실행 관점)

- **핵심 목표**  
  - 예약 생성/확정/완료 시, 고객에게 **카카오 알림톡 우선 + 실패 시 SMS 대체**,  
    내부 담당자에게는 **Slack 알림**을 보내는 일원화된 Notification 레이어 구축

- **재사용할 기존 모듈**  
  - SMS/카카오 발송: `pages/api/channels/sms/send.js`, `pages/api/admin/send-scheduled-sms.js`, `pages/api/admin/sms.js`, `utils/solapiSignature.js`  
  - Slack: `lib/slack-notification.js`, `pages/api/slack/notify.js`, `pages/api/kakao-content/slack-*.js`

- **신규로 추가할 핵심 API**  
  - `/api/bookings/notify-customer`: 예약 ID + 알림 타입만 넘기면 Solapi(SMS/카카오)를 통해 고객에게 알림 발송  
  - `/api/slack/booking-notify`: 예약 생성/확정 이벤트를 Slack `#예약-알림` 채널로 전송

- **Admin UX 방향**  
  - 예약 리스트/상세에 “예약 확정 + 알림 발송” 버튼 추가 → `/api/bookings/notify-customer` 호출  
  - “예약 알림 센터”(또는 예약 상세 하단 섹션)에서 알림 이력/성공여부/재발송 관리

- **실행 순서**  
  1. Solapi에서 카카오 알림톡 템플릿 승인 완료  
  2. `/api/bookings/notify-customer` 구현 및 예약 생성/확정 로직에 연동  
  3. `/api/slack/booking-notify` 구현 및 예약 생성/확정 이벤트에 연동  
  4. Admin UI에 버튼·이력 섹션 추가  
  5. 실제 고객/테스트 번호 대상 E2E 테스트 및 모니터링

---

**최종 업데이트**: 2025-11-24


