# 카카오 채널 관리 최종 계획 및 구현 현황

## 📋 완료 일자
2026-01-01

## ✅ Phase 1 완료 사항

### 1. 핵심 기능 완성
- ✅ 신규 글 초안 저장 오류 수정
- ✅ 전화번호 → UUID 변환 시스템
- ✅ 알림톡 발송 완성 (Solapi 연동)
- ✅ 수신자 그룹 관리 시스템

### 2. SMS/MMS 관리 메뉴 통합
- ✅ SMS 페이지에 카카오톡 대행 발송 옵션 추가
- ✅ 친구 없으면 SMS 대체 발송 로직
- ✅ 수신자 그룹 선택 UI

### 3. 테스트 그룹 생성
- ✅ 그룹명: `MASLABS`
- ✅ 테스트 번호: `010-6669-9000`

---

## 🚀 배포 전 체크리스트

### 환경 변수 확인 (Vercel)
- [ ] `KAKAO_ADMIN_KEY` - 카카오 친구 목록 동기화용
- [ ] `KAKAO_PLUS_FRIEND_ID` - 카카오 플러스친구 ID
- [ ] `SOLAPI_API_KEY` - 알림톡 발송용
- [ ] `SOLAPI_API_SECRET` - 알림톡 발송용
- [ ] `SOLAPI_SENDER` - 발신번호

### 데이터베이스 확인
- [x] `kakao_friend_mappings` 테이블 생성 완료
- [x] `kakao_recipient_groups` 테이블 생성 완료
- [x] `channel_sms` 테이블 확장 (카카오 발송 정보 컬럼 추가)

### 빌드 테스트
- [x] 로컬 빌드 성공 확인

---

## 📊 구현된 기능 상세

### 1. SMS 페이지 카카오톡 대행 발송

**위치**: `/admin/sms`

**기능**:
- 카카오톡 대행 발송 옵션 체크박스
- 발송 방식 선택 (친구톡/알림톡)
- 친구 추가 안 된 번호 처리 옵션 (SMS 대체/건너뛰기)
- 수신자 그룹 선택
- 알림톡 템플릿 ID 입력

**동작 방식**:
1. 사용자가 "카카오톡 대행 발송" 체크
2. 발송 시 전화번호를 UUID로 변환
3. 친구인 번호 → 카카오톡 발송
4. 친구가 아닌 번호 → SMS 대체 발송 (옵션에 따라)

**API**: `/api/channels/sms/send-with-kakao`

---

### 2. 수신자 그룹 관리

**위치**: `/admin/kakao-list` (향후 UI 추가 필요)

**API**: `/api/kakao/recipient-groups`

**기능**:
- 그룹 생성/수정/삭제
- 전화번호 또는 UUID로 그룹 생성
- 그룹별 수신자 수 표시

**테스트 그룹**:
- 그룹명: `MASLABS`
- 수신자: `010-6669-9000`

---

### 3. 친구 목록 동기화

**API**: `/api/kakao/friends?sync=true`

**동작 위치**: 
- 로컬: `http://localhost:3000/api/kakao/friends?sync=true`
- 배포: `https://your-domain.vercel.app/api/kakao/friends?sync=true`

**주의사항**:
- `KAKAO_ADMIN_KEY` 환경 변수 필요
- 카카오 비즈니스 채널 연동 필요
- 주기적 동기화 권장 (1일 1회 또는 주 1회)

---

## 🎨 UI 계획 (향후 구현)

### 1. 통합 발송 페이지 (`/admin/kakao-send`)

**구조**:
```
[1단계] 발송 방식 선택
  ○ 시스템에서 직접 발송
  ○ 카카오 파트너센터에서 발송

[2단계] 메시지 선택
  [기존 메시지 선택] [+ 새 메시지 작성]

[3단계] 수신자 선택
  ○ 수신자 그룹 선택
  ○ 개별 번호 입력
  ○ 고객 목록에서 선택

[4단계] 발송 설정
  친구 추가 안 된 번호: [SMS 대체 / 건너뛰기]
  예약 발송: [즉시 / 예약]

[5단계] 미리보기
  [카카오톡 미리보기]
  [발송 예상 비용]
  [발송 대상 수]

[발송하기] [초안 저장]
```

---

### 2. 카카오 파트너센터 연동 UI

**위치**: `/admin/kakao-list` 또는 `/admin/kakao-send`

**기능**:
- 메시지 ID로 동기화
- CSV/JSON 일괄 동기화
- 파트너센터에서 직접 발송 후 동기화
- 발송 결과 자동 동기화

---

### 3. 발송 결과 통합 대시보드

**위치**: `/admin/kakao-list` 또는 새 페이지

**표시 정보**:
- 발송 방식별 통계 (친구톡/알림톡/SMS)
- 시간대별 발송 통계
- 성공률/실패률
- 수신자별 발송 상태
- 실패 사유 분석

---

## 📝 데이터베이스 스키마

### 확장된 컬럼

**`channel_sms` 테이블**:
```sql
ALTER TABLE channel_sms 
ADD COLUMN IF NOT EXISTS kakao_send_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS kakao_message_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS kakao_fallback_to_sms BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS kakao_recipient_group_id INTEGER REFERENCES kakao_recipient_groups(id);
```

**`kakao_friend_mappings` 테이블**:
- `uuid` (PK) - 카카오 친구 UUID
- `phone` - 전화번호
- `nickname` - 친구 닉네임
- `thumbnail_image` - 프로필 이미지
- `synced_at` - 동기화 시간

**`kakao_recipient_groups` 테이블**:
- `id` (PK) - 그룹 ID
- `name` - 그룹명
- `description` - 설명
- `recipient_uuids` (JSONB) - 수신자 UUID 배열
- `recipient_count` - 수신자 수
- `is_active` - 활성 여부

---

## 🔄 발송 플로우

### SMS 발송 시 카카오톡 대행

```
사용자 입력
    ↓
카카오톡 대행 발송 체크
    ↓
전화번호 → UUID 변환
    ├─→ 친구인 번호 → 카카오톡 발송
    │   ├─→ 친구톡 (카카오 API)
    │   └─→ 알림톡 (Solapi)
    │
    └─→ 친구가 아닌 번호
        ├─→ SMS 대체 발송 (옵션)
        └─→ 발송 건너뛰기 (옵션)
```

---

## 🎯 다음 단계 (Phase 2)

### 우선순위 높음
1. **통합 발송 페이지** (`/admin/kakao-send`)
   - 모든 발송 옵션을 한 곳에서 관리
   - 발송 방식 선택 UI
   - 수신자 선택 UI 개선

2. **카카오 파트너센터 연동 UI**
   - 메시지 동기화 UI
   - 발송 결과 동기화

3. **발송 결과 대시보드**
   - 통계 및 리포트
   - 실패 사유 분석

### 우선순위 중간
4. **예약 발송 시스템**
   - 특정 날짜/시간 자동 발송
   - Cron Job 연동

5. **메시지 템플릿 관리**
   - 자주 사용하는 메시지 저장
   - 템플릿 변수 지원

---

## 📌 사용 가이드

### 친구 목록 동기화
```bash
# 로컬
curl "http://localhost:3000/api/kakao/friends?sync=true"

# 배포 환경
curl "https://your-domain.vercel.app/api/kakao/friends?sync=true"
```

### 테스트 그룹 사용
1. SMS 페이지 접속
2. "카카오톡 대행 발송" 체크
3. 수신자 그룹에서 "MASLABS" 선택
4. 발송

### 친구톡 발송
1. SMS 페이지에서 메시지 작성
2. "카카오톡 대행 발송" 체크
3. 발송 방식: "친구톡" 선택
4. 수신자 입력 또는 그룹 선택
5. 발송

### 알림톡 발송
1. SMS 페이지에서 메시지 작성
2. "카카오톡 대행 발송" 체크
3. 발송 방식: "알림톡" 선택
4. 템플릿 ID 입력 (Solapi에서 발급)
5. 수신자 입력 또는 그룹 선택
6. 발송

---

## ✅ 배포 준비 완료

- [x] 빌드 테스트 통과
- [x] 데이터베이스 스키마 확장 완료
- [x] API 구현 완료
- [x] UI 컴포넌트 구현 완료
- [ ] 환경 변수 확인 (Vercel)
- [ ] 배포 후 테스트

---

## 🔧 문제 해결

### 친구 목록 동기화 실패
- `KAKAO_ADMIN_KEY` 확인
- 카카오 비즈니스 채널 연동 확인
- API 권한 확인

### 카카오톡 발송 실패
- 친구 목록 동기화 실행
- 전화번호 형식 확인
- UUID 변환 확인

### 알림톡 발송 실패
- 템플릿 ID 확인
- Solapi 대시보드에서 템플릿 상태 확인
- `SOLAPI_API_KEY`, `SOLAPI_API_SECRET` 확인





