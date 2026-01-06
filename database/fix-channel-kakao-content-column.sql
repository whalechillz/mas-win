-- channel_kakao 테이블에 content 컬럼 추가 또는 message_text 확인
-- Supabase SQL Editor에서 실행하세요

-- 1. 현재 테이블 구조 확인
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'channel_kakao'
ORDER BY ordinal_position;

-- 2. content 컬럼이 없으면 추가 (message_text가 있는 경우)
ALTER TABLE channel_kakao 
ADD COLUMN IF NOT EXISTS content TEXT;

-- 3. message_text가 있고 content가 없으면 message_text를 content로 복사
UPDATE channel_kakao 
SET content = message_text 
WHERE content IS NULL AND message_text IS NOT NULL;

-- 4. 또는 content 컬럼을 message_text로 이름 변경 (content가 없고 message_text만 있는 경우)
-- ALTER TABLE channel_kakao RENAME COLUMN message_text TO content;






