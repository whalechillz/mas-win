# 🚀 즉시 작동하는 AI 멀티채널 시스템 설정

## 1. 빠른 설치 (5분)

```bash
# 1. 필요한 패키지 설치
npm install @anthropic-ai/sdk openai

# 2. 작동하는 API 파일 복사
cp pages/api/generate-multichannel-content-working.ts pages/api/generate-multichannel-content.ts

# 3. 환경 변수 설정 (.env.local)
ANTHROPIC_API_KEY=sk-ant-api03-V6ZvAH188IBaM1r04meYZ0hsi-R0u3GRyQuefIMPP1AdwdL5gbFIQZ7b-T80mj2foAuoKN5LjvnMHNgIwrUyUA-L_uURAAA
```

## 2. 바로 사용하기

### AI OFF 모드 (무료)
- 이미 작동 중
- 템플릿 기반 콘텐츠 생성
- 채널 선택 가능

### AI ON 모드 (Claude 연결)
- API 키 설정하면 즉시 작동
- 고품질 콘텐츠 자동 생성
- 실제 비용 발생 (사용량 기준)

## 3. 실제 작동 흐름

```
1. AI 토글 ON
2. 플랜 선택 (베이직/스탠다드/프리미엄)
3. 채널 선택 (블로그, 카카오톡 등)
4. "멀티채널 생성" 클릭
   ↓
5. Claude API 호출
6. 채널별 맞춤 콘텐츠 생성
7. DB에 자동 저장
8. 관리 화면에서 확인/편집
```

## 4. 비용 관리

### 예상 비용 (Claude Sonnet 3.5)
- 블로그 포스트 1개: ~$0.05
- 카카오톡 메시지 1개: ~$0.01
- 월 100개 콘텐츠: ~$3-5

### 비용 절약 팁
```javascript
// .env.local에 월 한도 설정
MONTHLY_AI_BUDGET=50  // $50 한도
AI_USAGE_ALERT=40    // $40 도달시 알림
```

## 5. 즉시 테스트

```bash
# 1. 개발 서버 실행
npm run dev

# 2. 브라우저에서 열기
http://localhost:3000/admin

# 3. 테스트
- AI ON
- 스탠다드 플랜 선택
- 블로그만 체크
- "멀티채널 생성" 클릭
```

## 6. 문제 해결

### API 키 없이 테스트
- 시뮬레이션 모드 자동 작동
- 더미 데이터로 UI/UX 확인
- 실제 비용 발생 없음

### 실제 사용시
- API 키 입력 → 실제 AI 생성
- 콘텐츠 품질 즉시 확인
- 필요시 수동 편집

## 7. 커스터마이징

### 프롬프트 수정
```javascript
// pages/api/generate-multichannel-content.ts
const prompts = {
  blog: `당신만의 프롬프트로 변경`,
  kakao: `카카오톡 스타일로 변경`
}
```

### 담당자 변경
```javascript
const assignees = {
  blog: '본인이름',
  kakao: '본인이름'
}
```

## 🎯 핵심: 바로 쓸 수 있는 완성품

복잡한 설정 없이:
1. API 키만 넣으면 작동
2. 실패시 자동으로 템플릿 사용
3. 비용 발생전 시뮬레이션 가능

"개발자가 아니어도 5분만에 시작!"
