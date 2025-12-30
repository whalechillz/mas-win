# 카카오 채널 설문 참여 메시지 자동화 스크립트

## 🚀 빠른 시작

### 완전 자동 통합 스크립트 (권장) ⭐

모든 단계를 자동으로 수행하는 통합 스크립트입니다.

```bash
# 1. 환경 변수 설정 (.env.local)
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_admin_password

# 2. 스크립트 실행
node scripts/prepare-kakao-survey-message-complete.js
```

**자동 수행 작업:**
1. ✅ 관리자 로그인
2. ✅ AI 이미지 생성 (젊은 톤, 하이테크)
3. ✅ 카카오 채널 에디터 접속
4. ✅ 메시지 내용 입력
5. ✅ 이미지 첨부
6. ✅ 수신자 선택 (SMS 수신자 제외, 설문 참여자 제외)
7. ✅ 중복 수신 검증
8. ✅ 초안 저장

---

## 📋 스크립트 목록

### 1. `prepare-kakao-survey-message-complete.js` ⭐ (권장)

**완전 자동 통합 스크립트**

- 모든 단계를 자동으로 수행
- AI 이미지 생성부터 메시지 저장까지
- 실패한 단계는 건너뛰고 계속 진행
- 브라우저를 열어두어 수동 확인 가능

**사용법:**
```bash
node scripts/prepare-kakao-survey-message-complete.js
```

### 2. `create-kakao-survey-message.js`

**카카오 비즈니스 파트너센터 자동화 스크립트**

- 카카오 비즈니스 파트너센터에 직접 로그인
- 메시지 작성 및 예약 발송 설정
- 실제 카카오 API를 통한 발송 (구현 필요)

**사용법:**
```bash
# 환경 변수 설정
KAKAO_EMAIL=taksoo.kim@gmail.com
KAKAO_PASSWORD=your_password

# 스크립트 실행
node scripts/create-kakao-survey-message.js
```

---

## ⚙️ 환경 변수 설정

`.env.local` 파일에 다음을 추가:

```bash
# 관리자 로그인 (완전 자동 통합 스크립트용)
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_PASSWORD=your_admin_password

# 카카오 비즈니스 파트너센터 (선택사항)
KAKAO_EMAIL=taksoo.kim@gmail.com
KAKAO_PASSWORD=your_kakao_password

# 기본 URL
NEXT_PUBLIC_BASE_URL=https://win.masgolf.co.kr
```

---

## 🔧 스크립트 커스터마이징

### 메시지 내용 변경

`prepare-kakao-survey-message-complete.js` 파일에서 `MESSAGE_CONTENT` 변수를 수정:

```javascript
const MESSAGE_CONTENT = `[MASSGOO X MUZIIK] 설문 참여하고 특별 선물 받자! 🎁

안녕하세요! 마쓰구골프입니다.
...
`;
```

### AI 이미지 프롬프트 변경

`AI_IMAGE_PROMPT` 변수를 수정:

```javascript
const AI_IMAGE_PROMPT = `젊은 한국 골퍼(30-50대)가 현대적인 골프 스튜디오에서...`;
```

### 예약 시간 변경

`SCHEDULE_DATE`, `SCHEDULE_HOUR`, `SCHEDULE_MINUTE` 변수를 수정:

```javascript
const SCHEDULE_DATE = '2025-12-30';
const SCHEDULE_HOUR = 10;
const SCHEDULE_MINUTE = 0;
```

---

## 🐛 문제 해결

### 이미지 생성 실패

- AI 이미지 생성이 실패하면 수동으로 생성하고 갤러리에서 선택
- 또는 기존 갤러리 이미지를 사용

### 수신자 선택 실패

- 수동으로 카카오 채널 에디터에서 수신자 선택
- 수신자 목록 새로고침 버튼 클릭

### 로그인 실패

- 환경 변수 확인
- 브라우저에서 수동 로그인 후 스크립트 재실행

---

## 📝 로그 확인

스크립트 실행 시 각 단계마다 상세한 로그가 출력됩니다:

```
🚀 카카오 채널 설문 참여 메시지 완전 자동 준비 시작...
📅 예약 날짜: 2025-12-30
⏰ 예약 시간: 10:00

🔐 관리자 로그인 중...
   ✅ 로그인 완료

🎨 AI 이미지 생성 중...
   1️⃣ AI 이미지 생성 페이지로 이동...
   ✅ 페이지 로드 완료
   ...
```

---

## ✅ 체크리스트

스크립트 실행 후 확인:

- [ ] AI 이미지 생성 완료 확인
- [ ] 메시지 내용 확인
- [ ] 이미지 첨부 확인
- [ ] 수신자 수 확인 (SMS 수신자 제외 확인)
- [ ] 중복 수신 검증 완료
- [ ] 초안 저장 완료
- [ ] 최종 발송 전 검토

