# 🚀 통합 캠페인 - 멀티채널 연동 실행 가이드

## 📌 실행 순서 (중요!)

### 1️⃣ Supabase SQL 실행 (순서대로)
```sql
-- 1. 연동 시스템 구축
/database/integrate-campaign-multichannel.sql

-- 2. 7월 실제 데이터 마이그레이션
/database/july-2025-campaign-migration.sql
```

### 2️⃣ 파일 교체
```bash
# 1. IntegratedCampaignManager 업데이트
cp components/admin/marketing/IntegratedCampaignManager-v2.tsx \
   components/admin/marketing/IntegratedCampaignManager.tsx

# 2. BlogCalendar 에러 수정
cp components/admin/marketing/BlogCalendar-fixed.tsx \
   components/admin/marketing/BlogCalendar.tsx
```

### 3️⃣ 확인 및 테스트
1. https://win.masgolf.co.kr/admin 접속
2. 마케팅 콘텐츠 → 통합 캠페인
3. 7월 선택 → 데이터 확인

## ✅ 구현된 기능

### 📊 통합 캠페인 관리
- **전체 현황**: 캠페인 CRUD + 실시간 통계
- **멀티채널 콘텐츠**: 자동 생성된 콘텐츠 관리
- **캘린더 뷰**: 월별 발행 일정 시각화

### 🔗 자동 연동 시스템
```
캠페인 추가 → 자동 트리거 → 멀티채널 콘텐츠 생성
    ├── 카카오톡: 월 2회 (1, 15일)
    ├── 문자: 월 2회 (2, 16일)
    ├── 네이버 블로그: 주 9회 (3개 계정 x 주3회)
    ├── 자사 블로그: 주 3회
    └── 기타 플랫폼: 주 2-4회
```

### 📅 7월 예상 결과
- 총 콘텐츠: 약 60개
- 카카오톡: 2개
- 문자: 2개
- 네이버 블로그: 36개 (3계정 x 12개)
- 자사 블로그: 12개
- 인스타그램: 8개
- 유튜브: 2개

## 🎯 주요 개선사항
1. **데이터 연동**: `annual_marketing_calendar` 테이블과 실제 캠페인 연결
2. **자동화**: 캠페인 생성 시 멀티채널 콘텐츠 자동 생성
3. **에러 수정**: BlogCalendar, MarketingFunnelPlan 컴포넌트 오류 해결
4. **통합 대시보드**: 한 화면에서 모든 채널 관리

## 📱 사용법

### 새 월 캠페인 시작
1. 년/월 선택
2. "멀티채널 자동생성" 클릭
3. 60개 콘텐츠 자동 생성 확인

### 개별 캠페인 추가
1. "+ 캠페인 추가" 클릭
2. 정보 입력 (날짜, 채널, 주제 등)
3. 저장 → 관련 콘텐츠 자동 생성

### 콘텐츠 관리
1. "멀티채널 콘텐츠" 탭
2. 플랫폼/상태별 필터링
3. 일괄 상태 변경 가능

## ⚠️ 주의사항
- 캠페인 삭제 시 연결된 콘텐츠도 삭제됨
- 월별 테마가 없으면 자동 생성 불가
- 중복 실행 방지 로직 포함

## 🆘 문제 발생 시
1. 브라우저 캐시 삭제 (Cmd+Shift+R)
2. Supabase 로그 확인
3. 콘솔 에러 메시지 확인

---
**완료!** 이제 통합 캠페인과 멀티채널이 완벽하게 연동됩니다. 🎉