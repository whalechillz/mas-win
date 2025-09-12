# Google Ads 계정 정지 해결 가이드

## 🔍 현재 상황 분석

### 계정 정보
- **계정**: taksoo.kim@gmail.com
- **Developer Token**: SuzbNF-IwuyiXz040NdIIQ
- **상태**: "1개의 계정이 정지됨" 경고 표시
- **액세스 수준**: "일반 액세스" (Standard Access 승인됨)

## 🚫 계정 정지 원인 분석

### 1. 일반적인 정지 원인
- **정책 위반**: Google Ads 정책 위반
- **결제 문제**: 결제 수단 문제 또는 미결제
- **계정 보안**: 의심스러운 활동 감지
- **API 남용**: API 사용량 초과 또는 부적절한 사용
- **신원 확인**: 계정 소유자 신원 확인 필요

### 2. API 관련 정지 원인
- **Developer Token 문제**: 토큰 권한 또는 만료
- **API 사용량 초과**: 일일/월간 API 호출 한도 초과
- **부적절한 API 사용**: 정책에 위반되는 API 사용
- **계정 권한**: API 접근 권한 부족

## 🛠️ 해결 방법

### 1단계: 계정 상태 확인
1. **Google Ads 계정 페이지 접속**
   - https://ads.google.com/aw/overview
   - 계정 상태 및 경고 메시지 확인

2. **정지 사유 확인**
   - 계정 정지 알림 메일 확인
   - Google Ads 계정 내 알림 섹션 확인
   - 정책 위반 내역 확인

### 2단계: API Center 상태 확인
1. **Google Ads API Center 접속**
   - https://ads.google.com/aw/apicenter
   - Developer Token 상태 확인
   - 액세스 수준 확인

2. **API 사용량 확인**
   - 일일/월간 API 호출 현황
   - 오류율 및 성공률 확인
   - API 사용 패턴 분석

### 3단계: 문제 해결

#### A. 정책 위반인 경우
1. **정책 위반 내용 확인**
   - Google Ads 정책 센터 참조
   - 위반된 정책 구체적 내용 파악

2. **정책 위반 수정**
   - 위반 내용 제거 또는 수정
   - 계정 설정 정책 준수 확인

3. **정책 위반 해제 요청**
   - Google Ads 지원팀에 정책 위반 해제 요청
   - 수정 완료 증명 자료 제출

#### B. 결제 문제인 경우
1. **결제 수단 확인**
   - 결제 수단 유효성 확인
   - 결제 수단 업데이트

2. **미결제 금액 확인**
   - 미결제 금액 확인 및 결제
   - 결제 수단 문제 해결

#### C. API 문제인 경우
1. **Developer Token 재발급**
   - OAuth 2.0 Playground 사용
   - 새로운 Refresh Token 발급
   - 환경변수 업데이트

2. **API 사용량 최적화**
   - API 호출 빈도 조절
   - 불필요한 API 호출 제거
   - 캐싱 전략 구현

### 4단계: Google 지원팀 문의

#### 문의 내용
```
제목: Google Ads API 계정 정지 해제 요청

안녕하세요,

Google Ads API 계정이 정지되어 문의드립니다.

계정 정보:
- 이메일: taksoo.kim@gmail.com
- Developer Token: SuzbNF-IwuyiXz040NdIIQ
- 액세스 수준: Standard Access (승인됨)

현재 상황:
- "1개의 계정이 정지됨" 경고 표시
- API 호출 시 인증 오류 발생
- 정지 사유 불명확

요청 사항:
1. 계정 정지 사유 명확한 설명
2. 정지 해제를 위한 구체적 조치 방법
3. 정지 해제 예상 소요 시간

감사합니다.
```

#### 문의 방법
1. **Google Ads API 지원팀**
   - 이메일: googleadsapi-support@google.com
   - 웹사이트: https://developers.google.com/google-ads/api/support

2. **Google Ads 지원팀**
   - 웹사이트: https://support.google.com/google-ads
   - 계정 내 지원 섹션

## 📋 체크리스트

### 즉시 확인 사항
- [ ] Google Ads 계정 상태 확인
- [ ] 정지 사유 알림 확인
- [ ] 결제 수단 유효성 확인
- [ ] API 사용량 현황 확인

### 해결 조치
- [ ] 정책 위반 내용 수정
- [ ] 결제 문제 해결
- [ ] Developer Token 재발급
- [ ] Google 지원팀 문의

### 후속 조치
- [ ] 정지 해제 확인
- [ ] API 정상 작동 테스트
- [ ] 모니터링 시스템 구축
- [ ] 정책 준수 가이드 작성

## 🚨 주의사항

1. **정지 해제 시간**: 보통 24-48시간 소요
2. **재정지 방지**: 정책 준수 및 모니터링 강화
3. **백업 계정**: 중요 서비스의 경우 백업 계정 준비
4. **문서화**: 모든 조치 과정 문서화

## 📞 긴급 연락처

- **Google Ads API 지원**: googleadsapi-support@google.com
- **Google Ads 지원**: https://support.google.com/google-ads
- **긴급 상황**: Google Ads 계정 내 지원 섹션

---

**업데이트**: 2024-09-12
**상태**: 분석 완료, 해결 방법 제시
