# 🚨 통합 캠페인 시스템 데이터 로드 문제 해결 가이드

## 문제 상황
- 7월 마케팅 캠페인의 목표나 프로모션 데이터가 표시되지 않음
- 기존 엑셀 데이터가 DB로 마이그레이션되지 않음
- CRUD 기능 중 수정/삭제 기능 미작동

## 즉시 해결 방법

### 1단계: Supabase SQL Editor에서 실행
```bash
# 파일 위치: /database/fix-integrated-campaign.sql
```

이 SQL 파일은 다음을 수행합니다:
- ✅ marketing_campaigns 테이블 생성
- ✅ monthly_themes 테이블 수정 (objective, promotion_detail 필드 추가)
- ✅ 7-9월 캠페인 데이터 입력
- ✅ 월별 테마 데이터 입력

### 2단계: 컴포넌트 파일 교체
```bash
# 기존 파일 백업
cp components/admin/marketing/IntegratedCampaignManager.tsx \
   components/admin/marketing/IntegratedCampaignManager-backup.tsx

# 수정된 파일로 교체  
cp components/admin/marketing/IntegratedCampaignManager-fixed.tsx \
   components/admin/marketing/IntegratedCampaignManager.tsx
```

### 3단계: 확인
1. https://win.masgolf.co.kr/admin 접속
2. 마케팅 콘텐츠 → 통합 캠페인 탭
3. 7월 선택 시 데이터 표시 확인

## 🎯 추가된 기능

### 1. **완전한 CRUD 지원**
- ✅ Create: 캠페인 추가
- ✅ Read: 월별 캠페인 조회
- ✅ Update: 캠페인 수정 (연필 아이콘)
- ✅ Delete: 캠페인 삭제 (휴지통 아이콘)

### 2. **데이터 표시 개선**
- 목표(objective) 표시
- 프로모션 상세(promotion_detail) 표시
- 담당자 선택 가능 (제이, 스테피, 나과장, 허상원)

### 3. **블로그 자동 생성**
- 블로그 캠페인 추가 시 3개 계정 자동 생성
- 각 계정별 담당자 자동 배정

## 📊 엑셀 데이터 추가 마이그레이션

나머지 월(10-12월, 2026년) 데이터를 추가하려면:

```sql
-- 10-12월 캠페인 추가
INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status) VALUES
-- 10월
('2025-10-07', 10, 2025, 'kakao', '가을 골프 성수기', '가을 골프, 마스구로 완성', 1148, '제이', 'planned'),
-- 11월  
('2025-11-04', 11, 2025, 'blog', '블랙 프라이데이 세일', '블랙 프라이데이, 마스골프 특별 세일', 0, '스테피', 'planned'),
-- 12월
('2025-12-02', 12, 2025, 'sms', '연말 고객 감사', '연말, 마스구와 함께한 골프의 추억', 1193, '허상원', 'planned');
```

## 🔧 문제가 지속되면

1. **브라우저 캐시 삭제**
   - Chrome: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

2. **Supabase 연결 확인**
   - .env.local 파일의 SUPABASE_URL과 SUPABASE_ANON_KEY 확인

3. **콘솔 에러 확인**
   - 개발자 도구(F12) → Console 탭에서 에러 메시지 확인

## 📞 추가 지원
문제가 해결되지 않으면 다음 정보와 함께 문의:
- 브라우저 콘솔 에러 메시지
- Supabase 테이블 구조 스크린샷
- 네트워크 탭의 API 응답 내용