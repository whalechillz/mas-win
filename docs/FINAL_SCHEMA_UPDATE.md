# 🔄 MASGOLF 데이터 스키마 최종 업데이트

## Supabase SQL Editor에서 실행할 SQL

```sql
-- 1. quiz_results 테이블 삭제 (중복이므로)
DROP TABLE IF EXISTS quiz_results CASCADE;

-- 2. bookings 테이블에 누락된 필드 추가 (이미 있다면 무시됨)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS memo TEXT;

-- 3. contacts 테이블에 누락된 필드 추가
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS campaign_source TEXT;

-- 4. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_contacted ON contacts(contacted);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at);

-- 5. 통계 뷰 생성
CREATE OR REPLACE VIEW booking_stats AS
SELECT 
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted_bookings,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
  COUNT(*) FILTER (WHERE date = CURRENT_DATE) as today_bookings,
  COUNT(DISTINCT club) as unique_clubs,
  COUNT(*) FILTER (WHERE swing_style IS NOT NULL) as with_quiz_results
FROM bookings;

CREATE OR REPLACE VIEW contact_stats AS
SELECT 
  COUNT(*) as total_contacts,
  COUNT(*) FILTER (WHERE contacted = false OR contacted IS NULL) as pending_contacts,
  COUNT(*) FILTER (WHERE contacted = true) as contacted_contacts,
  COUNT(*) FILTER (WHERE call_times = '오전') as morning_contacts,
  COUNT(*) FILTER (WHERE call_times = '오후') as afternoon_contacts,
  COUNT(*) FILTER (WHERE call_times = '저녁') as evening_contacts,
  COUNT(*) FILTER (WHERE call_times IS NULL OR call_times = '시간무관') as anytime_contacts
FROM contacts;

-- 6. RLS 정책 업데이트 (없다면 추가)
CREATE POLICY "Enable update for all users" ON bookings
  FOR UPDATE USING (true);

CREATE POLICY "Enable update for all users" ON contacts
  FOR UPDATE USING (true);
```

## 최종 데이터베이스 구조

### bookings 테이블 (시타 예약)
- id, name, phone, date, time, club
- **swing_style** - 스윙 스타일 (안정형/파워형/복합형)
- **priority** - 우선순위 (비거리/방향성/편안함)
- **current_distance** - 현재 평균 거리
- **recommended_flex** - 추천 플렉스
- **expected_distance** - 예상 거리
- status - 상태 (pending/contacted/completed)
- memo - 메모
- created_at

### contacts 테이블 (문의)
- id, name, phone
- call_times - 통화 가능 시간
- contacted - 연락 여부
- memo - 메모
- campaign_source - 캠페인 출처
- created_at

## 적용 완료 후 확인사항

✅ quiz_results 테이블 삭제됨 (중복 제거)
✅ 예약 시 퀴즈 결과가 bookings 테이블에 직접 저장
✅ 상태 관리 및 메모 기능 사용 가능
✅ 통계 뷰로 빠른 집계 가능
