# 📋 통합 마케팅 시스템 통합 테스트 체크리스트

## 🎯 테스트 목표
통합 마케팅 시스템의 전체 워크플로우가 정상적으로 작동하는지 검증

## ✅ 1. 데이터베이스 연결 테스트
- [ ] Supabase 연결 확인
- [ ] 모든 테이블 생성 확인
  - [ ] monthly_funnel_plans
  - [ ] funnel_pages
  - [ ] generated_contents
  - [ ] monthly_kpis
- [ ] 권한 설정 확인
- [ ] 트리거 작동 확인

## ✅ 2. 컴포넌트 단위 테스트

### 2.1 IntegratedMarketingHub
- [ ] 라우팅 정상 작동
- [ ] 탭 전환 기능
- [ ] 년/월 선택 기능
- [ ] 상태 관리

### 2.2 FunnelPlanManager
- [ ] 월별 퍼널 계획 CRUD
- [ ] 기존 테마 데이터 연동
- [ ] 퍼널 단계별 설정
- [ ] 상태 변경 (planning → active → completed)

### 2.3 FunnelPageBuilder (MCP 연동)
- [ ] 퍼널 페이지 데이터 저장
- [ ] 이미지 경로 관리
- [ ] 콘텐츠 구조 저장
- [ ] 퍼널 페이지 HTML 생성 (/public/funnel-pages/)

### 2.4 GoogleAdsManager (MCP 연동)
- [ ] UTM 태그 자동 생성
- [ ] 광고 소재 데이터 저장
- [ ] CSV 파일 생성
- [ ] 캠페인 폴더 구조 관리

### 2.5 ContentGenerator
- [ ] 채널별 콘텐츠 생성
- [ ] 퍼널 페이지 데이터 활용
- [ ] AI API 연동
- [ ] 콘텐츠 저장

### 2.6 ContentValidator
- [ ] SEO 점수 계산
- [ ] 가독성 점수 계산
- [ ] 브랜드 일관성 체크
- [ ] 개선 제안사항 생성

### 2.7 KPIManager
- [ ] 채널별 KPI 표시
- [ ] 직원별 블로그 할당량 관리
- [ ] 성과 차트 표시
- [ ] 데이터 동기화

## ✅ 3. API 엔드포인트 테스트

### 3.1 퍼널 관리 API
- [ ] POST /api/integrated/funnel-plans
- [ ] GET /api/integrated/funnel-plans?year=:year&month=:month
- [ ] PUT /api/integrated/funnel-plans/:id
- [ ] DELETE /api/integrated/funnel-plans/:id

### 3.2 콘텐츠 관리 API
- [ ] POST /api/integrated/generate-content
- [ ] POST /api/integrated/validate-content
- [ ] GET /api/integrated/contents/:funnelPlanId

### 3.3 KPI 관리 API
- [ ] GET /api/integrated/kpi?year=:year&month=:month
- [ ] POST /api/integrated/kpi-sync
- [ ] PUT /api/integrated/employee-quota

## ✅ 4. 통합 워크플로우 테스트

### 4.1 전체 프로세스 (2025년 7월 예시)
1. [ ] 월별 퍼널 계획 생성
2. [ ] 퍼널 페이지 구성 (MCP로 초안 제작)
3. [ ] 구글 애드 UTM 태그 생성
4. [ ] 멀티채널 콘텐츠 생성
5. [ ] AI 콘텐츠 검증
6. [ ] KPI 입력 및 확인

### 4.2 데이터 연동 확인
- [ ] 퍼널 계획 → 퍼널 페이지 연동
- [ ] 퍼널 페이지 → 콘텐츠 생성 연동
- [ ] 콘텐츠 → KPI 반영

## ✅ 5. UI/UX 테스트

### 5.1 반응형 디자인
- [ ] 데스크톱 (1920x1080)
- [ ] 태블릿 (768x1024)
- [ ] 모바일 (375x667)

### 5.2 브라우저 호환성
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge

### 5.3 성능 테스트
- [ ] 페이지 로딩 시간 < 3초
- [ ] API 응답 시간 < 1초
- [ ] 대용량 데이터 처리 (100개 이상 콘텐츠)

## ✅ 6. 에러 처리 테스트
- [ ] 네트워크 오류 처리
- [ ] API 오류 메시지
- [ ] 유효성 검사 메시지
- [ ] 권한 오류 처리

## ✅ 7. 보안 테스트
- [ ] 인증/인가 확인
- [ ] CSRF 보호
- [ ] XSS 방지
- [ ] SQL 인젝션 방지

## ✅ 8. 데이터 무결성 테스트
- [ ] 트랜잭션 처리
- [ ] 동시성 제어
- [ ] 데이터 백업/복구
- [ ] 삭제 시 참조 무결성

## 🐛 발견된 버그
1. [ ] 버그 설명:
   - 재현 방법:
   - 예상 결과:
   - 실제 결과:
   - 수정 방법:

## 📊 테스트 결과 요약
- 총 테스트 항목: 
- 성공: 
- 실패: 
- 보류: 

## 📝 개선사항
1. 
2. 
3. 

---
테스트 일시: 2025년 7월 20일
테스터: 
버전: v1.0.0