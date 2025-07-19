-- 🎯 마케팅 대시보드 스키마 - 실제 테이블 구조에 맞춘 버전

-- ======================================
-- STEP 1: marketing_funnel_stages 테이블 수정
-- ======================================
-- 1-1. stage_order 컬럼 추가
ALTER TABLE marketing_funnel_stages 
ADD COLUMN IF NOT EXISTS stage_order INTEGER;

-- 1-2. description 컬럼 추가
ALTER TABLE marketing_funnel_stages 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 1-3. target_metrics 컬럼 추가
ALTER TABLE marketing_funnel_stages 
ADD COLUMN IF NOT EXISTS target_metrics JSONB;

-- 1-4. created_at 컬럼 추가
ALTER TABLE marketing_funnel_stages 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 1-5. 기존 데이터가 있다면 stage_order 업데이트
UPDATE marketing_funnel_stages 
SET stage_order = id
WHERE stage_order IS NULL AND id IS NOT NULL;

-- 1-6. 기본 퍼널 단계 데이터 삽입 (id 기준)
INSERT INTO marketing_funnel_stages (id, stage_name, stage_order, description)
VALUES 
    (1, '인지 (Awareness)', 1, '브랜드와 제품을 처음 접하는 단계'),
    (2, '관심 (Interest)', 2, '제품에 대한 관심을 갖는 단계'),
    (3, '결정 (Decision)', 3, '구매를 고려하고 비교하는 단계'),
    (4, '행동 (Action)', 4, '실제 구매가 일어나는 단계')
ON CONFLICT (id) DO UPDATE 
SET 
    stage_name = EXCLUDED.stage_name,
    stage_order = EXCLUDED.stage_order,
    description = EXCLUDED.description;

-- ======================================
-- STEP 2: campaigns 테이블 (없으면 생성)
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
    
    -- 성과 지표
    views INTEGER DEFAULT 0,
    bookings INTEGER DEFAULT 0,
    inquiries INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    roi DECIMAL(5,2) DEFAULT 0,
    cost_per_acquisition DECIMAL(10,2) DEFAULT 0,
    
    -- 파일 및 URL
    landing_page_file TEXT,
    landing_page_url TEXT,
    op_manual_url TEXT,
    google_ads_url TEXT,
    
    -- 설정
    phone_number VARCHAR(20),
    event_date DATE,
    remaining_slots INTEGER,
    discount_rate INTEGER,
    
    -- 추가 필드
    monthly_theme_id INTEGER,
    funnel_stage VARCHAR(50),
    is_multichannel BOOLEAN DEFAULT false,
    parent_campaign_id TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================
-- STEP 3: monthly_themes 테이블
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
-- STEP 4: marketing_channels 테이블
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

-- 기본 채널 데이터 삽입
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
-- STEP 5: campaign_channel_plans 테이블
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

-- ======================================
-- STEP 6: channel_contents 테이블
-- ======================================
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

-- ======================================
-- STEP 7: multichannel_templates 테이블
-- ======================================
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

-- ======================================
-- STEP 8: funnel_channel_strategies 테이블
-- ======================================
-- marketing_funnel_stages의 id가 INTEGER이므로 참조 타입 수정
CREATE TABLE IF NOT EXISTS funnel_channel_strategies (
    id SERIAL PRIMARY KEY,
    funnel_stage_id INTEGER NOT NULL REFERENCES marketing_funnel_stages(id),  -- INTEGER로 변경
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
-- STEP 9: 퍼널 전략 데이터 삽입
-- ======================================
-- marketing_funnel_stages에 stage_order가 있는 경우만 삽입
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
    END as is_primary,
    CASE 
        WHEN fs.stage_order = 1 THEN 'weekly'
        WHEN fs.stage_order = 2 THEN 'bi-weekly'
        WHEN fs.stage_order = 3 THEN 'monthly'
        WHEN fs.stage_order = 4 THEN 'quarterly'
        ELSE 'monthly'
    END as recommended_frequency,
    CASE 
        WHEN fs.stage_order = 1 AND mc.category = 'blog' THEN 30.00
        WHEN fs.stage_order = 1 AND mc.category = 'social' THEN 20.00
        WHEN fs.stage_order = 2 AND mc.category = 'message' THEN 25.00
        WHEN fs.stage_order = 3 AND mc.category = 'message' THEN 15.00
        WHEN fs.stage_order = 4 AND mc.category = 'message' THEN 10.00
        ELSE 5.00
    END as recommended_budget_ratio,
    CASE 
        WHEN fs.stage_order = 1 THEN '인지도 향상을 위한 정보성 콘텐츠'
        WHEN fs.stage_order = 2 THEN '관심 유발을 위한 혜택 및 이벤트 정보'
        WHEN fs.stage_order = 3 THEN '구매 유도를 위한 상세 정보 및 후기'
        WHEN fs.stage_order = 4 THEN '재구매 유도 및 로열티 프로그램'
        ELSE '일반 마케팅 콘텐츠'
    END as content_guidelines
FROM marketing_funnel_stages fs
CROSS JOIN marketing_channels mc
WHERE mc.is_active = true
AND fs.stage_order IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM funnel_channel_strategies 
    WHERE funnel_stage_id = fs.id AND channel_id = mc.id
);

-- ======================================
-- STEP 10: 뷰 생성
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
-- STEP 11: 인덱스 생성
-- ======================================
CREATE INDEX IF NOT EXISTS idx_campaign_channel_plans_campaign ON campaign_channel_plans(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_channel_plans_status ON campaign_channel_plans(status);
CREATE INDEX IF NOT EXISTS idx_channel_contents_campaign ON channel_contents(campaign_channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_contents_scheduled ON channel_contents(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_multichannel ON campaigns(is_multichannel);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);

-- ======================================
-- STEP 12: 샘플 데이터
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
-- STEP 13: 최종 확인
-- ======================================
SELECT 
    table_name,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ 생성 완료 (' || COUNT(*) || '개 레코드)'
        ELSE '⚠️  테이블은 있으나 데이터 없음'
    END as status
FROM (
    SELECT 'campaigns' as table_name, COUNT(*) as count FROM campaigns
    UNION ALL
    SELECT 'marketing_channels', COUNT(*) FROM marketing_channels
    UNION ALL
    SELECT 'marketing_funnel_stages', COUNT(*) FROM marketing_funnel_stages WHERE stage_order IS NOT NULL
    UNION ALL
    SELECT 'monthly_themes', COUNT(*) FROM monthly_themes
    UNION ALL
    SELECT 'funnel_channel_strategies', COUNT(*) FROM funnel_channel_strategies
) t
GROUP BY table_name, count
ORDER BY table_name;