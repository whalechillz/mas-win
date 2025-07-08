# 🔄 MASGOLF 전체 데이터 스키마 업데이트

## Supabase SQL Editor에서 실행할 SQL

```sql
-- 1. 퀴즈 결과 테이블 생성 (없다면)
CREATE TABLE IF NOT EXISTS quiz_results (
  id SERIAL PRIMARY KEY,
  swing_style TEXT,
  priority TEXT,
  current_distance TEXT,
  recommended_product TEXT,
  booking_id INTEGER REFERENCES bookings(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. bookings 테이블에 추가 필드 (이미 있다면 무시됨)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS swing_style TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT,
ADD COLUMN IF NOT EXISTS current_distance TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS campaign_source TEXT;

-- 3. contacts 테이블에 추가 필드
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS campaign_source TEXT,
ADD COLUMN IF NOT EXISTS contacted BOOLEAN DEFAULT false;

-- 4. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_contacted ON contacts(contacted);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_results_booking ON quiz_results(booking_id);

-- 5. 통합 뷰 생성 (예약 + 퀴즈 결과)
CREATE OR REPLACE VIEW booking_details AS
SELECT 
  b.*,
  q.swing_style as quiz_swing_style_result,
  q.priority as quiz_priority_result,
  q.current_distance as quiz_distance_result,
  q.recommended_product as quiz_product_result
FROM bookings b
LEFT JOIN quiz_results q ON b.id = q.booking_id
ORDER BY b.created_at DESC;

-- 6. 통계 뷰 생성
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

-- 7. RLS 정책 업데이트
CREATE POLICY "Enable update for all users" ON bookings
  FOR UPDATE USING (true);

CREATE POLICY "Enable update for all users" ON contacts
  FOR UPDATE USING (true);

CREATE POLICY "Enable all for quiz_results" ON quiz_results
  FOR ALL USING (true);
```

## 적용 완료 후 확인사항

✅ 퀴즈 결과 저장 가능
✅ 예약 시 스윙 스타일, 우선순위, 거리 정보 저장
✅ 문의 상태 관리 가능
✅ 캠페인 소스 추적 가능
✅ 메모 기능 사용 가능
