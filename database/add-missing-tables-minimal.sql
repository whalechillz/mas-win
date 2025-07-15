-- 기존 테이블을 최대한 활용하고 꼭 필요한 것만 추가
-- Supabase SQL Editor에서 실행

-- 1. content_categories 테이블만 생성 (에러 해결용)
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

-- 2. bookings 테이블 (quiz_results는 이미 있음)
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    date DATE,
    time TIME,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. bookings_with_quiz 뷰 (quiz_results 연결)
CREATE OR REPLACE VIEW bookings_with_quiz AS
SELECT 
    b.*,
    qr.quiz_data
FROM bookings b
LEFT JOIN quiz_results qr ON qr.contact_id = b.id;

-- 4. 선택적: 나머지 뷰들 (에러 방지용)
CREATE OR REPLACE VIEW marketing_funnel_stages AS
SELECT 
    1 as id,
    'Awareness' as stage_name,
    1 as stage_order
UNION ALL
SELECT 2, 'Interest', 2
UNION ALL
SELECT 3, 'Decision', 3
UNION ALL
SELECT 4, 'Action', 4;

CREATE OR REPLACE VIEW annual_marketing_plans AS
SELECT 
    mt.id,
    mt.year,
    mt.month,
    mt.theme as plan_name,
    mt.description
FROM monthly_themes mt;

-- 5. 권한 설정
GRANT ALL ON content_categories TO anon, authenticated;
GRANT ALL ON bookings TO anon, authenticated;
GRANT USAGE ON SEQUENCE content_categories_id_seq TO anon, authenticated;
GRANT USAGE ON SEQUENCE bookings_id_seq TO anon, authenticated;