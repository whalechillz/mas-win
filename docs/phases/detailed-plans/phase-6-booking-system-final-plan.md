# Phase 6: 시타 예약 시스템 최종 계획 및 진행 상황

## 📋 문서 정보
- **작성일**: 2025-11-23
- **최종 업데이트**: 2025-11-24
- **상태**: 진행 중
- **우선순위**: 높음

---

## ✅ 최신 완료 작업 (2025-11-24)

### 7. 예약 양식 개선 (단계적 몰입형 양식) ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ **3단계 진행형 양식** 구현:
  - Phase 1: 기본 정보 (이름, 전화번호, 이메일, 연령대)
  - Phase 2: 골프 정보 (클럽 브랜드, 로프트, 샤프트, 비거리, 탄도, 구질)
  - Phase 3: 개인화 (추가 메모)
- ✅ **진행률 표시**: 골프 프로필 완성도 바 및 퍼센트 표시
- ✅ **시각적 피드백**: 단계별 체크마크, 진행률 바 애니메이션
- ✅ **게이미피케이션**: "상세 정보를 입력하시면 더 정확한 피팅이 가능합니다" 메시지

#### 관련 파일
- `pages/booking/form.tsx` (전면 개편)

---

### 8. 클럽 정보 구조화 ✅
**구현 완료 날짜**: 2025-11-24

#### 데이터베이스 스키마 확장
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS club_brand TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS club_loft DECIMAL(3,1);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS club_shaft TEXT;
```

#### 구현 내용
- ✅ 클럽 정보를 브랜드, 로프트, 샤프트로 분리
- ✅ 로프트 각도: 8.5° ~ 12.0° 드롭다운 선택
- ✅ 샤프트 강도: L, R, SR, S, X 드롭다운 선택
- ✅ 브랜드 입력 시 자동완성 기능 연동

#### 관련 파일
- `pages/booking/form.tsx`
- `pages/api/bookings.ts` (POST 요청 처리)
- `scripts/extend-booking-form-schema.sql`

---

### 9. 탄도, 구질 필드 추가 ✅
**구현 완료 날짜**: 2025-11-24

#### 데이터베이스 스키마 확장
```sql
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trajectory TEXT; -- 'high', 'mid', 'low'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS shot_shape TEXT; -- 'fade', 'draw', 'straight', 'hook', 'slice'
```

#### 구현 내용
- ✅ **탄도 선택**: 고/중/저 버튼 선택 (시각적 피드백)
- ✅ **구질 선택**: 페이드/드로우/스트레이트/훅/슬라이스 버튼 선택
- ✅ 고객 프로필 자동 업데이트 (기존 값이 없을 때만)

#### 관련 파일
- `pages/booking/form.tsx`
- `pages/api/bookings.ts`

---

### 10. 브랜드 자동완성 기능 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ `/api/bookings/club-brands.ts` API 엔드포인트 생성
- ✅ 주요 골프 브랜드 기본 데이터 제공 (타이틀리스트, 캘러웨이, MASSGOO 등)
- ✅ 기존 예약 데이터에서 브랜드 추출 및 자동완성
- ✅ 실시간 자동완성 UI (드롭다운)
- ✅ 외부 클릭 시 자동완성 닫기

#### 관련 파일
- `pages/api/bookings/club-brands.ts`
- `pages/booking/form.tsx`

---

### 11. 고객 프로필 자동 생성 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ 예약 생성 시 고객이 없으면 자동 생성
- ✅ 고객 정보 자동 업데이트:
  - 방문 횟수 증가
  - 최근 방문일 업데이트
  - 평균 비거리 업데이트 (더 큰 값일 때)
  - 탄도/구질 업데이트 (기존 값이 없을 때)
- ✅ 전화번호 정규화 및 중복 방지

#### 관련 파일
- `pages/api/bookings.ts` (POST 요청 처리)

---

### 12. Wix 데이터 마이그레이션 스크립트 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ `scripts/migrate-wix-bookings.ts` 마이그레이션 스크립트 생성
- ✅ CSV 파일 읽기 및 파싱
- ✅ 고객 데이터 집계 (방문 횟수, 방문 날짜, No Show 카운트)
- ✅ 이메일 필터링 (`@aa.aa`, `massgoogolf@gmail.com`, `massgoogolf@naver.com` 제외)
- ✅ 날짜 처리 (Wix 등록일과 시스템 첫 문의일 중 더 오래된 날짜 사용)
- ✅ 고객 생성/업데이트 (upsert)
- ✅ 예약 데이터 마이그레이션
- ✅ 마이그레이션 가이드 문서 작성

#### 관련 파일
- `scripts/migrate-wix-bookings.ts`
- `scripts/wix-booking-migration.md`

---

### 13. 운영시간 관리 UI 개선 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ 활성화된 장소가 없을 때 안내 메시지 표시
- ✅ 비활성화된 장소 목록 표시
- ✅ 기본 장소 및 운영시간 자동 생성 버튼

#### 관련 파일
- `components/admin/bookings/BookingSettings.tsx`

---

---

## ✅ 완료된 작업 (2025-11-23 ~ 2025-11-24)

### 1. 예약 설정 확장 ✅
**구현 완료 날짜**: 2025-11-23

#### 데이터베이스 스키마 확장
```sql
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS max_advance_days INTEGER DEFAULT 14;
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS show_call_message BOOLEAN DEFAULT true;
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS call_message_text TEXT DEFAULT '원하시는 시간에 예약이 어려우신가요? 전화로 문의해주세요.';
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS max_weekly_slots INTEGER DEFAULT 10;
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS auto_block_excess_slots BOOLEAN DEFAULT true;
```

#### 구현 내용
- ✅ `BookingSettings` 인터페이스 확장
- ✅ `/api/bookings/settings.ts` API 수정 (GET/PUT)
- ✅ 관리자 UI에 새 필드 추가:
  - 예약 가능 기간 (일) - 숫자 입력
  - 주당 최대 슬롯 수 - 숫자 입력
  - 초과 슬롯 자동 차단 - 토글
  - "전화 주세요" 메시지 표시 - 토글
  - 메시지 내용 - 텍스트 입력

#### 관련 파일
- `components/admin/bookings/BookingSettings.tsx`
- `pages/api/bookings/settings.ts`

---

### 2. 예약 가능 기간 제한 적용 ✅
**구현 완료 날짜**: 2025-11-23

#### 구현 내용
- ✅ `/api/bookings/available.ts`에 `max_advance_days` 체크 로직 추가
- ✅ `/api/bookings/next-available.ts`에 `max_advance_days` 적용
- ✅ `pages/booking.tsx`에서 최대 날짜 동적 계산
- ✅ 예약 가능 기간을 넘는 날짜 선택 시 제한 메시지 표시

#### 관련 파일
- `pages/api/bookings/available.ts`
- `pages/api/bookings/next-available.ts`
- `pages/booking.tsx`

---

### 3. 여러 타임슬롯 지원 ✅
**구현 완료 날짜**: 2025-11-23

#### 구현 내용
- ✅ 운영시간 관리 UI 개선:
  - 요일별 여러 타임슬롯 추가/삭제 기능
  - 각 타임슬롯의 시작/종료 시간 입력
  - 타임슬롯별 삭제 버튼
- ✅ API에서 여러 타임슬롯 조회 및 처리:
  - `/api/bookings/available.ts`: 여러 타임슬롯 지원
  - `/api/bookings/next-available.ts`: 여러 타임슬롯 지원
- ✅ 각 타임슬롯의 시작 시간만 예약 가능 시간으로 표시

#### 관련 파일
- `components/admin/bookings/BookingSettings.tsx` (운영시간 관리 탭)
- `pages/api/bookings/available.ts`
- `pages/api/bookings/next-available.ts`

---

### 4. "전화 주세요" 메시지 표시 ✅
**구현 완료 날짜**: 2025-11-23

#### 구현 내용
- ✅ 제한 메시지와 함께 "전화 주세요" 메시지 표시
- ✅ 예약 가능 시간이 없을 때 동적 메시지 표시
- ✅ `show_call_message` 설정에 따라 조건부 표시
- ✅ 전화 버튼 및 연락처 정보 표시

#### 관련 파일
- `pages/booking.tsx`

---

### 5. 가상 예약 및 차단 기능 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ `booking_blocks` 테이블에 `is_virtual` 컬럼 추가
- ✅ 가상 예약 생성/삭제 기능
- ✅ 관리자 캘린더에서 가상 예약 표시 (노란색 배경)
- ✅ 차단 삭제 기능 (클릭 시 삭제)
- ✅ 프론트엔드에서 가상 예약 및 실제 예약 X 표시

#### 관련 파일
- `components/admin/bookings/BookingCalendarView.tsx`
- `components/admin/bookings/BlockTimeModal.tsx`
- `pages/api/bookings/blocks.ts`
- `pages/booking.tsx`

---

### 6. 최소 사전 예약 시간 로직 개선 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ 오늘 날짜: 현재 시간 + min_advance_hours 이후의 슬롯만 표시
- ✅ 내일 이후 날짜: 모든 슬롯 표시
- ✅ 각 슬롯 시간 확인 시 최소 사전 예약 시간 체크

#### 관련 파일
- `pages/api/bookings/available.ts`

---

### 7. 결정론적 셔플 적용 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ 주의 시작일을 시드로 사용하는 결정론적 셔플 함수 추가
- ✅ 같은 주의 같은 날짜를 클릭해도 항상 같은 슬롯이 차단됨
- ✅ 날짜 클릭할 때마다 슬롯이 바뀌는 문제 해결

#### 관련 파일
- `pages/api/bookings/available.ts`

---

### 8. 시간 정렬 개선 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ API에서 HH:MM 형식의 시간을 숫자로 변환하여 정렬
- ✅ 프론트엔드에서도 시간 정렬 함수 적용
- ✅ availableTimes, virtualTimes, bookedTimes 모두 정렬

#### 관련 파일
- `pages/api/bookings/available.ts`
- `pages/booking.tsx`

---

### 9. 차단 시간 저장/조회 문제 해결 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ 차단 시간 형식 정규화 (11:00 형식으로 통일)
- ✅ 차단 시간 조회 시 `is_virtual=false` 필터 적용
- ✅ 시간 유효성 검증 추가
- ✅ `next-available.ts`에서도 차단 시간 고려

#### 관련 파일
- `pages/api/bookings/available.ts`
- `pages/api/bookings/next-available.ts`
- `components/admin/bookings/BlockTimeModal.tsx`

---

### 10. 다음 예약 가능일 동적 갱신 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ 캐시 방지를 위한 타임스탬프 추가
- ✅ `handleNextAvailableClick`에서 항상 최신 정보 조회
- ✅ 초기 로드 시 자동 조회

#### 관련 파일
- `pages/booking.tsx`
- `pages/api/bookings/next-available.ts`

---

### 11. 운영시간 슬롯 시각적 구분 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ 빈 슬롯: 점선 + 밝은 파란 배경 + 호버 효과
- ✅ 운영시간 있음: 점선 + 연한 파란 배경
- ✅ 운영시간 없음: 흐리게 + 비활성화
- ✅ 빈 슬롯 호버 시 "빈 슬롯" + "더블클릭: 차단" 힌트 표시

#### 관련 파일
- `components/admin/bookings/BookingCalendarView.tsx`

---

### 12. 차단 기능을 운영시간 기준으로 제한 ✅
**구현 완료 날짜**: 2025-11-24

#### 구현 내용
- ✅ 더블클릭 시 운영시간 체크 (운영시간 없으면 차단 불가)
- ✅ 클릭 시 운영시간 체크 (운영시간 없으면 클릭 불가)
- ✅ 운영시간 없는 슬롯은 시각적으로 비활성화

#### 관련 파일
- `components/admin/bookings/BookingCalendarView.tsx`

---

## 🔄 새로운 개선 계획 (2025-11-24)

### Phase 6-7: 가상 예약 저장 기능 재설계

#### 현재 문제점
- **기존 방식**: API에서 동적으로 가상 예약 처리 (DB 저장 없음)
- **문제**: 매번 API 호출 시 랜덤하게 차단되어 일관성 없음
- **사용자 요구사항**: 버튼 클릭으로 가상 예약을 DB에 저장하여 일관성 유지

#### 개선 목표
1. **기존 동적 처리 로직 제거**
   - `pages/api/bookings/available.ts`에서 주당 최대 슬롯 수 동적 처리 로직 제거
   - `auto_block_excess_slots` 토글은 유지하되 기능 비활성화

2. **새로운 가상 예약 생성 API**
   - `/api/bookings/generate-virtual-blocks` (POST) 생성
   - 해당 주의 모든 운영시간 슬롯 조회
   - 실제 예약 수 확인
   - 초과분을 랜덤하게 선택 (결정론적 셔플 사용)
   - `booking_blocks`에 `is_virtual=true`로 저장

3. **UI 개선**
   - "주당 최대 슬롯 수" 옆에 "가상 예약 생성" 버튼 추가
   - 버튼 클릭 시 현재 주의 가상 예약 생성
   - 성공/실패 알림
   - 캘린더 자동 새로고침

#### 구현 세부 사항

**1단계: 기존 로직 제거**
- `pages/api/bookings/available.ts` 203-462번째 줄의 주당 최대 슬롯 수 동적 처리 로직 제거
- weeklySlots 조회 로직 제거
- 랜덤 차단 로직 제거
- finalAvailableTimes, finalVirtualTimes 계산 로직 단순화

**2단계: 새로운 API 생성**
- `pages/api/bookings/generate-virtual-blocks.ts` 생성
- POST 요청 처리:
  - `week_start_date`: 주의 시작일 (일요일)
  - `max_slots`: 주당 최대 슬롯 수
- 해당 주의 모든 운영시간 슬롯 조회
- 실제 예약 수 확인
- 초과분 계산 및 랜덤 선택 (결정론적 셔플 사용)
- `booking_blocks`에 가상 예약 저장

**3단계: UI 개선**
- `components/admin/bookings/BookingSettings.tsx`에 "가상 예약 생성" 버튼 추가
- 버튼 클릭 시 현재 주의 시작일 계산
- API 호출 및 결과 표시

**4단계: 기존 가상 예약 관리**
- 이미 생성된 가상 예약은 유지
- 버튼 재클릭 시 기존 가상 예약 확인 후 추가 생성 또는 업데이트 옵션 제공

---

### Phase 6-8: 운영시간 캘린더 표시 개선

#### 목표
- 관리자 캘린더에서 운영시간이 설정된 시간대를 점선으로 표시
- 운영시간과 비운영시간을 시각적으로 구분

#### 구현 계획

**1단계: 운영시간 데이터 로드**
- `components/admin/bookings/BookingCalendarView.tsx`에서 `booking_hours` 테이블 조회
- 요일별로 그룹화

**2단계: 운영시간 확인 함수**
- `isOperatingHour` 함수 추가
- 특정 날짜/시간이 운영시간에 포함되는지 확인

**3단계: 점선 스타일 적용**
- 캘린더 셀에 조건부 스타일 적용
- 운영시간이 있는 셀: `border-dashed border-blue-300 bg-blue-50/30`
- 운영시간이 없는 셀: 기본 스타일

---

### Phase 6-9: 시간 순서 문제 최종 해결

#### 현재 상태
- API와 프론트엔드에서 정렬 로직 추가했으나 여전히 순서가 맞지 않음

#### 문제 원인 분석
1. API에서 정렬 후 반환
2. 프론트엔드에서 다시 정렬
3. 렌더링 시 추가 정렬이 필요할 수 있음

#### 해결 방안
- 프론트엔드에서 한 번만 정렬하도록 수정
- `useMemo`를 사용하여 정렬된 배열 메모이제이션
- 렌더링 시 정렬 로직 제거

---

## 🔍 확인된 문제 및 수정 필요 사항

### 1. 시간 순서 문제 ⚠️
**문제**: API와 프론트엔드에서 정렬했지만 여전히 순서가 맞지 않음

**현재 상태**:
- API에서 `sortTimes` 함수로 정렬
- 프론트엔드에서도 정렬 함수 적용
- 렌더링 시 추가 정렬

**해결 방안**:
- `useMemo`를 사용하여 정렬된 배열 메모이제이션
- 렌더링 시 정렬 로직 제거
- 단일 정렬 지점 확보

**수정 위치**: `pages/booking.tsx` 422번째 줄, 454번째 줄

---

### 2. 가상 예약 저장 기능 재설계 필요 ⚠️
**문제**: 현재 동적 처리 방식으로 인해 일관성 없음

**현재 상태**:
- API에서 매번 랜덤하게 차단
- DB에 저장되지 않음

**해결 방안**:
- 기존 동적 처리 로직 제거
- 버튼 기반 가상 예약 생성 API 구현
- DB에 저장하여 일관성 유지

**수정 위치**: 
- `pages/api/bookings/available.ts` (203-462번째 줄)
- `components/admin/bookings/BookingSettings.tsx` (새 버튼 추가)

---

### 3. 운영시간 캘린더 표시 ⚠️
**문제**: 운영시간이 설정된 시간대를 시각적으로 구분할 수 없음

**현재 상태**:
- 운영시간 정보를 캘린더에 표시하지 않음

**해결 방안**:
- 운영시간 데이터 로드
- 운영시간이 있는 셀에 점선 스타일 적용

**수정 위치**: `components/admin/bookings/BookingCalendarView.tsx`

---

### 4. 예약 정보 입력 페이지 로고 ❌
**문제**: `pages/booking/form.tsx`에서 로고가 텍스트로 표시됨

**현재 상태**:
```tsx
<div className="text-xl font-bold text-gray-900">MASSGOO</div>
```

**수정 필요**:
- `pages/booking.tsx`와 동일하게 이미지 로고 사용
- `/main/logo/massgoo_logo_black.png` 사용

**수정 위치**: `pages/booking/form.tsx` 140번째 줄

---

### 5. 운영시간 관리 UI 표시 문제 ⚠️
**문제**: 활성화된 장소(`is_active: true`)가 없으면 운영시간 관리 UI가 표시되지 않음

**현재 로직**:
```tsx
{locations.filter(loc => loc.is_active).map((location) => {
  // 운영시간 관리 UI
})}
```

**해결 방안**:
1. **옵션 1**: 활성화된 장소가 없을 때 안내 메시지 표시
2. **옵션 2**: 활성화되지 않은 장소도 표시하되 비활성화 상태로 표시
3. **옵션 3**: 기본 장소 자동 생성 로직 추가

**권장**: 옵션 1 + 옵션 3 (기본 장소 자동 생성)

---

## 📊 데이터베이스 스키마 현황

### 완료된 스키마 확장
```sql
-- booking_settings 테이블 확장
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS max_advance_days INTEGER DEFAULT 14;
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS show_call_message BOOLEAN DEFAULT true;
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS call_message_text TEXT DEFAULT '원하시는 시간에 예약이 어려우신가요? 전화로 문의해주세요.';
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS max_weekly_slots INTEGER DEFAULT 10;
ALTER TABLE booking_settings ADD COLUMN IF NOT EXISTS auto_block_excess_slots BOOLEAN DEFAULT true;

-- booking_blocks 테이블 확장
ALTER TABLE booking_blocks ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT false;
```

### 예정된 스키마 확장 (예약 양식 개선)
```sql
-- bookings 테이블 확장 (예정)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS club_brand TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS club_loft DECIMAL(3,1);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS club_shaft TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trajectory TEXT; -- 'high', 'mid', 'low'
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS shot_shape TEXT; -- 'fade', 'draw', 'straight', 'hook', 'slice'

-- customers 테이블 확장 (예정)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avg_distance INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_trajectory TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS typical_shot_shape TEXT;
```

---

## 🎯 다음 단계: 예약 양식 개선 계획

### Phase 6-6: 예약 양식 개선 (진행 예정)

#### 목표
- Wix 예약 데이터 분석 기반 양식 개선
- 고객 참여도 및 몰입도 향상
- 단계적 정보 입력 (Progressive Disclosure)
- 데이터 품질 향상

#### Wix 데이터 분석 결과
- **초기 양식 (2017-2020)**: 상세 필드 (클럽, 비거리, 탄도, 구질, 연령대) - 작성률 60-70%
- **최근 양식 (2023-2025)**: 간소화 (현재클럽, 현재 비거리, 연령대) - 작성률 30-40%
- **결론**: 상세 필드가 있으면 작성률이 높지만, 최근 간소화로 작성률 하락

#### 개선 전략: 단계적 몰입형 양식

**Phase 1: 필수 정보 (1단계 - 빠른 예약)**
- 이름
- 전화번호
- 이메일 (선택)
- 연령대 (드롭다운)

**Phase 2: 골프 정보 (2단계 - 선택적, 몰입 유도)**
- 현재 사용 클럽
  - 브랜드 (자동완성)
  - 로프트 각도 (드롭다운: 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12)
  - 샤프트 강도 (드롭다운: L, R, SR, S, X)
- 현재 비거리
  - 숫자 입력 (m)
  - 또는 범위 선택 (150-170, 170-190, 190-210, 210-230, 230+)
- 탄도 (선택)
  - 고 / 중 / 저 (버튼 선택)
- 구질 (선택)
  - 페이드 / 드로우 / 스트레이트 / 훅 / 슬라이스 (버튼 선택)

**Phase 3: 개인화 (3단계 - 몰입 강화)**
- 추가 메모
  - "어떤 부분을 개선하고 싶으신가요?" (예: 비거리, 정확도, 탄도 등)
  - "특별히 관심 있는 클럽이 있으신가요?"

#### UI/UX 개선 사항
1. **시각적 진행 표시**: 진행률 바, 단계별 체크마크
2. **스마트 자동완성**: 브랜드 입력 시 자동완성 (기존 데이터 기반)
3. **시각적 피드백**: 각 단계 완료 시 체크마크, 진행률 표시
4. **동적 필드 표시**: 연령대 선택 시 평균 비거리 힌트, 비거리 입력 시 탄도 추천
5. **게이미피케이션**: "골프 프로필 완성도: 60%", "상세 정보를 입력하시면 더 정확한 피팅이 가능합니다"

#### 예상 효과
- **참여도 향상**: 30-40% → 70-80% 목표
- **몰입도 향상**: 단순 정보 입력 → 골프 프로필 완성 경험
- **예약 전환율 향상**: 정보 입력 → 몰입 → 예약 확정
- **데이터 품질 향상**: 자유 텍스트 → 구조화된 데이터

#### 구현 우선순위
1. **즉시 적용 (1주일)**:
   - 현재 양식에 탄도, 구질 필드 추가 (선택)
   - 클럽 정보 구조화 (브랜드, 로프트, 샤프트 분리)
   - 데이터베이스 스키마 확장
   - 자동완성 기능 (브랜드)

2. **단기 (2-3주)**:
   - 단계적 양식 UI 구현
   - 진행률 표시
   - 스마트 힌트 시스템
   - 게이미피케이션 요소

3. **중기 (1개월)**:
   - 데이터 마이그레이션 스크립트
   - Wix 데이터 정제 및 이관
   - 고객 프로필 자동 생성
   - 피팅 추천 알고리즘 기반 데이터 활용

---

## 📝 데이터 마이그레이션 계획

### 전화번호 파싱 및 정규화 규칙

**저장 형식**: 숫자만 저장 (하이픈 제거)
**표시 형식**: 하이픈 추가 (010-1234-5678)

#### 파싱 규칙
```javascript
function normalizePhone(phone) {
  if (!phone) return null;
  
  // 1. 모든 공백, 하이픈, 괄호, + 제거
  let cleaned = phone.toString().replace(/[\s\-+()]/g, '');
  
  // 2. +82로 시작하면 0으로 변환
  if (cleaned.startsWith('82')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // 3. 01로 시작하면 010으로 변경 (01-1234-5678 → 010-1234-5678)
  if (cleaned.startsWith('01') && cleaned.length === 10) {
    cleaned = '010' + cleaned.substring(2);
  }
  
  // 4. 유효성 검사 (11자리 숫자만 허용)
  if (!/^010\d{8}$/.test(cleaned)) {
    console.warn(`⚠️ 유효하지 않은 전화번호: ${phone} → ${cleaned}`);
    return null;
  }
  
  return cleaned; // 숫자만 반환 (하이픈 없음)
}

function formatPhoneForDisplay(phone) {
  if (!phone || phone.length !== 11) return phone;
  // 010-1234-5678 형식으로 변환
  return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
}
```

#### 입력 형식 예시
- `+82 10-1234-5678` → 저장: `01012345678`, 표시: `010-1234-5678`
- `821012345678` → 저장: `01012345678`, 표시: `010-1234-5678`
- `010-1234-5678` → 저장: `01012345678`, 표시: `010-1234-5678`
- `01-1234-5678` → 저장: `01012345678`, 표시: `010-1234-5678`
- `010 1234 5678` → 저장: `01012345678`, 표시: `010-1234-5678`

#### 적용 위치
1. **마이그레이션 스크립트**: `scripts/migrate-wix-bookings.js`
2. **API 엔드포인트**: `pages/api/bookings.ts` (POST/PUT)
3. **프론트엔드 입력**: `pages/booking/form.tsx`
4. **유틸리티 함수**: `lib/formatters.js`, `lib/auth.ts`

---

### Wix CSV 데이터 매핑
**파일**: `예약 목록-2025. 11. 26..csv` (900건)

**매핑 규칙**:
```javascript
{
  // 기본 정보
  "이름" → name
  "전화번호" → phone (정규화: normalizePhone 함수 사용)
  "이메일" → email
  
  // 골프 정보
  "현재클럽 (브랜드, 로프트 각도, 샤프트 강도)" → club (파싱 필요)
  "현재 비거리" → current_distance (숫자 추출)
  "연령대" → age_group
  
  // 추가 정보 (옵션)
  "탄도(고/중/저)" → trajectory (새 필드)
  "구질(페이드/드로우/훅/슬라이스)" → shot_shape (새 필드)
  
  // 예약 정보
  "예약 시작 시간" → date, time
  "서비스명" → service_type
}
```

### 데이터 정제 로직
- **전화번호 정규화**: 
  - `+82 10-1234-5678` → `01012345678` (저장)
  - `01-1234-5678` → `01012345678` (01 → 010 변환)
  - `821012345678` → `01012345678` (82 → 0 변환)
  - 표시 시: `01012345678` → `010-1234-5678`
- **클럽 정보 파싱**: "젝시오,10.5,S" → { brand: "젝시오", loft: 10.5, shaft: "S" }
- **비거리 정규화**: "180m" → 180, "200~220m" → 210 (평균값)
- **연령대 정규화**: "60대" → "60대", "63세" → "60대", "70" → "70대 이상"

### 마이그레이션 스크립트
**파일**: `scripts/migrate-wix-form-data.js` (작성 예정)

**기능**:
1. CSV 파일 읽기
2. 각 행 파싱
3. 데이터 정제 및 매핑
4. customers 테이블 업데이트/생성
5. bookings 테이블에 기존 예약 정보 연결
6. trajectory, shot_shape 필드 추가

---

## 📁 관련 파일 목록

### 완료된 파일
- `components/admin/bookings/BookingSettings.tsx` - 예약 설정 UI
- `components/admin/bookings/BookingCalendarView.tsx` - 예약 캘린더 뷰
- `components/admin/bookings/BlockTimeModal.tsx` - 차단 시간 설정 모달
- `pages/api/bookings/settings.ts` - 예약 설정 API
- `pages/api/bookings/available.ts` - 예약 가능 시간 조회 API
- `pages/api/bookings/next-available.ts` - 다음 예약 가능일 조회 API
- `pages/api/bookings/blocks.ts` - 차단 시간 관리 API
- `pages/booking.tsx` - 예약 캘린더 페이지

### 수정 필요 파일
- `pages/booking.tsx` - 시간 정렬 로직 개선 (useMemo 적용)
- `pages/api/bookings/available.ts` - 동적 처리 로직 제거
- `components/admin/bookings/BookingSettings.tsx` - 가상 예약 생성 버튼 추가
- `components/admin/bookings/BookingCalendarView.tsx` - 운영시간 표시 추가
- `pages/booking/form.tsx` - 예약 정보 입력 페이지 (로고 수정 필요)

### 작성 예정 파일
- `pages/api/bookings/generate-virtual-blocks.ts` - 가상 예약 생성 API
- `scripts/migrate-wix-form-data.js` - Wix 데이터 마이그레이션 스크립트
- `components/booking/ProgressiveBookingForm.tsx` - 단계적 예약 양식 컴포넌트
- `pages/api/bookings/brands.ts` - 브랜드 자동완성 API

---

## ✅ 체크리스트

### 완료된 항목
- [x] 예약 설정 확장 (max_advance_days, show_call_message, call_message_text, max_weekly_slots, auto_block_excess_slots)
- [x] 예약 가능 기간 제한 적용 (API 및 프론트엔드)
- [x] 여러 타임슬롯 지원 (운영시간 관리 UI 및 API)
- [x] "전화 주세요" 메시지 표시
- [x] 데이터베이스 스키마 확장
- [x] 가상 예약 및 차단 기능
- [x] 최소 사전 예약 시간 로직 개선
- [x] 결정론적 셔플 적용
- [x] 시간 정렬 개선 (부분 완료)

### 진행 중/예정 항목
- [ ] 시간 순서 문제 최종 해결 (useMemo 적용)
- [ ] 가상 예약 저장 기능 재설계 (버튼 기반)
- [ ] 운영시간 캘린더 표시 (점선 스타일)
- [ ] 예약 정보 입력 페이지 로고 수정
- [ ] 운영시간 관리 UI 개선 (활성화된 장소 없을 때 처리)
- [ ] 예약 양식 개선 (단계적 몰입형 양식)
- [ ] 클럽 정보 구조화 (브랜드, 로프트, 샤프트 분리)
- [ ] 탄도, 구질 필드 추가
- [ ] 브랜드 자동완성 기능
- [ ] Wix 데이터 마이그레이션 스크립트
- [ ] 고객 프로필 자동 생성

---

## 📚 참고 자료

### 기존 문서
- `docs/phases/detailed-plans/phase-6-detailed-plan.md` - 초기 계획
- `docs/project_plan.md` - 프로젝트 전체 계획

### 관련 API
- `/api/bookings/settings` - 예약 설정 조회/수정
- `/api/bookings/available` - 예약 가능 시간 조회
- `/api/bookings/next-available` - 다음 예약 가능일 조회
- `/api/bookings/blocks` - 차단 시간 관리
- `/api/bookings/generate-virtual-blocks` - 가상 예약 생성 (예정)
- `/api/bookings` - 예약 CRUD

### 관련 페이지
- `/admin/booking` - 예약 관리 페이지
- `/booking` - 예약 캘린더 페이지
- `/booking/form` - 예약 정보 입력 페이지
- `/try-a-massgoo` - 서비스 소개 페이지

---

## 🔄 업데이트 이력

- **2025-11-23**: 최종 계획 문서 작성
  - 완료된 작업 정리
  - 확인된 문제 및 수정 사항 기록
  - 예약 양식 개선 계획 추가
  - 데이터 마이그레이션 계획 추가

- **2025-11-24**: 개선 계획 업데이트
  - 완료된 작업 추가 (가상 예약, 최소 사전 예약 시간, 결정론적 셔플, 시간 정렬)
  - 가상 예약 저장 기능 재설계 계획 추가
  - 운영시간 캘린더 표시 계획 추가
  - 시간 순서 문제 해결 계획 추가
  - 우선순위별 구현 계획 정리

- **2025-11-24 (오후)**: 차단 시간 및 운영시간 표시 기능 구현
  - 차단 시간 저장/조회 문제 해결 (시간 형식 정규화, is_virtual 필터 개선)
  - 다음 예약 가능일 고정 문제 수정 (캐시 방지, 동적 갱신)
  - 운영시간 슬롯 시각적 구분 구현 (빈 슬롯, 운영시간 있음/없음 구분)
  - 차단 기능을 운영시간 기준으로 제한 (운영시간 없는 슬롯 차단 불가)

- **2025-11-26**: Wix 데이터 대규모 마이그레이션 구현 및 실행 완료 ✅
  - 전화번호 파싱 및 정규화 함수 개선 ✅ (82 분리, 01→010 변환, 하이픈 추가)
  - 동적 양식 필드 파싱 함수 구현 ✅ (양식 입력란 0-39 자동 매핑)
  - 클럽 정보 구조화 파싱 함수 구현 ✅ (브랜드, 로프트, 샤프트 분리)
  - 탄도, 구질 필드 파싱 함수 구현 ✅
  - 기존 데이터 백업 및 삭제 로직 추가 ✅
  - 마이그레이션 스크립트 개선 완료 ✅
  - **마이그레이션 실행 결과**:
    - CSV 파일: 1251줄 (약 1250건)
    - 마이그레이션 완료: 고객 681명, 예약 945건
    - 오류: 0건
    - 기존 데이터 백업 완료


### 진행 중/예정 항목
- [ ] 시간 순서 문제 최종 해결 (useMemo 적용)
- [ ] 가상 예약 저장 기능 재설계 (버튼 기반)
- [ ] 운영시간 캘린더 표시 (점선 스타일)
- [ ] 예약 정보 입력 페이지 로고 수정
- [ ] 운영시간 관리 UI 개선 (활성화된 장소 없을 때 처리)
- [ ] 예약 양식 개선 (단계적 몰입형 양식)
- [ ] 클럽 정보 구조화 (브랜드, 로프트, 샤프트 분리)
- [ ] 탄도, 구질 필드 추가
- [ ] 브랜드 자동완성 기능
- [ ] Wix 데이터 마이그레이션 스크립트
- [ ] 고객 프로필 자동 생성

---

## 📚 참고 자료

### 기존 문서
- `docs/phases/detailed-plans/phase-6-detailed-plan.md` - 초기 계획
- `docs/project_plan.md` - 프로젝트 전체 계획

### 관련 API
- `/api/bookings/settings` - 예약 설정 조회/수정
- `/api/bookings/available` - 예약 가능 시간 조회
- `/api/bookings/next-available` - 다음 예약 가능일 조회
- `/api/bookings/blocks` - 차단 시간 관리
- `/api/bookings/generate-virtual-blocks` - 가상 예약 생성 (예정)
- `/api/bookings` - 예약 CRUD

### 관련 페이지
- `/admin/booking` - 예약 관리 페이지
- `/booking` - 예약 캘린더 페이지
- `/booking/form` - 예약 정보 입력 페이지
- `/try-a-massgoo` - 서비스 소개 페이지

---

## 🔄 업데이트 이력

- **2025-11-23**: 최종 계획 문서 작성
  - 완료된 작업 정리
  - 확인된 문제 및 수정 사항 기록
  - 예약 양식 개선 계획 추가
  - 데이터 마이그레이션 계획 추가

- **2025-11-24**: 개선 계획 업데이트
  - 완료된 작업 추가 (가상 예약, 최소 사전 예약 시간, 결정론적 셔플, 시간 정렬)
  - 가상 예약 저장 기능 재설계 계획 추가
  - 운영시간 캘린더 표시 계획 추가
  - 시간 순서 문제 해결 계획 추가
  - 우선순위별 구현 계획 정리

- **2025-11-24 (오후)**: 차단 시간 및 운영시간 표시 기능 구현
  - 차단 시간 저장/조회 문제 해결 (시간 형식 정규화, is_virtual 필터 개선)
  - 다음 예약 가능일 고정 문제 수정 (캐시 방지, 동적 갱신)
  - 운영시간 슬롯 시각적 구분 구현 (빈 슬롯, 운영시간 있음/없음 구분)
  - 차단 기능을 운영시간 기준으로 제한 (운영시간 없는 슬롯 차단 불가)

- **2025-11-26**: Wix 데이터 대규모 마이그레이션 구현 및 실행 완료 ✅
  - 전화번호 파싱 및 정규화 함수 개선 ✅ (82 분리, 01→010 변환, 하이픈 추가)
  - 동적 양식 필드 파싱 함수 구현 ✅ (양식 입력란 0-39 자동 매핑)
  - 클럽 정보 구조화 파싱 함수 구현 ✅ (브랜드, 로프트, 샤프트 분리)
  - 탄도, 구질 필드 파싱 함수 구현 ✅
  - 기존 데이터 백업 및 삭제 로직 추가 ✅
  - 마이그레이션 스크립트 개선 완료 ✅
  - **마이그레이션 실행 결과**:
    - CSV 파일: 1251줄 (약 1250건)
    - 마이그레이션 완료: 고객 681명, 예약 945건
    - 오류: 0건
    - 기존 데이터 백업 완료


### 진행 중/예정 항목
- [ ] 시간 순서 문제 최종 해결 (useMemo 적용)
- [ ] 가상 예약 저장 기능 재설계 (버튼 기반)
- [ ] 운영시간 캘린더 표시 (점선 스타일)
- [ ] 예약 정보 입력 페이지 로고 수정
- [ ] 운영시간 관리 UI 개선 (활성화된 장소 없을 때 처리)
- [ ] 예약 양식 개선 (단계적 몰입형 양식)
- [ ] 클럽 정보 구조화 (브랜드, 로프트, 샤프트 분리)
- [ ] 탄도, 구질 필드 추가
- [ ] 브랜드 자동완성 기능
- [ ] Wix 데이터 마이그레이션 스크립트
- [ ] 고객 프로필 자동 생성

---

## 📚 참고 자료

### 기존 문서
- `docs/phases/detailed-plans/phase-6-detailed-plan.md` - 초기 계획
- `docs/project_plan.md` - 프로젝트 전체 계획

### 관련 API
- `/api/bookings/settings` - 예약 설정 조회/수정
- `/api/bookings/available` - 예약 가능 시간 조회
- `/api/bookings/next-available` - 다음 예약 가능일 조회
- `/api/bookings/blocks` - 차단 시간 관리
- `/api/bookings/generate-virtual-blocks` - 가상 예약 생성 (예정)
- `/api/bookings` - 예약 CRUD

### 관련 페이지
- `/admin/booking` - 예약 관리 페이지
- `/booking` - 예약 캘린더 페이지
- `/booking/form` - 예약 정보 입력 페이지
- `/try-a-massgoo` - 서비스 소개 페이지

---

## 🔄 업데이트 이력

- **2025-11-23**: 최종 계획 문서 작성
  - 완료된 작업 정리
  - 확인된 문제 및 수정 사항 기록
  - 예약 양식 개선 계획 추가
  - 데이터 마이그레이션 계획 추가

- **2025-11-24**: 개선 계획 업데이트
  - 완료된 작업 추가 (가상 예약, 최소 사전 예약 시간, 결정론적 셔플, 시간 정렬)
  - 가상 예약 저장 기능 재설계 계획 추가
  - 운영시간 캘린더 표시 계획 추가
  - 시간 순서 문제 해결 계획 추가
  - 우선순위별 구현 계획 정리

- **2025-11-24 (오후)**: 차단 시간 및 운영시간 표시 기능 구현
  - 차단 시간 저장/조회 문제 해결 (시간 형식 정규화, is_virtual 필터 개선)
  - 다음 예약 가능일 고정 문제 수정 (캐시 방지, 동적 갱신)
  - 운영시간 슬롯 시각적 구분 구현 (빈 슬롯, 운영시간 있음/없음 구분)
  - 차단 기능을 운영시간 기준으로 제한 (운영시간 없는 슬롯 차단 불가)

- **2025-11-26**: Wix 데이터 대규모 마이그레이션 구현 및 실행 완료 ✅
  - 전화번호 파싱 및 정규화 함수 개선 ✅ (82 분리, 01→010 변환, 하이픈 추가)
  - 동적 양식 필드 파싱 함수 구현 ✅ (양식 입력란 0-39 자동 매핑)
  - 클럽 정보 구조화 파싱 함수 구현 ✅ (브랜드, 로프트, 샤프트 분리)
  - 탄도, 구질 필드 파싱 함수 구현 ✅
  - 기존 데이터 백업 및 삭제 로직 추가 ✅
  - 마이그레이션 스크립트 개선 완료 ✅
  - **마이그레이션 실행 결과**:
    - CSV 파일: 1251줄 (약 1250건)
    - 마이그레이션 완료: 고객 681명, 예약 945건
    - 오류: 0건
    - 기존 데이터 백업 완료


### 진행 중/예정 항목
- [ ] 시간 순서 문제 최종 해결 (useMemo 적용)
- [ ] 가상 예약 저장 기능 재설계 (버튼 기반)
- [ ] 운영시간 캘린더 표시 (점선 스타일)
- [ ] 예약 정보 입력 페이지 로고 수정
- [ ] 운영시간 관리 UI 개선 (활성화된 장소 없을 때 처리)
- [ ] 예약 양식 개선 (단계적 몰입형 양식)
- [ ] 클럽 정보 구조화 (브랜드, 로프트, 샤프트 분리)
- [ ] 탄도, 구질 필드 추가
- [ ] 브랜드 자동완성 기능
- [ ] Wix 데이터 마이그레이션 스크립트
- [ ] 고객 프로필 자동 생성

---

## 📚 참고 자료

### 기존 문서
- `docs/phases/detailed-plans/phase-6-detailed-plan.md` - 초기 계획
- `docs/project_plan.md` - 프로젝트 전체 계획

### 관련 API
- `/api/bookings/settings` - 예약 설정 조회/수정
- `/api/bookings/available` - 예약 가능 시간 조회
- `/api/bookings/next-available` - 다음 예약 가능일 조회
- `/api/bookings/blocks` - 차단 시간 관리
- `/api/bookings/generate-virtual-blocks` - 가상 예약 생성 (예정)
- `/api/bookings` - 예약 CRUD

### 관련 페이지
- `/admin/booking` - 예약 관리 페이지
- `/booking` - 예약 캘린더 페이지
- `/booking/form` - 예약 정보 입력 페이지
- `/try-a-massgoo` - 서비스 소개 페이지

---

## 🔄 업데이트 이력

- **2025-11-23**: 최종 계획 문서 작성
  - 완료된 작업 정리
  - 확인된 문제 및 수정 사항 기록
  - 예약 양식 개선 계획 추가
  - 데이터 마이그레이션 계획 추가

- **2025-11-24**: 개선 계획 업데이트
  - 완료된 작업 추가 (가상 예약, 최소 사전 예약 시간, 결정론적 셔플, 시간 정렬)
  - 가상 예약 저장 기능 재설계 계획 추가
  - 운영시간 캘린더 표시 계획 추가
  - 시간 순서 문제 해결 계획 추가
  - 우선순위별 구현 계획 정리

- **2025-11-24 (오후)**: 차단 시간 및 운영시간 표시 기능 구현
  - 차단 시간 저장/조회 문제 해결 (시간 형식 정규화, is_virtual 필터 개선)
  - 다음 예약 가능일 고정 문제 수정 (캐시 방지, 동적 갱신)
  - 운영시간 슬롯 시각적 구분 구현 (빈 슬롯, 운영시간 있음/없음 구분)
  - 차단 기능을 운영시간 기준으로 제한 (운영시간 없는 슬롯 차단 불가)

- **2025-11-26**: Wix 데이터 대규모 마이그레이션 구현 및 실행 완료 ✅
  - 전화번호 파싱 및 정규화 함수 개선 ✅ (82 분리, 01→010 변환, 하이픈 추가)
  - 동적 양식 필드 파싱 함수 구현 ✅ (양식 입력란 0-39 자동 매핑)
  - 클럽 정보 구조화 파싱 함수 구현 ✅ (브랜드, 로프트, 샤프트 분리)
  - 탄도, 구질 필드 파싱 함수 구현 ✅
  - 기존 데이터 백업 및 삭제 로직 추가 ✅
  - 마이그레이션 스크립트 개선 완료 ✅
  - **마이그레이션 실행 결과**:
    - CSV 파일: 1251줄 (약 1250건)
    - 마이그레이션 완료: 고객 681명, 예약 945건
    - 오류: 0건
    - 기존 데이터 백업 완료


### 진행 중/예정 항목
- [ ] 시간 순서 문제 최종 해결 (useMemo 적용)
- [ ] 가상 예약 저장 기능 재설계 (버튼 기반)
- [ ] 운영시간 캘린더 표시 (점선 스타일)
- [ ] 예약 정보 입력 페이지 로고 수정
- [ ] 운영시간 관리 UI 개선 (활성화된 장소 없을 때 처리)
- [ ] 예약 양식 개선 (단계적 몰입형 양식)
- [ ] 클럽 정보 구조화 (브랜드, 로프트, 샤프트 분리)
- [ ] 탄도, 구질 필드 추가
- [ ] 브랜드 자동완성 기능
- [ ] Wix 데이터 마이그레이션 스크립트
- [ ] 고객 프로필 자동 생성

---

## 📚 참고 자료

### 기존 문서
- `docs/phases/detailed-plans/phase-6-detailed-plan.md` - 초기 계획
- `docs/project_plan.md` - 프로젝트 전체 계획

### 관련 API
- `/api/bookings/settings` - 예약 설정 조회/수정
- `/api/bookings/available` - 예약 가능 시간 조회
- `/api/bookings/next-available` - 다음 예약 가능일 조회
- `/api/bookings/blocks` - 차단 시간 관리
- `/api/bookings/generate-virtual-blocks` - 가상 예약 생성 (예정)
- `/api/bookings` - 예약 CRUD

### 관련 페이지
- `/admin/booking` - 예약 관리 페이지
- `/booking` - 예약 캘린더 페이지
- `/booking/form` - 예약 정보 입력 페이지
- `/try-a-massgoo` - 서비스 소개 페이지

---

## 🔄 업데이트 이력

- **2025-11-23**: 최종 계획 문서 작성
  - 완료된 작업 정리
  - 확인된 문제 및 수정 사항 기록
  - 예약 양식 개선 계획 추가
  - 데이터 마이그레이션 계획 추가

- **2025-11-24**: 개선 계획 업데이트
  - 완료된 작업 추가 (가상 예약, 최소 사전 예약 시간, 결정론적 셔플, 시간 정렬)
  - 가상 예약 저장 기능 재설계 계획 추가
  - 운영시간 캘린더 표시 계획 추가
  - 시간 순서 문제 해결 계획 추가
  - 우선순위별 구현 계획 정리

- **2025-11-24 (오후)**: 차단 시간 및 운영시간 표시 기능 구현
  - 차단 시간 저장/조회 문제 해결 (시간 형식 정규화, is_virtual 필터 개선)
  - 다음 예약 가능일 고정 문제 수정 (캐시 방지, 동적 갱신)
  - 운영시간 슬롯 시각적 구분 구현 (빈 슬롯, 운영시간 있음/없음 구분)
  - 차단 기능을 운영시간 기준으로 제한 (운영시간 없는 슬롯 차단 불가)

- **2025-11-26**: Wix 데이터 대규모 마이그레이션 구현 및 실행 완료 ✅
  - 전화번호 파싱 및 정규화 함수 개선 ✅ (82 분리, 01→010 변환, 하이픈 추가)
  - 동적 양식 필드 파싱 함수 구현 ✅ (양식 입력란 0-39 자동 매핑)
  - 클럽 정보 구조화 파싱 함수 구현 ✅ (브랜드, 로프트, 샤프트 분리)
  - 탄도, 구질 필드 파싱 함수 구현 ✅
  - 기존 데이터 백업 및 삭제 로직 추가 ✅
  - 마이그레이션 스크립트 개선 완료 ✅
  - **마이그레이션 실행 결과**:
    - CSV 파일: 1251줄 (약 1250건)
    - 마이그레이션 완료: 고객 681명, 예약 945건
    - 오류: 0건
    - 기존 데이터 백업 완료

