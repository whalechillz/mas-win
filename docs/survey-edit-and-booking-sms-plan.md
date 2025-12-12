# 설문 수정 기능 및 시타 예약 SMS 발송 기능 구현 계획서

## 📋 문서 정보
- **작성일**: 2025-12-15
- **상태**: 계획 단계
- **우선순위**: 높음

---

## 1. 구현 요구사항

### 1.1 설문 조사 관리 - 수정 기능
- [ ] 설문 항목 수정 기능 추가
- [ ] 수정 API 엔드포인트 생성
- [ ] 수정 UI (모달 또는 인라인 편집)

### 1.2 시타 예약 완료 시 고객에게 문자 발송
- [ ] 예약 완료 시 고객에게 자동 문자 발송
- [ ] 관리자가 확정 시에도 고객에게 문자 발송
- [ ] 스탭진 전화번호로도 발송 (010-6669-9000, 010-5704-0013)
- [ ] 예약 관리 설정 페이지에 알림 옵션 추가
  - [ ] 슬랙 알림 체크박스
  - [ ] 스탭진 알림 체크박스
  - [ ] 스탭진 전화번호 추가/삭제 기능

---

## 2. 상세 구현 계획

### 2.1 설문 조사 수정 기능

#### 2.1.1 API 엔드포인트
**파일**: `pages/api/survey/update.ts`
```typescript
PUT /api/survey/update
Body: {
  id: string;
  name?: string;
  phone?: string;
  age?: number;
  age_group?: string;
  selected_model?: string;
  important_factors?: string[];
  additional_feedback?: string;
  address?: string;
}
```

#### 2.1.2 프론트엔드 수정 UI
**파일**: `pages/admin/surveys/index.tsx`
- 테이블에 "수정" 버튼 추가
- 수정 모달 또는 인라인 편집 폼
- 수정 가능 필드:
  - 이름
  - 전화번호
  - 연령대
  - 선택 모델
  - 중요 요소 (체크박스)
  - 추가 의견
  - 주소

#### 2.1.3 데이터베이스
- 기존 `surveys` 테이블 사용
- `updated_at` 필드 자동 업데이트

---

### 2.2 시타 예약 SMS 발송 기능

#### 2.2.1 데이터베이스 스키마 확장

**파일**: `database/update-booking-settings-sms.sql`
```sql
-- booking_settings 테이블에 알림 설정 추가
ALTER TABLE booking_settings
ADD COLUMN IF NOT EXISTS enable_slack_notification BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_staff_notification BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS staff_phone_numbers TEXT[] DEFAULT ARRAY['010-6669-9000', '010-5704-0013']::TEXT[];

-- 기존 설정 업데이트
UPDATE booking_settings
SET 
  enable_slack_notification = true,
  enable_staff_notification = true,
  staff_phone_numbers = ARRAY['010-6669-9000', '010-5704-0013']::TEXT[]
WHERE id = '00000000-0000-0000-0000-000000000001';
```

#### 2.2.2 예약 완료 시 SMS 발송

**파일**: `pages/api/bookings/[id].ts` 수정
- 예약 상태가 `confirmed`로 변경될 때:
  1. 고객에게 SMS 발송 (`/api/bookings/notify-customer` 호출)
  2. 설정에 따라 슬랙 알림 발송
  3. 설정에 따라 스탭진에게 SMS 발송

**파일**: `pages/api/booking.js` 수정
- 예약 생성 시 (`status: 'pending'`):
  1. 고객에게 예약 접수 SMS 발송
  2. 설정에 따라 슬랙 알림 발송
  3. 설정에 따라 스탭진에게 SMS 발송

#### 2.2.3 스탭진 SMS 발송 API

**파일**: `pages/api/bookings/notify-staff.ts` (신규)
```typescript
POST /api/bookings/notify-staff
Body: {
  bookingId: number;
  message: string; // 선택사항, 기본 메시지 사용 가능
}
```

기능:
- `booking_settings`에서 `staff_phone_numbers` 조회
- `enable_staff_notification`이 true인 경우에만 발송
- 각 스탭진 번호로 예약 정보 SMS 발송

#### 2.2.4 예약 관리 설정 UI

**파일**: `components/admin/bookings/BookingSettings.tsx` 수정

추가할 섹션:
```typescript
// 알림 설정
{
  enable_slack_notification: boolean;
  enable_staff_notification: boolean;
  staff_phone_numbers: string[];
}
```

UI 구성:
1. **슬랙 알림 설정**
   - 체크박스: "예약 완료 시 슬랙 알림 발송"
   - 설명: "예약이 완료되거나 확정될 때 슬랙 채널로 알림을 보냅니다."

2. **스탭진 알림 설정**
   - 체크박스: "예약 완료 시 스탭진에게 SMS 발송"
   - 설명: "예약이 완료되거나 확정될 때 스탭진 전화번호로 SMS를 보냅니다."
   
3. **스탭진 전화번호 관리**
   - 전화번호 목록 표시 (배열)
   - 전화번호 추가 입력 필드 + "추가" 버튼
   - 각 전화번호 옆에 "삭제" 버튼
   - 전화번호 형식 검증 (010-XXXX-XXXX)

---

## 3. SMS 메시지 템플릿

### 3.1 고객용 메시지

#### 예약 접수 (pending)
```
[마쓰구골프] {고객명}님, 시타 예약 요청이 접수되었습니다.
예약일시: {날짜} {시간}
예약 가능 여부 확인 후 연락드리겠습니다.
문의: 031-215-0013
```

#### 예약 확정 (confirmed)
```
[마쓰구골프] {고객명}님, 예약이 확정되었습니다!
예약일시: {날짜} {시간}
장소: 마쓰구골프 [수원 본점]
문의: 031-215-0013
```

### 3.2 스탭진용 메시지

#### 예약 접수
```
[시타 예약 접수]
고객명: {고객명}
전화번호: {전화번호}
예약일시: {날짜} {시간}
서비스: {서비스명}
```

#### 예약 확정
```
[시타 예약 확정]
고객명: {고객명}
전화번호: {전화번호}
예약일시: {날짜} {시간}
서비스: {서비스명}
확정 시간: {확정일시}
```

---

## 4. 구현 순서

### Phase 1: 설문 수정 기능
1. ✅ API 엔드포인트 생성 (`/api/survey/update.ts`)
2. ✅ 프론트엔드 수정 UI 추가
3. ✅ 테스트

### Phase 2: 예약 설정 확장
1. ✅ 데이터베이스 스키마 업데이트
2. ✅ 설정 API 업데이트 (`/api/bookings/settings`)
3. ✅ 설정 UI 업데이트 (BookingSettings 컴포넌트)

### Phase 3: SMS 발송 기능
1. ✅ 스탭진 SMS 발송 API 생성
2. ✅ 예약 생성 시 SMS 발송 로직 추가
3. ✅ 예약 확정 시 SMS 발송 로직 추가
4. ✅ 슬랙 알림 연동 (기존 코드 활용)

### Phase 4: 통합 테스트
1. ✅ 전체 플로우 테스트
2. ✅ 에러 처리 검증
3. ✅ 성능 최적화

---

## 5. 파일 구조

```
pages/
├── api/
│   ├── survey/
│   │   └── update.ts (신규)
│   └── bookings/
│       ├── [id].ts (수정)
│       ├── notify-staff.ts (신규)
│       └── settings.ts (수정)
│
components/
└── admin/
    └── bookings/
        └── BookingSettings.tsx (수정)

pages/
└── admin/
    └── surveys/
        └── index.tsx (수정)

database/
└── update-booking-settings-sms.sql (신규)
```

---

## 6. 주의사항

1. **전화번호 형식 검증**
   - 입력: `010-XXXX-XXXX` 또는 `010XXXXXXXX`
   - 저장: `010-XXXX-XXXX` 형식으로 정규화

2. **SMS 발송 실패 처리**
   - 고객 SMS 실패 시 로그만 기록 (알림은 계속 진행)
   - 스탭진 SMS 실패 시 관리자에게 알림 (선택사항)

3. **중복 발송 방지**
   - 같은 예약에 대해 동일한 알림은 한 번만 발송
   - 상태 변경 이력 확인

4. **비용 관리**
   - SMS 발송 건수 모니터링
   - 스탭진 번호는 최소한으로 유지

---

## 7. 테스트 시나리오

### 7.1 설문 수정
1. 설문 목록에서 "수정" 버튼 클릭
2. 모달에서 정보 수정
3. 저장 후 목록에서 변경사항 확인

### 7.2 예약 완료 SMS
1. 고객이 예약 신청
2. 고객에게 예약 접수 SMS 발송 확인
3. 스탭진에게 예약 접수 SMS 발송 확인 (설정 활성화 시)
4. 슬랙 알림 발송 확인 (설정 활성화 시)

### 7.3 예약 확정 SMS
1. 관리자가 예약 확정
2. 고객에게 예약 확정 SMS 발송 확인
3. 스탭진에게 예약 확정 SMS 발송 확인 (설정 활성화 시)

### 7.4 설정 변경
1. 예약 설정에서 스탭진 알림 체크박스 해제
2. 예약 생성 시 스탭진 SMS 미발송 확인
3. 스탭진 전화번호 추가/삭제 테스트

---

## 8. 향후 개선 사항

1. **메시지 템플릿 커스터마이징**
   - 관리자가 SMS 메시지 템플릿 수정 가능

2. **발송 이력 관리**
   - SMS 발송 이력 조회 페이지
   - 발송 실패 이력 및 재발송 기능

3. **알림 타입 세분화**
   - 예약 접수/확정/취소/완료별 다른 메시지
   - 시간대별 발송 제한 설정

