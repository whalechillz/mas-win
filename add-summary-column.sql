-- cc_content_calendar 테이블에 summary 컬럼 추가
ALTER TABLE cc_content_calendar 
ADD COLUMN IF NOT EXISTS summary TEXT;
