-- 성능 최적화를 위한 데이터베이스 인덱스 생성
-- Supabase SQL Editor에서 실행하세요

-- cc_content_calendar 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_cc_content_date ON cc_content_calendar(content_date DESC);
CREATE INDEX IF NOT EXISTS idx_cc_status ON cc_content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_cc_blog_post_id ON cc_content_calendar(blog_post_id);

-- blog_posts 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_blog_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);

-- image_metadata 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_image_created_at ON image_metadata(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_folder_path ON image_metadata(folder_path);

-- 추가 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_cc_content_type ON cc_content_calendar(content_type);
CREATE INDEX IF NOT EXISTS idx_cc_parent_content ON cc_content_calendar(parent_content_id);
CREATE INDEX IF NOT EXISTS idx_image_category ON image_metadata(category_id);
