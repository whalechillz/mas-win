# 설문 조사 관리 - 감사 메시지 발송 오류 분석

## 🔴 오류 현상
- 감사 메시지 발송 시 "No valid session" 오류 발생
- API는 200 OK를 반환하지만 실제 발송은 실패 (0건 성공, 1건 실패)

## ✅ 오류 재현 완료
Playwright 테스트를 통해 오류를 재현했습니다:
- 메시지 미리보기 API (GET): ✅ 성공
- 메시지 발송 API (POST): ❌ "No valid session" 오류 발생

## 🔍 원인 분석

### 1. 환경 변수 확인
- ✅ `.env.local` 파일에 환경 변수 설정됨:
  - `SOLAPI_API_KEY=NCSEBH9N1KDDCEKF`
  - `SOLAPI_API_SECRET=6ETD0PWTTCUS8S4JC5OL5AFU0JQKDHM2`
  - `SOLAPI_SENDER=031-215-0013`

### 2. Solapi API 직접 호출 테스트
- ✅ Solapi API 직접 호출: **성공**
- ✅ 환경 변수는 올바르게 설정되어 있음
- ✅ Solapi API 인증은 정상 작동

### 3. 문제 발생 지점
오류는 다음 흐름에서 발생합니다:
```
1. 설문 조사 관리 페이지에서 "감사 메시지" 버튼 클릭
2. `/api/admin/surveys/send-messages` (POST) 호출
3. 내부에서 `/api/channels/sms/save` 호출 (메시지 저장) ✅ 성공
4. 내부에서 `/api/channels/sms/send` 호출 (메시지 발송)
5. `/api/channels/sms/send`에서 Solapi API 호출
6. ❌ Solapi API가 "No valid session" 오류 반환
```

### 4. 가능한 원인

#### 원인 1: 내부 API 호출 시 환경 변수 미전달
- `send-messages.ts`가 내부 API를 HTTP로 호출할 때 환경 변수가 전달되지 않을 수 있음
- 하지만 같은 프로세스이므로 환경 변수는 동일하게 접근 가능해야 함

#### 원인 2: Solapi API 호출 시점의 문제
- `/api/channels/sms/send`에서 Solapi API를 호출할 때 인증 헤더가 올바르게 생성되지 않았을 수 있음
- 또는 Solapi API 서버 측에서 세션 문제 발생

#### 원인 3: 메시지 타입/형식 문제
- MMS로 발송할 때 특정 조건에서 "No valid session" 오류가 발생할 수 있음
- SMS로는 성공하지만 MMS로는 실패할 수 있음

## 📝 다음 단계

1. **서버 로그 확인**
   - 서버 콘솔에서 다음 로그 확인:
     - `[send.js] 환경 변수 검증 시작`
     - `[send.js] Solapi 환경 변수 확인`
     - `[send.js] Solapi API 호출 시작`
     - `[send.js] Solapi API 응답 상태`
     - `❌ Solapi API 오류`

2. **상세 로깅 추가 완료**
   - 환경 변수 검증 로그 추가
   - Solapi API 호출 전/후 로그 추가
   - 오류 발생 시 상세 정보 출력

3. **추가 확인 사항**
   - MMS vs SMS 발송 차이 확인
   - Solapi API 응답의 `errorMessage` 필드 확인
   - 인증 헤더 생성 과정 확인

## 🧪 테스트 스크립트
- `e2e-test/test-survey-api-direct.js`: API 직접 호출 테스트
- `e2e-test/test-solapi-direct.js`: Solapi API 직접 호출 테스트

## 📅 분석 일자
2026-01-12
