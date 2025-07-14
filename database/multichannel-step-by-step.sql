-- 📝 단계별 실행 가이드

-- 1단계: 테이블 타입 확인
SELECT 
    table_name,
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name IN ('marketing_funnel_stages', 'campaigns', 'marketing_channels')
AND column_name = 'id'
ORDER BY table_name;

-- 2단계: 캠페인 테이블 확장
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS funnel_stage VARCHAR(50);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_multichannel BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS parent_campaign_id TEXT;

-- 3단계: marketing_channels 테이블 생성 (이미 있다면 스킵)
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

-- 4단계: 채널 데이터 삽입
INSERT INTO marketing_channels (code, name, category, icon) 
SELECT * FROM (VALUES
    ('naver_blog', '네이버 블로그', 'blog', 'N'),
    ('instagram', '인스타그램', 'social', '📷'),
    ('kakao_talk', '카카오톡', 'message', '💬'),
    ('youtube', '유튜브', 'social', '▶️')
) AS t(code, name, category, icon)
WHERE NOT EXISTS (
    SELECT 1 FROM marketing_channels WHERE code = t.code
);

-- 5단계: campaign_channel_plans 테이블 생성
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

-- 6단계: channel_contents 테이블 생성
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

-- 7단계: 뷰 생성
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

-- 8단계: 테스트 - 7월 캠페인에 멀티채널 설정
UPDATE campaigns 
SET is_multichannel = true 
WHERE name LIKE '%2025%7%' OR name LIKE '%7월%';

-- 9단계: 7월 캠페인에 채널 계획 추가 테스트
INSERT INTO campaign_channel_plans (
    campaign_id,
    channel_id,
    start_date,
    end_date,
    budget,
    target_reach,
    content_count,
    status,
    assigned_to
)
SELECT 
    c.id,
    mc.id,
    c.start_date,
    c.end_date,
    CASE 
        WHEN mc.code = 'naver_blog' THEN 1000000
        WHEN mc.code = 'instagram' THEN 500000
        WHEN mc.code = 'kakao_talk' THEN 300000
    END as budget,
    CASE 
        WHEN mc.code = 'naver_blog' THEN 5000
        WHEN mc.code = 'instagram' THEN 3000
        WHEN mc.code = 'kakao_talk' THEN 10000
    END as target_reach,
    CASE 
        WHEN mc.code = 'naver_blog' THEN 8
        WHEN mc.code = 'instagram' THEN 12
        WHEN mc.code = 'kakao_talk' THEN 4
    END as content_count,
    'planned',
    CASE 
        WHEN mc.code = 'naver_blog' THEN '제이'
        WHEN mc.code = 'instagram' THEN '스테피'
        WHEN mc.code = 'kakao_talk' THEN '허상원'
    END as assigned_to
FROM campaigns c
CROSS JOIN marketing_channels mc
WHERE (c.name LIKE '%2025%7%' OR c.name LIKE '%7월%')
AND mc.code IN ('naver_blog', 'instagram', 'kakao_talk')
AND NOT EXISTS (
    SELECT 1 FROM campaign_channel_plans 
    WHERE campaign_id = c.id AND channel_id = mc.id
);

-- 10단계: 결과 확인
SELECT * FROM campaign_multichannel_status;