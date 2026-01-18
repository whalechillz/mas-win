-- ==========================================
-- customer_consultations 테이블에 블로그 초안 필드 추가
-- ==========================================

-- 블로그 초안 관련 필드 추가
ALTER TABLE customer_consultations
ADD COLUMN IF NOT EXISTS blog_draft_content TEXT, -- 블로그 초안 내용
ADD COLUMN IF NOT EXISTS blog_draft_title VARCHAR(500), -- 블로그 초안 제목
ADD COLUMN IF NOT EXISTS blog_draft_summary TEXT, -- 블로그 초안 요약
ADD COLUMN IF NOT EXISTS blog_draft_type VARCHAR(50), -- 'integrated' | 'review-only'
ADD COLUMN IF NOT EXISTS blog_draft_created_at TIMESTAMP WITH TIME ZONE; -- 초안 생성일

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_consultations_blog_draft ON customer_consultations(blog_draft_created_at) 
WHERE blog_draft_content IS NOT NULL;

-- 코멘트 추가
COMMENT ON COLUMN customer_consultations.blog_draft_content IS '블로그 초안 내용 (마크다운)';
COMMENT ON COLUMN customer_consultations.blog_draft_title IS '블로그 초안 제목';
COMMENT ON COLUMN customer_consultations.blog_draft_summary IS '블로그 초안 요약';
COMMENT ON COLUMN customer_consultations.blog_draft_type IS '블로그 생성 방식 (integrated: 통합형, review-only: 후기 중심)';
COMMENT ON COLUMN customer_consultations.blog_draft_created_at IS '블로그 초안 생성일';
