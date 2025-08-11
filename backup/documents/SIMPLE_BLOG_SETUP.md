# 🚀 간편 블로그 관리 시스템 설치 가이드

## Step 1: 데이터베이스 설정

### Supabase SQL Editor에서 실행:

```sql
-- 1. 테이블 생성
-- /database/simple-blog-schema.sql 내용 실행

-- 2. 샘플 데이터 (선택사항)
-- /database/sample-data-migration.sql 내용 실행
```

## Step 2: 파일 확인

다음 파일들이 생성되었는지 확인:
- ✅ `/components/admin/marketing/SimpleBlogManager.tsx`
- ✅ `/components/admin/marketing/MarketingDashboard.tsx` (수정됨)
- ✅ `/database/simple-blog-schema.sql`
- ✅ `/docs/EMPLOYEE_BLOG_GUIDE.md`

## Step 3: 사용 시작

1. 브라우저 새로고침 (F5)
2. "마케팅 콘텐츠" 메뉴 클릭
3. "✨ 블로그 관리 (간편)" 탭 확인

---

## 🎯 핵심 개선사항

### 1. 단순화된 구조
- 복잡한 테이블 구조 → 단일 테이블
- 1개 주제 → 3개 다른 앵글 자동 생성
- 직관적인 상태 관리

### 2. 네이버 정책 준수
- ❌ 중복 콘텐츠 방지
- ✅ 각 계정별 다른 관점
- ✅ 시간차 발행

### 3. 실무 중심 UI
- 주제별 그룹 표시
- 계정별 색상 구분
- 원클릭 URL/조회수 입력

---

## 📊 예상 효과

### 단기 (1개월)
- 작업 시간 50% 단축
- 네이버 품질 점수 향상
- 팀 협업 효율성 증가

### 장기 (3개월)
- 검색 순위 상승
- 브랜드 인지도 향상
- 자사몰 트래픽 증가

---

## ⚠️ 주의사항

1. **반드시 다른 관점으로 작성**
   - 복사/붙여넣기 절대 금지
   - 각 글마다 고유한 가치 제공

2. **품질 > 수량**
   - 하루 3개 이상 발행 자제
   - 충분한 작성 시간 확보

3. **지속적인 관리**
   - 주 1회 조회수 업데이트
   - 성과 분석 및 개선

---

문제 발생 시 연락처: dev@maslabs.co.kr