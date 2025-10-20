-- 기존 테이블 구조 확인 및 필요한 컬럼 추가

-- 1. channel_sms 테이블에 calendar_id 컬럼 추가 (없는 경우)
ALTER TABLE channel_sms 
ADD COLUMN IF NOT EXISTS calendar_id UUID;

-- 2. channel_naver_blog 테이블에 calendar_id 컬럼 추가 (없는 경우)
ALTER TABLE channel_naver_blog 
ADD COLUMN IF NOT EXISTS calendar_id UUID;

-- 3. channel_kakao 테이블에 필요한 컬럼 추가
ALTER TABLE channel_kakao 
ADD COLUMN IF NOT EXISTS calendar_id UUID,
ADD COLUMN IF NOT EXISTS title VARCHAR(500);

-- 4. 테이블 구조 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('channel_sms', 'channel_naver_blog', 'channel_kakao')
  AND column_name = 'calendar_id'
ORDER BY table_name;
