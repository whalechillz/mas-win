# 🗄️ 예약/문의 관리 기능 강화를 위한 DB 스키마 업데이트

## Supabase SQL Editor에서 실행할 SQL

```sql
-- 1. bookings 테이블에 상태와 메모 필드 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS memo TEXT;

-- 2. contacts 테이블에 메모와 캠페인 출처 필드 추가
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS memo TEXT,
ADD COLUMN IF NOT EXISTS campaign_source TEXT;

-- 3. 예약 상태 업데이트 (기존 데이터에 대해)
UPDATE bookings 
SET status = 'pending' 
WHERE status IS NULL;

-- 4. 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_contacts_contacted ON contacts(contacted);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at);

-- 5. 통계 뷰 생성
CREATE OR REPLACE VIEW booking_stats AS
SELECT 
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings,
  COUNT(*) FILTER (WHERE status = 'contacted') as contacted_bookings,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_bookings,
  COUNT(*) FILTER (WHERE date = CURRENT_DATE) as today_bookings
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
```

## 적용 방법

1. Supabase 대시보드 접속
2. SQL Editor 열기
3. 위 SQL 코드 복사/붙여넣기
4. Run 버튼 클릭

## 확인 사항

✅ bookings 테이블에 status, memo 컬럼 추가됨
✅ contacts 테이블에 memo, campaign_source 컬럼 추가됨
✅ 성능 향상을 위한 인덱스 생성됨
✅ 통계 뷰 생성됨

## 다음 단계

관리자 페이지에서 새로운 기능 사용 가능:
- 예약/문의 상태 관리
- 메모 기능
- 일괄 처리
- 엑셀 다운로드
- 통계 대시보드
