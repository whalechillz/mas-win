-- 누락된 테이블/뷰 생성 스크립트
-- Supabase SQL Editor에서 실행

-- 1. blog_contents 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS blog_contents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    platform_id INTEGER,
    category_id INTEGER,
    scheduled_date DATE,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. integrated_campaign_dashboard 뷰 생성
CREATE OR REPLACE VIEW integrated_campaign_dashboard AS
SELECT 
    EXTRACT(YEAR FROM scheduled_date)::INTEGER as year,
    EXTRACT(MONTH FROM scheduled_date)::INTEGER as month,
    COUNT(*) as total_contents,
    COUNT(CASE WHEN platform = 'blog' THEN 1 END) as blog_count,
    COUNT(CASE WHEN platform = 'kakao' THEN 1 END) as kakao_count,
    COUNT(CASE WHEN platform = 'sms' THEN 1 END) as sms_count,
    COUNT(CASE WHEN platform = 'instagram' THEN 1 END) as instagram_count,
    COUNT(CASE WHEN platform = 'youtube' THEN 1 END) as youtube_count
FROM content_ideas
WHERE status != 'deleted'
GROUP BY year, month;

-- 3. campaign_summary 뷰 생성
CREATE OR REPLACE VIEW campaign_summary AS
SELECT 
    COUNT(*) as total_campaigns,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_campaigns
FROM marketing_campaigns;

-- 4. bookings 테이블이 없다면 생성
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

-- 5. annual_marketing_plans 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS annual_marketing_plans (
    id SERIAL PRIMARY KEY,
    year INTEGER,
    month INTEGER,
    plan_name VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. content_categories 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS content_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. blog_platforms 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS blog_platforms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. team_members 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    role VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. marketing_funnel_stages 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS marketing_funnel_stages (
    id SERIAL PRIMARY KEY,
    stage_name VARCHAR(100),
    stage_order INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 10. contacts_with_quiz 뷰 생성
CREATE OR REPLACE VIEW contacts_with_quiz AS
SELECT * FROM contacts;

-- 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;