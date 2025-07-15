-- 진짜 필요한 테이블만 추가!
-- Supabase SQL Editor에서 실행

-- 1. content_categories 테이블만 생성 (콘텐츠 생성에 필수)
CREATE TABLE IF NOT EXISTS content_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 기본 카테고리 데이터
INSERT INTO content_categories (name, color) VALUES 
('프로모션', '#3B82F6'),
('이벤트', '#10B981'),
('팁/가이드', '#F59E0B'),
('상품소개', '#8B5CF6'),
('고객후기', '#EC4899')
ON CONFLICT DO NOTHING;

-- 2. 404 에러 방지용 더미 뷰들 (선택사항)
-- 에러 로그가 거슬린다면 추가, 아니면 무시해도 됨
CREATE OR REPLACE VIEW marketing_funnel_stages AS
SELECT 1 as id, 'Dummy' as stage_name;

CREATE OR REPLACE VIEW annual_marketing_plans AS
SELECT id, year, month, theme as plan_name FROM monthly_themes;

CREATE OR REPLACE VIEW bookings_with_quiz AS
SELECT 1 as id; -- 더미 뷰

-- 3. 권한 설정
GRANT ALL ON content_categories TO anon, authenticated;
GRANT USAGE ON SEQUENCE content_categories_id_seq TO anon, authenticated;

-- 4. RLS 비활성화 (중요!)
ALTER TABLE content_ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories DISABLE ROW LEVEL SECURITY;