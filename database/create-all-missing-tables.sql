-- 모든 누락된 테이블/뷰 생성 (간단 버전)
-- Supabase SQL Editor에서 실행

-- 1. blog_contents 뷰 생성 (content_ideas 기반)
CREATE OR REPLACE VIEW blog_contents AS
SELECT * FROM content_ideas WHERE platform = 'blog';

-- 2. content_categories 테이블 생성
CREATE TABLE IF NOT EXISTS content_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 기본 카테고리 추가
INSERT INTO content_categories (name, color) VALUES 
('프로모션', '#3B82F6'),
('이벤트', '#10B981'),
('팁/가이드', '#F59E0B'),
('상품소개', '#8B5CF6'),
('고객후기', '#EC4899')
ON CONFLICT DO NOTHING;

-- 3. blog_platforms 뷰 생성
CREATE OR REPLACE VIEW blog_platforms AS
SELECT DISTINCT 
    ROW_NUMBER() OVER () as id,
    platform as name,
    platform as type
FROM content_ideas;

-- 4. marketing_funnel_stages 테이블
CREATE TABLE IF NOT EXISTS marketing_funnel_stages (
    id SERIAL PRIMARY KEY,
    stage_name VARCHAR(100),
    stage_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. annual_marketing_plans 테이블
CREATE TABLE IF NOT EXISTS annual_marketing_plans (
    id SERIAL PRIMARY KEY,
    year INTEGER,
    month INTEGER,
    plan_name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. bookings 테이블
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    date DATE,
    time TIME,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. quiz_results 테이블
CREATE TABLE IF NOT EXISTS quiz_results (
    id SERIAL PRIMARY KEY,
    contact_id INTEGER,
    quiz_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. 각종 뷰 생성
CREATE OR REPLACE VIEW bookings_with_quiz AS
SELECT * FROM bookings;

CREATE OR REPLACE VIEW contacts_with_quiz AS
SELECT * FROM contacts;

CREATE OR REPLACE VIEW campaign_summary AS
SELECT 
    COUNT(*) as total_campaigns,
    0 as active_campaigns,
    0 as completed_campaigns;

CREATE OR REPLACE VIEW integrated_campaign_dashboard AS
SELECT 
    2025 as year,
    7 as month,
    (SELECT COUNT(*) FROM content_ideas WHERE scheduled_date >= '2025-07-01' AND scheduled_date < '2025-08-01') as total_contents,
    (SELECT COUNT(*) FROM content_ideas WHERE platform = 'blog' AND scheduled_date >= '2025-07-01' AND scheduled_date < '2025-08-01') as blog_count,
    (SELECT COUNT(*) FROM content_ideas WHERE platform = 'kakao' AND scheduled_date >= '2025-07-01' AND scheduled_date < '2025-08-01') as kakao_count,
    (SELECT COUNT(*) FROM content_ideas WHERE platform = 'sms' AND scheduled_date >= '2025-07-01' AND scheduled_date < '2025-08-01') as sms_count,
    (SELECT COUNT(*) FROM content_ideas WHERE platform = 'instagram' AND scheduled_date >= '2025-07-01' AND scheduled_date < '2025-08-01') as instagram_count,
    (SELECT COUNT(*) FROM content_ideas WHERE platform = 'youtube' AND scheduled_date >= '2025-07-01' AND scheduled_date < '2025-08-01') as youtube_count;

-- 9. 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 10. RLS 비활성화 (테스트용)
ALTER TABLE content_ideas DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_themes DISABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;