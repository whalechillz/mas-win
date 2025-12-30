# 카카오 채널 설문 참여 메시지 전송 프로젝트

## 📋 프로젝트 개요

**목적**: SMS 수신 고객 중 카카오톡 친구에게 중복 없이 설문 참여 메시지 발송  
**일시**: 2025년 12월 30일 10:00-11:00  
**대상**: SMS 수신 고객 중 카카오톡 친구 (SMS 수신자 및 설문 참여자 제외)

---

## ✅ 완료된 작업

### Phase 1: 중복 수신 방지 로직 구현 ✅

**생성된 파일:**
- `pages/api/kakao/recipients.ts` - 카카오 친구 목록 조회 및 필터링 API
- `pages/api/kakao/validate-recipients.ts` - 수신자 검증 API

**기능:**
- SMS 수신 고객 목록 조회 (메시지 ID 232-273, 227-231)
- 설문 참여 고객 제외
- 수신거부 고객 제외
- 통계 정보 제공

### Phase 2: AI 이미지 생성 준비 ✅

**이미지 컨셉:**
- 젊은 골퍼 (30-50대)
- 하이테크 톤 (쿨 블루, 현대적)
- 인도어 드라이버 연습장 또는 피팅 스튜디오
- 모자/굿즈를 자연스럽게 착용한 모습

**AI 이미지 생성 설정:**
- 브랜딩 톤: 하이테크 중심 혁신형 (high_tech_innovative)
- 장소: 인도어 드라이버 연습장 / 피팅 스튜디오
- 프롬프트: 젊은 한국 골퍼가 현대적인 골프 스튜디오에서 MASSGOO 드라이버를 테스트하는 장면

### Phase 3: 카카오 채널 에디터 고도화 ✅

**생성된 파일:**
- `components/admin/KakaoRecipientSelector.tsx` - 수신자 선택 컴포넌트
- `pages/api/kakao/send.ts` - 카카오 메시지 발송 API

**개선 사항:**
1. 고객 필터링 UI
   - SMS 수신자 제외 옵션
   - 설문 참여자 제외 옵션
   - 실시간 통계 표시

2. 중복 수신 방지 검증
   - 수신자 검증 버튼
   - 경고 메시지 표시
   - 유효/무효 수신자 구분

3. AI 이미지 생성 바로가기
   - BaseChannelEditor에 AI 이미지 생성 버튼 추가
   - 카카오 채널 전용 안내 메시지

4. 수신자 수 표시
   - 발송 가능한 수신자 수 실시간 표시
   - 제외된 고객 수 표시

**수정된 파일:**
- `pages/admin/kakao.tsx` - 수신자 선택 컴포넌트 통합
- `components/shared/BaseChannelEditor.tsx` - AI 이미지 생성 바로가기 추가

### Phase 4: Playwright 자동화 스크립트 ✅

**생성된 파일:**
- `scripts/create-kakao-survey-message.js` - 카카오 비즈니스 파트너센터 자동화 스크립트
- `scripts/prepare-kakao-survey-message-complete.js` - **완전 자동 통합 스크립트** ⭐

**완전 자동 통합 스크립트 기능:**
1. 관리자 로그인
2. AI 이미지 생성 (젊은 톤, 하이테크)
   - 브랜딩 톤 자동 선택
   - 장소 자동 선택
   - 프롬프트 자동 입력
   - 이미지 생성 및 완료 대기
3. 카카오 채널 에디터 접속
4. 메시지 내용 자동 입력
5. 이미지 자동 첨부 (생성된 이미지)
6. 수신자 선택 (SMS 수신자 제외, 설문 참여자 제외)
7. 중복 수신 검증
8. 초안 저장

**카카오 비즈니스 파트너센터 스크립트 기능:**
- 카카오 비즈니스 파트너센터 자동 로그인
- 메시지 작성 페이지 이동
- 메시지 내용 자동 입력
- 이미지 업로드 (URL 또는 파일)
- 수신자 선택 (UI 구조에 맞게 수정 필요)
- 예약 발송 설정 (12월 30일 10:00-11:00)
- 초안 저장

---

## 📝 메시지 내용 (최종)

```
[MASSGOO X MUZIIK] 설문 참여하고 특별 선물 받자! 🎁

안녕하세요! 마쓰구골프입니다.

선호하는 샤프트 설문에 참여해주시면
다음 특별 선물을 드립니다! ✨

• 스타일리시한 버킷햇
• 콜라보 골프모자
• 여권 파우치
• 티셔츠

참여하기: https://www.masgolf.co.kr/survey

전화 상담만 해도 특별 선물!
080-028-8888 (무료)

마쓰구골프
```

---

## 🚀 사용 방법

### 1. AI 이미지 생성

1. `/admin/ai-image-generator` 접속
2. 설정:
   - 브랜딩 톤: 하이테크 중심 혁신형
   - 장소: 인도어 드라이버 연습장 또는 피팅 스튜디오
   - 프롬프트: "젊은 한국 골퍼(30-50대)가 현대적인 골프 스튜디오에서 MASSGOO 드라이버를 테스트하는 장면. 스타일리시한 골프 모자를 착용하고, 하이테크 장비와 함께 프리미엄한 분위기. 쿨 블루 톤, LED 조명, 현대적 인테리어"
3. 이미지 생성 및 갤러리 저장
4. 이미지 URL 확인

### 2. 카카오 채널 에디터 사용

1. `/admin/kakao` 접속
2. 메시지 내용 입력 (위 메시지 내용 복사)
3. 수신자 선택:
   - SMS 수신자 제외 체크
   - 설문 참여자 제외 체크
   - 수신자 목록 새로고침
   - 중복 수신 검증 클릭
4. 이미지 선택:
   - "갤러리에서 선택" 또는 "AI 이미지 생성" 버튼 클릭
5. 초안 저장 또는 발송

### 3. Playwright 완전 자동 통합 스크립트 실행 ⭐ (권장)

```bash
# 환경 변수 설정 (.env.local)
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_admin_password

# 완전 자동 통합 스크립트 실행 (모든 단계 자동화)
node scripts/prepare-kakao-survey-message-complete.js
```

**이 스크립트가 자동으로 수행하는 작업:**
1. ✅ 관리자 로그인
2. ✅ AI 이미지 생성 (젊은 톤, 하이테크)
3. ✅ 카카오 채널 에디터 접속
4. ✅ 메시지 내용 입력
5. ✅ 이미지 첨부
6. ✅ 수신자 선택 및 필터링
7. ✅ 중복 수신 검증
8. ✅ 초안 저장

**주의사항:**
- 브라우저가 자동으로 열리며 진행 상황을 확인할 수 있습니다
- 각 단계마다 로그가 출력됩니다
- 실패한 단계는 건너뛰고 계속 진행됩니다
- 최종적으로 브라우저를 열어두어 수동 확인이 가능합니다

### 4. 카카오 비즈니스 파트너센터 자동화 (선택사항)

```bash
# 환경 변수 설정 (.env.local)
KAKAO_EMAIL=taksoo.kim@gmail.com
KAKAO_PASSWORD=your_password

# 카카오 비즈니스 파트너센터 스크립트 실행
node scripts/create-kakao-survey-message.js
```

**주의사항:**
- 카카오 비즈니스 파트너센터의 실제 UI 구조에 맞게 선택자를 수정해야 할 수 있습니다
- 수신자 선택 부분은 실제 UI에 맞게 수정이 필요합니다
- 이미지 업로드는 URL 또는 파일 경로를 사용할 수 있습니다

---

## 📊 API 엔드포인트

### GET /api/kakao/recipients
카카오 친구 목록 조회 및 필터링

**Query Parameters:**
- `excludeSmsRecipients`: true/false (기본값: true)
- `excludeSurveyParticipants`: true/false (기본값: true)
- `smsMessageIds`: 콤마로 구분된 메시지 ID (예: "232,273,227,231")

**Response:**
```json
{
  "success": true,
  "data": {
    "recipients": [...],
    "stats": {
      "totalCustomers": 2977,
      "smsRecipients": 500,
      "surveyParticipants": 59,
      "eligibleRecipients": 2418,
      "excludedCount": 559
    }
  }
}
```

### POST /api/kakao/validate-recipients
수신자 검증 (중복 수신 방지)

**Body:**
```json
{
  "phoneNumbers": ["01012345678", "01087654321"],
  "smsMessageIds": [232, 273, 227, 231]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "valid": 2,
    "invalid": 0,
    "warnings": 1,
    "results": [...],
    "summary": {
      "validRecipients": [...],
      "invalidRecipients": [...],
      "warningRecipients": [...]
    }
  }
}
```

### POST /api/kakao/send
카카오 메시지 발송

**Body:**
```json
{
  "message": "메시지 내용",
  "imageUrl": "이미지 URL",
  "recipients": ["01012345678"],
  "scheduleDate": "2025-12-30T10:00:00",
  "messageType": "FRIENDTALK",
  "title": "메시지 제목"
}
```

---

## 🔍 체크리스트

### 발송 전 확인
- [ ] AI 이미지 생성 완료
- [ ] 이미지 갤러리 저장 완료
- [ ] 이미지 URL 확인
- [ ] 메시지 내용 최종 확인
- [ ] 수신자 목록 확인 (SMS 수신자 제외)
- [ ] 설문 참여자 제외 확인
- [ ] 중복 수신 검증 완료
- [ ] 예약 시간 설정 확인 (12월 30일 10:00-11:00)
- [ ] 테스트 발송 (스탭진 2명) 완료

### 발송 후 확인
- [ ] 발송 완료 확인
- [ ] 오픈율 모니터링
- [ ] 설문 참여율 추적
- [ ] 고객 문의 대응 준비

---

## 📅 생성 일시

2025년 12월 29일

---

## 🔧 향후 개선 사항

1. **카카오 비즈니스 API 연동**
   - 실제 카카오 API를 통한 자동 발송
   - 발송 결과 실시간 확인

2. **이미지 자동 생성**
   - AI 이미지 생성 API 연동
   - 이미지 자동 갤러리 저장

3. **수신자 선택 UI 개선**
   - 친구 그룹 선택 기능
   - 개별 수신자 선택 기능
   - 수신자 목록 미리보기

4. **발송 스케줄링 개선**
   - 분할 발송 자동화
   - 발송 시간 최적화

