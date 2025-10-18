-- 성능 최적화를 위한 데이터베이스 인덱스 생성
-- Supabase SQL Editor에서 실행하세요
-- 테이블 구조 확인 완료: 모든 컬럼 존재 확인됨

-- cc_content_calendar 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_cc_content_date ON cc_content_calendar(content_date DESC);
CREATE INDEX IF NOT EXISTS idx_cc_status ON cc_content_calendar(status);
CREATE INDEX IF NOT EXISTS idx_cc_blog_post_id ON cc_content_calendar(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_cc_content_type ON cc_content_calendar(content_type);
CREATE INDEX IF NOT EXISTS idx_cc_parent_content ON cc_content_calendar(parent_content_id);

-- blog_posts 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_blog_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);

-- image_metadata 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_image_created_at ON image_metadata(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_category_id ON image_metadata(category_id);
CREATE INDEX IF NOT EXISTS idx_image_status ON image_metadata(status);
CREATE INDEX IF NOT EXISTS idx_image_usage_count ON image_metadata(usage_count);

-- 추가 성능 최적화 인덱스
CREATE INDEX IF NOT EXISTS idx_cc_priority ON cc_content_calendar(priority);
CREATE INDEX IF NOT EXISTS idx_cc_is_root_content ON cc_content_calendar(is_root_content);
CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_view_count ON blog_posts(view_count DESC);
