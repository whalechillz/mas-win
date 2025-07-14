-- 🚀 멀티채널 캠페인 통합 스키마
-- 퍼널 기반 멀티채널(블로그, 카카오톡, 문자, 인스타, 페이스북 등) 지원

-- 1. 캠페인 마스터 테이블 (기존 campaigns 테이블 확장)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS funnel_stage VARCHAR(50);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_multichannel BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS parent_campaign_id UUID;

-- 2. 채널 마스터 테이블
CREATE TABLE IF NOT EXISTS marketing_channels (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'blog', 'social', 'message', 'ads'
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (category IN ('blog', 'social', 'message', 'ads', 'email', 'other'))
);

-- 기본 채널 데이터 삽입
INSERT INTO marketing_channels (code, name, category, icon) VALUES
    -- 블로그
    ('naver_blog', '네이버 블로그', 'blog', 'N'),
    ('tistory', '티스토리', 'blog', 'T'),
    ('wordpress', '워드프레스', 'blog', 'W'),
    
    -- 소셜미디어
    ('instagram', '인스타그램', 'social', '📷'),
    ('facebook', '페이스북', 'social', 'f'),
    ('youtube', '유튜브', 'social', '▶️'),
    ('youtube_shorts', '유튜브 쇼츠', 'social', '📱'),
    
    -- 메시지
    ('kakao_talk', '카카오톡', 'message', '💬'),
    ('sms', '문자메시지', 'message', '📱'),
    ('lms', '장문메시지', 'message', '📄'),
    ('mms', '멀티미디어메시지', 'message', '🖼️'),
    
    -- 광고
    ('google_ads', '구글 광고', 'ads', 'G'),
    ('naver_ads', '네이버 광고', 'ads', 'N'),
    ('kakao_moment', '카카오모먼트', 'ads', 'K'),
    ('meta_ads', '메타 광고', 'ads', 'M'),
    
    -- 이메일
    ('email', '이메일', 'email', '✉️'),
    ('newsletter', '뉴스레터', 'email', '📰')
ON CONFLICT (code) DO NOTHING;

-- 3. 캠페인 채널별 계획 테이블
CREATE TABLE IF NOT EXISTS campaign_channel_plans (
    id SERIAL PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    channel_id INTEGER NOT NULL REFERENCES marketing_channels(id),
    
    -- 계획
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    budget DECIMAL(10,2) DEFAULT 0,
    target_reach INTEGER DEFAULT 0,
    target_conversions INTEGER DEFAULT 0,
    content_count INTEGER DEFAULT 1,
    
    -- 실행 현황
    actual_budget DECIMAL(10,2) DEFAULT 0,
    actual_reach INTEGER DEFAULT 0,
    actual_conversions INTEGER DEFAULT 0,
    actual_content_count INTEGER DEFAULT 0,
    
    -- 메타데이터
    status VARCHAR(50) DEFAULT 'planned', -- planned, active, completed, cancelled
    priority INTEGER DEFAULT 5, -- 1-10
    assigned_to VARCHAR(100),
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(campaign_id, channel_id)
);

-- 4. 채널별 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS channel_contents (
    id SERIAL PRIMARY KEY,
    campaign_channel_id INTEGER NOT NULL REFERENCES campaign_channel_plans(id) ON DELETE CASCADE,
    
    title VARCHAR(500) NOT NULL,
    content TEXT,
    media_urls TEXT[], -- 이미지, 비디오 URL 배열
    
    -- 채널별 특수 필드
    channel_specific_data JSONB, -- 각 채널의 특수한 데이터
    
    -- 상태
    status VARCHAR(50) DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    
    -- 성과
    views INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 멀티채널 템플릿 (재사용 가능한 콘텐츠)
CREATE TABLE IF NOT EXISTS multichannel_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    channel_id INTEGER NOT NULL REFERENCES marketing_channels(id),
    
    template_type VARCHAR(50) NOT NULL, -- 'post', 'story', 'message', 'ad'
    template_data JSONB NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 퍼널 단계별 채널 전략
CREATE TABLE IF NOT EXISTS funnel_channel_strategies (
    id SERIAL PRIMARY KEY,
    funnel_stage_id INTEGER NOT NULL REFERENCES marketing_funnel_stages(id),
    channel_id INTEGER NOT NULL REFERENCES marketing_channels(id),
    
    is_primary BOOLEAN DEFAULT false, -- 주 채널 여부
    recommended_frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly'
    recommended_budget_ratio DECIMAL(5,2), -- 전체 예산 대비 비율
    
    content_guidelines TEXT,
    success_metrics JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(funnel_stage_id, channel_id)
);

-- 7. 퍼널 단계별 기본 채널 전략 데이터
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
    END as content_guidelines
FROM marketing_funnel_stages fs
CROSS JOIN marketing_channels mc
WHERE mc.is_active = true
ON CONFLICT DO NOTHING;

-- 8. 뷰: 캠페인별 멀티채널 현황
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

-- 9. 함수: 캠페인 생성 시 자동 멀티채널 계획 생성
CREATE OR REPLACE FUNCTION create_multichannel_plans()
RETURNS TRIGGER AS $$
BEGIN
    -- 멀티채널 캠페인인 경우
    IF NEW.is_multichannel = true AND NEW.funnel_stage IS NOT NULL THEN
        -- 퍼널 단계에 맞는 추천 채널들을 자동으로 추가
        INSERT INTO campaign_channel_plans (
            campaign_id, 
            channel_id, 
            start_date, 
            end_date, 
            budget,
            target_reach,
            content_count,
            status
        )
        SELECT 
            NEW.id,
            fcs.channel_id,
            NEW.start_date,
            NEW.end_date,
            COALESCE(NEW.budget, 0) * (fcs.recommended_budget_ratio / 100),
            CASE 
                WHEN fcs.is_primary THEN COALESCE(NEW.target_audience, 1000)
                ELSE COALESCE(NEW.target_audience, 1000) * 0.5
            END,
            CASE 
                WHEN fcs.recommended_frequency = 'daily' THEN 30
                WHEN fcs.recommended_frequency = 'weekly' THEN 4
                WHEN fcs.recommended_frequency = 'bi-weekly' THEN 2
                ELSE 1
            END,
            'planned'
        FROM funnel_channel_strategies fcs
        JOIN marketing_funnel_stages mfs ON fcs.funnel_stage_id = mfs.id
        WHERE mfs.stage_order = NEW.funnel_stage::integer
        AND fcs.is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS auto_create_multichannel_plans ON campaigns;
CREATE TRIGGER auto_create_multichannel_plans
AFTER INSERT ON campaigns
FOR EACH ROW
EXECUTE FUNCTION create_multichannel_plans();

-- 10. 인덱스 생성
CREATE INDEX idx_campaign_channel_plans_campaign ON campaign_channel_plans(campaign_id);
CREATE INDEX idx_campaign_channel_plans_status ON campaign_channel_plans(status);
CREATE INDEX idx_channel_contents_campaign ON channel_contents(campaign_channel_id);
CREATE INDEX idx_channel_contents_scheduled ON channel_contents(scheduled_at);

-- 11. 테스트용 멀티채널 캠페인 예시
INSERT INTO campaigns (
    name, 
    type, 
    status, 
    start_date, 
    end_date, 
    budget, 
    target_audience,
    funnel_stage,
    is_multichannel
) VALUES (
    '2025년 8월 신제품 출시 캠페인',
    'product_launch',
    'planned',
    '2025-08-01',
    '2025-08-31',
    5000000,
    10000,
    '2', -- 관심(Interest) 단계
    true
);