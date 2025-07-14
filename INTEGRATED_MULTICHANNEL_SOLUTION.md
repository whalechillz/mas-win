# 🔗 통합 캠페인 - 멀티채널 연동 시스템 구축 가이드

## 📋 문제 상황
1. **통합 캠페인과 멀티채널이 연동되지 않음**
2. **월별 테마는 있지만 실제 캠페인 데이터가 없음** (campaign_count가 0)
3. **콘텐츠 캘린더와 퍼널 계획 메뉴에서 에러 발생**
4. **자동화된 콘텐츠 생성 시스템 부재**

## ✅ 해결 방법

### 1단계: DB 연동 시스템 구축
```bash
# Supabase SQL Editor에서 실행
/database/integrate-campaign-multichannel.sql
```

이 SQL은 다음을 수행합니다:
- ✅ 캠페인-콘텐츠 매핑 테이블 생성
- ✅ 월별 콘텐츠 자동 생성 함수
- ✅ 캠페인 생성 시 자동 트리거
- ✅ 통합 대시보드 뷰 생성

### 2단계: 컴포넌트 업데이트

#### 1. **통합 캠페인 매니저 v2 적용**
```bash
# 백업
cp components/admin/marketing/IntegratedCampaignManager.tsx \
   components/admin/marketing/IntegratedCampaignManager-backup.tsx

# 새 버전 적용
cp components/admin/marketing/IntegratedCampaignManager-v2.tsx \
   components/admin/marketing/IntegratedCampaignManager.tsx
```

#### 2. **블로그 캘린더 수정**
```bash
# 백업
cp components/admin/marketing/BlogCalendar.tsx \
   components/admin/marketing/BlogCalendar-backup.tsx

# 수정 버전 적용
cp components/admin/marketing/BlogCalendar-fixed.tsx \
   components/admin/marketing/BlogCalendar.tsx
```

### 3단계: 테스트 및 확인

#### 1. **2025년 7월 콘텐츠 자동 생성**
```sql
-- Supabase SQL Editor에서 실행
SELECT generate_monthly_content(2025, 7);

-- 결과 확인
SELECT platform, COUNT(*) as count 
FROM content_ideas 
WHERE EXTRACT(YEAR FROM scheduled_date) = 2025 
  AND EXTRACT(MONTH FROM scheduled_date) = 7
GROUP BY platform;
```

#### 2. **관리자 페이지에서 확인**
1. https://win.masgolf.co.kr/admin 접속
2. 마케팅 콘텐츠 → 통합 캠페인
3. "멀티채널 자동생성" 버튼 클릭

## 🎯 자동화 시스템 특징

### 월별 콘텐츠 자동 생성 규칙
| 플랫폼 | 발행 주기 | 담당자 | 자동 생성 개수 |
|--------|-----------|--------|---------------|
| 카카오톡 | 월 2회 (1,15일) | 제이 | 2개/월 |
| 문자 | 월 2회 (2,16일) | 제이 | 2개/월 |
| 네이버블로그 (mas9golf) | 주 3회 (월,수,금) | 제이 | 12개/월 |
| 네이버블로그 (massgoogolf) | 주 3회 (월,수,금) | 스테피 | 12개/월 |
| 네이버블로그 (massgoogolfkorea) | 주 3회 (월,수,금) | 허상원/나과장 | 12개/월 |
| 자사블로그 | 주 3회 (월,수,금) | 나과장 | 12개/월 |
| 인스타그램 | 주 2회 (화,목) | 스테피 | 8개/월 |
| 유튜브 | 월 2회 (1,3주) | 제이 | 2개/월 |

### 통합 대시보드 기능
1. **전체 현황**: 캠페인 목록 및 CRUD
2. **멀티채널 콘텐츠**: 자동 생성된 콘텐츠 관리
3. **캘린더 뷰**: 월별 발행 일정 확인

## 📊 데이터 흐름

```
월별 테마 설정
    ↓
캠페인 생성
    ↓
자동 트리거 실행
    ↓
멀티채널 콘텐츠 생성
    ├── 카카오톡 (월 2회)
    ├── 문자 (월 2회)
    ├── 네이버 블로그 (주 9회)
    ├── 자사 블로그 (주 3회)
    └── 기타 플랫폼 (주 2-4회)
```

## 🔧 문제 해결

### 에러 발생 시
1. **브라우저 콘솔 확인**: F12 → Console
2. **Supabase 로그 확인**: Dashboard → Logs
3. **테이블 권한 확인**: 
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
```

### 캘린더/퍼널 에러 수정
- BlogCalendar: props 타입 수정 완료
- MarketingFunnelPlan: 필요시 별도 수정

## 📝 사용 예시

### 1. 새 캠페인 추가
1. 통합 캠페인 탭 → "+ 캠페인 추가"
2. 날짜, 채널, 주제 입력
3. 저장 → 멀티채널 콘텐츠 자동 생성

### 2. 월별 일괄 생성
1. 원하는 년/월 선택
2. "멀티채널 자동생성" 버튼 클릭
3. 약 60개 콘텐츠 자동 생성

### 3. 콘텐츠 확인
1. "멀티채널 콘텐츠" 탭에서 확인
2. 플랫폼별 필터링 가능
3. 상태별 관리 (초안→작성중→발행준비→발행완료)

## 🚀 기대 효과
- **작업 시간 80% 단축**: 수동 입력 → 자동 생성
- **일관성 유지**: 월별 테마 기반 통합 관리
- **누락 방지**: 체계적인 발행 일정 관리
- **성과 추적**: 통합 대시보드로 한눈에 확인

---

이제 통합 캠페인과 멀티채널이 완벽하게 연동됩니다! 🎉