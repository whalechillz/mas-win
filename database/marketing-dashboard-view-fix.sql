-- 🔍 마케팅 대시보드 - 실제 데이터베이스 구조 확인 및 수정

-- ======================================
-- STEP 1: 현재 구조 확인
-- ======================================
-- 1-1. marketing_funnel_stages가 뷰인지 확인
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE viewname = 'marketing_funnel_stages';

-- 1-2. 뷰가 참조하는 실제 테이블 찾기
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name LIKE '%funnel%' OR table_name LIKE '%stage%')
ORDER BY table_name;

-- ======================================
-- STEP 2: 실제 테이블 구조에 맞춰 진행
-- ======================================

-- 옵션 A: 뷰를 삭제하고 테이블로 재생성 (데이터 손실 주의!)
/*
DROP VIEW IF EXISTS marketing_funnel_stages CASCADE;

CREATE TABLE marketing_funnel_stages (
    id SERIAL PRIMARY KEY,
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL UNIQUE,
    description TEXT,
    target_metrics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 데이터 삽입
INSERT INTO marketing_funnel_stages (stage_name, stage_order, description)
VALUES 
    ('인지 (Awareness)', 1, '브랜드와 제품을 처음 접하는 단계'),
    ('관심 (Interest)', 2, '제품에 대한 관심을 갖는 단계'),
    ('결정 (Decision)', 3, '구매를 고려하고 비교하는 단계'),
    ('행동 (Action)', 4, '실제 구매가 일어나는 단계');
*/

-- 옵션 B: 새로운 테이블 이름으로 생성
CREATE TABLE IF NOT EXISTS marketing_funnel_stages_new (
    id SERIAL PRIMARY KEY,
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL UNIQUE,
    description TEXT,
    target_metrics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 기본 데이터 삽입
INSERT INTO marketing_funnel_stages_new (stage_name, stage_order, description)
VALUES 
    ('인지 (Awareness)', 1, '브랜드와 제품을 처음 접하는 단계'),
    ('관심 (Interest)', 2, '제품에 대한 관심을 갖는 단계'),
    ('결정 (Decision)', 3, '구매를 고려하고 비교하는 단계'),
    ('행동 (Action)', 4, '실제 구매가 일어나는 단계')
ON CONFLICT (stage_order) DO NOTHING;

-- ======================================
-- STEP 3: campaigns 테이블 (없으면 생성)
-- ======================================
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    status VARCHAR(50) DEFAULT 'planned',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    target_audience VARCHAR(200),
    budget DECIMAL(10,2) DEFAULT 0,
    views INTEGER DEFAULT 0,
    bookings INTEGER DEFAULT 0,
    inquiries INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    roi DECIMAL(5,2) DEFAULT 0,
    cost_per_acquisition DECIMAL(10,2) DEFAULT 0,
    landing_page_file TEXT,
    landing_page_url TEXT,
    op_manual_url TEXT,
    google_ads_url TEXT,
    phone_number VARCHAR(20),
    event_date DATE,
    remaining_slots INTEGER,
    discount_rate INTEGER,
    monthly_theme_id INTEGER,
    funnel_stage VARCHAR(50),
    is_multichannel BOOLEAN DEFAULT false,
    parent_campaign_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================
-- STEP 4: monthly_themes 테이블
-- ======================================
CREATE TABLE IF NOT EXISTS monthly_themes (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    theme VARCHAR(200) NOT NULL,
    description TEXT,
    target_audience VARCHAR(200),
    promotion_details TEXT,
    focus_keywords TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);

-- ======================================
-- STEP 5: marketing_channels 테이블
-- ======================================
CREATE TABLE IF NOT EXISTS marketing_channels (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (category IN ('blog', 'social', 'message', 'ads', 'email', 'other'))
);

-- 기본 채널 데이터
INSERT INTO marketing_channels (code, name, category, icon) 
VALUES
    ('naver_blog', '네이버 블로그', 'blog', 'N'),
    ('tistory', '티스토리', 'blog', 'T'),
    ('wordpress', '워드프레스', 'blog', 'W'),
    ('instagram', '인스타그램', 'social', '📷'),
    ('facebook', '페이스북', 'social', 'f'),
    ('youtube', '유튜브', 'social', '▶️'),
    ('youtube_shorts', '유튜브 쇼츠', 'social', '📱'),
    ('kakao_talk', '카카오톡', 'message', '💬'),
    ('sms', '문자메시지', 'message', '📱'),
    ('lms', '장문메시지', 'message', '📄'),
    ('mms', '멀티미디어메시지', 'message', '🖼️'),
    ('google_ads', '구글 광고', 'ads', 'G'),
    ('naver_ads', '네이버 광고', 'ads', 'N'),
    ('kakao_moment', '카카오모먼트', 'ads', 'K'),
    ('meta_ads', '메타 광고', 'ads', 'M'),
    ('email', '이메일', 'email', '✉️'),
    ('newsletter', '뉴스레터', 'email', '📰')
ON CONFLICT (code) DO NOTHING;

-- ======================================
-- STEP 6: 나머지 테이블들
-- ======================================
CREATE TABLE IF NOT EXISTS campaign_channel_plans (
    id SERIAL PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    channel_id INTEGER NOT NULL REFERENCES marketing_channels(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(10,2) DEFAULT 0,
    target_reach INTEGER DEFAULT 0,
    target_conversions INTEGER DEFAULT 0,
    content_count INTEGER DEFAULT 1,
    actual_budget DECIMAL(10,2) DEFAULT 0,
    actual_reach INTEGER DEFAULT 0,
    actual_conversions INTEGER DEFAULT 0,
    actual_content_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'planned',
    priority INTEGER DEFAULT 5,
    assigned_to VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, channel_id)
);

CREATE TABLE IF NOT EXISTS channel_contents (
    id SERIAL PRIMARY KEY,
    campaign_channel_id INTEGER NOT NULL REFERENCES campaign_channel_plans(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    media_urls TEXT[],
    channel_specific_data JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS multichannel_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    channel_id INTEGER NOT NULL REFERENCES marketing_channels(id),
    template_type VARCHAR(50) NOT NULL,
    template_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- funnel_channel_strategies 테이블 (새로운 테이블 참조)
CREATE TABLE IF NOT EXISTS funnel_channel_strategies (
    id SERIAL PRIMARY KEY,
    funnel_stage_id INTEGER NOT NULL REFERENCES marketing_funnel_stages_new(id),
    channel_id INTEGER NOT NULL REFERENCES marketing_channels(id),
    is_primary BOOLEAN DEFAULT false,
    recommended_frequency VARCHAR(50),
    recommended_budget_ratio DECIMAL(5,2),
    content_guidelines TEXT,
    success_metrics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(funnel_stage_id, channel_id)
);

-- ======================================
-- STEP 7: 전략 데이터 삽입
-- ======================================
INSERT INTO funnel_channel_strategies (funnel_stage_id, channel_id, is_primary, recommended_frequency, recommended_budget_ratio, content_guidelines)
SELECT 
    fs.id,
    mc.id,
    CASE 
        WHEN fs.stage_order = 1 AND mc.code IN ('naver_blog', 'instagram', 'facebook') THEN true
        WHEN fs.stage_order = 2 AND mc.code IN ('kakao_talk', 'email') THEN true
        WHEN fs.stage_order = 3 AND mc.code IN ('sms', 'kakao_talk') THEN true
        WHEN fs.stage_order = 4 AND mc.code IN ('kakao_talk', 'sms') THEN true
        ELSE false
    END,
    CASE 
        WHEN fs.stage_order = 1 THEN 'weekly'
        WHEN fs.stage_order = 2 THEN 'bi-weekly'
        WHEN fs.stage_order = 3 THEN 'monthly'
        WHEN fs.stage_order = 4 THEN 'quarterly'
    END,
    CASE 
        WHEN fs.stage_order = 1 AND mc.category = 'blog' THEN 30.00
        WHEN fs.stage_order = 1 AND mc.category = 'social' THEN 20.00
        WHEN fs.stage_order = 2 AND mc.category = 'message' THEN 25.00
        WHEN fs.stage_order = 3 AND mc.category = 'message' THEN 15.00
        WHEN fs.stage_order = 4 AND mc.category = 'message' THEN 10.00
        ELSE 5.00
    END,
    CASE 
        WHEN fs.stage_order = 1 THEN '인지도 향상을 위한 정보성 콘텐츠'
        WHEN fs.stage_order = 2 THEN '관심 유발을 위한 혜택 및 이벤트 정보'
        WHEN fs.stage_order = 3 THEN '구매 유도를 위한 상세 정보 및 후기'
        WHEN fs.stage_order = 4 THEN '재구매 유도 및 로열티 프로그램'
    END
FROM marketing_funnel_stages_new fs
CROSS JOIN marketing_channels mc
WHERE mc.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM funnel_channel_strategies 
    WHERE funnel_stage_id = fs.id AND channel_id = mc.id
);

-- ======================================
-- STEP 8: 뷰 생성
-- ======================================
CREATE OR REPLACE VIEW campaign_multichannel_status AS
SELECT 
    c.id as campaign_id,
    c.name as campaign_name,
    c.funnel_stage,
    mc.name as channel_name,
    mc.category as channel_category,
    ccp.status,
    ccp.budget,
    ccp.actual_budget,
    ccp.target_reach,
    ccp.actual_reach,
    ccp.content_count as planned_contents,
    ccp.actual_content_count,
    CASE 
        WHEN ccp.target_reach > 0 THEN 
            ROUND((ccp.actual_reach::numeric / ccp.target_reach) * 100, 2)
        ELSE 0 
    END as reach_achievement_rate
FROM campaigns c
LEFT JOIN campaign_channel_plans ccp ON c.id = ccp.campaign_id
LEFT JOIN marketing_channels mc ON ccp.channel_id = mc.id
WHERE c.is_multichannel = true
ORDER BY c.start_date DESC, mc.category, mc.name;

CREATE OR REPLACE VIEW monthly_marketing_plan AS
SELECT 
    year,
    month,
    CASE month
        WHEN 1 THEN '1월'
        WHEN 2 THEN '2월'
        WHEN 3 THEN '3월'
        WHEN 4 THEN '4월'
        WHEN 5 THEN '5월'
        WHEN 6 THEN '6월'
        WHEN 7 THEN '7월'
        WHEN 8 THEN '8월'
        WHEN 9 THEN '9월'
        WHEN 10 THEN '10월'
        WHEN 11 THEN '11월'
        WHEN 12 THEN '12월'
    END as month_name,
    theme,
    description,
    target_audience,
    promotion_details,
    focus_keywords
FROM monthly_themes
ORDER BY year, month;

-- ======================================
-- STEP 9: 샘플 데이터
-- ======================================
INSERT INTO monthly_themes (year, month, theme, description, target_audience, promotion_details, focus_keywords)
VALUES (
    2025, 
    7, 
    '여름 휴가철 특별 프로모션',
    '무더운 여름, 시원한 골프장에서 즐기는 특별한 휴가',
    '가족 단위 고객, 직장인',
    '평일 30% 할인, 주말 20% 할인, 4인 이상 단체 추가 10% 할인',
    ARRAY['여름골프', '휴가철골프', '골프장할인', '가족골프']
) ON CONFLICT (year, month) DO NOTHING;

-- ======================================
-- STEP 10: 인덱스 생성
-- ======================================
CREATE INDEX IF NOT EXISTS idx_campaign_channel_plans_campaign ON campaign_channel_plans(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_channel_plans_status ON campaign_channel_plans(status);
CREATE INDEX IF NOT EXISTS idx_channel_contents_campaign ON channel_contents(campaign_channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_contents_scheduled ON channel_contents(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_multichannel ON campaigns(is_multichannel);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);

-- ======================================
-- STEP 11: 최종 확인
-- ======================================
SELECT 
    'campaigns' as table_name,
    EXISTS(SELECT 1 FROM campaigns) as has_data,
    COUNT(*) as row_count
FROM campaigns
UNION ALL
SELECT 
    'marketing_channels',
    EXISTS(SELECT 1 FROM marketing_channels),
    COUNT(*)
FROM marketing_channels
UNION ALL
SELECT 
    'marketing_funnel_stages_new',
    EXISTS(SELECT 1 FROM marketing_funnel_stages_new),
    COUNT(*)
FROM marketing_funnel_stages_new
UNION ALL
SELECT 
    'monthly_themes',
    EXISTS(SELECT 1 FROM monthly_themes),
    COUNT(*)
FROM monthly_themes;