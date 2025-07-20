# 🧪 배포 후 테스트 체크리스트

## 1. 기본 기능 테스트

### 🌐 웹사이트 접속
- [ ] https://win.masgolf.co.kr 정상 접속
- [ ] 메인 페이지 로딩 확인
- [ ] 콘솔 에러 없는지 확인

### 🔐 어드민 로그인
- [ ] /admin 페이지 접속
- [ ] ID: admin / PW: 1234 로그인
- [ ] 로그인 후 대시보드 표시

## 2. 기존 마케팅 시스템 테스트

### 📊 마케팅 대시보드
- [ ] "마케팅 관리" 메뉴 클릭
- [ ] 기존 캠페인 목록 표시
- [ ] 캠페인 상세 보기 작동
- [ ] 블로그 일정 표시

### 🎯 퍼널 관리 (기존)
- [ ] FunnelPlanManager 컴포넌트 정상 작동
- [ ] FunnelPageBuilder 정상 작동
- [ ] GoogleAdsManager 정상 작동
- [ ] ContentGenerator 정상 작동
- [ ] ContentValidator 정상 작동

## 3. 새로 추가된 기능 확인

### 🗄️ 데이터베이스
Supabase 대시보드에서 확인:
- [ ] monthly_funnel_plans 테이블 존재
- [ ] funnel_pages 테이블 존재
- [ ] generated_contents 테이블 존재
- [ ] monthly_kpis 테이블 존재
- [ ] integrated_marketing_dashboard 뷰 존재

### 🔌 API 테스트 (개발자 도구 사용)
```javascript
// 브라우저 콘솔에서 테스트
// 1. 퍼널 계획 조회
fetch('/api/integrated/funnel-plans-v2?year=2025&month=7')
  .then(res => res.json())
  .then(data => console.log('Funnel Plans:', data));

// 2. KPI 조회
fetch('/api/integrated/kpi-v2?year=2025&month=7')
  .then(res => res.json())
  .then(data => console.log('KPI:', data));
```

## 4. 성능 및 에러 체크

### ⚡ 성능
- [ ] 페이지 로딩 속도 정상
- [ ] API 응답 속도 정상
- [ ] 메모리 사용량 정상

### 🐛 에러 확인
- [ ] 브라우저 콘솔 에러 없음
- [ ] Vercel Functions 로그 에러 없음
- [ ] Supabase 로그 에러 없음

## 5. 문제 발생 시 롤백 계획

### 🔄 Git 롤백
```bash
# 이전 커밋으로 되돌리기
git log --oneline -5  # 최근 5개 커밋 확인
git revert HEAD      # 마지막 커밋 취소

# 강제 롤백 (주의!)
git reset --hard HEAD~1
git push --force
```

### 📊 데이터베이스 롤백
```sql
-- 추가한 테이블 삭제 (주의!)
DROP TABLE IF EXISTS generated_contents CASCADE;
DROP TABLE IF EXISTS funnel_pages CASCADE;
DROP TABLE IF EXISTS monthly_funnel_plans CASCADE;
DROP TABLE IF EXISTS monthly_kpis CASCADE;
DROP VIEW IF EXISTS integrated_marketing_dashboard CASCADE;
```

---

## ✅ 테스트 완료 후
모든 테스트가 통과하면 대화창2 작업을 진행하세요!
