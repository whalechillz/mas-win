-- 🔗 통합 캠페인 - 멀티채널 연동 시스템

-- 1. 캠페인-콘텐츠 연결 테이블 생성
CREATE TABLE IF NOT EXISTS campaign_content_mapping (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 월별 콘텐츠 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_monthly_content(
    p_year INTEGER,
    p_month INTEGER
) RETURNS void AS $$
DECLARE
    v_theme RECORD;
    v_campaign RECORD;
    v_date DATE;
    v_week_start DATE;
    v_content_id UUID;
BEGIN
    -- 해당 월의 테마 가져오기
    SELECT * INTO v_theme 
    FROM monthly_themes 
    WHERE year = p_year AND month = p_month;
    
    IF NOT FOUND THEN
        RAISE NOTICE '테마가 없습니다: %년 %월', p_year, p_month;
        RETURN;
    END IF;
    
    -- 월의 시작일
    v_date := DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01');
    
    -- 1. 카카오톡/문자 캠페인 (월 2회: 첫째주, 셋째주)
    FOR i IN 1..2 LOOP
        -- 카카오톡
        INSERT INTO content_ideas (
            title, 
            platform, 
            content,
            scheduled_date,
            status,
            tags,
            assignee,
            topic
        ) VALUES (
            v_theme.theme || ' - 카카오톡 ' || i || '차',
            '카카오톡',
            COALESCE(v_theme.description, '') || ' - ' || COALESCE(v_theme.promotion_details, ''),
            v_date + ((i-1) * 14),
            'draft',
            ARRAY['카카오톡', '월간캠페인', p_month::TEXT || '월'],
            '제이',
            v_theme.theme
        );
        
        -- 문자
        INSERT INTO content_ideas (
            title, 
            platform, 
            content,
            scheduled_date,
            status,
            tags,
            assignee,
            topic
        ) VALUES (
            v_theme.theme || ' - 문자 ' || i || '차',
            '문자',
            '고객님을 위한 ' || p_month || '월 특별 혜택! ' || COALESCE(LEFT(v_theme.promotion_details, 50), ''),
            v_date + ((i-1) * 14) + 1,
            'draft',
            ARRAY['문자', '월간캠페인', p_month::TEXT || '월'],
            '제이',
            v_theme.theme
        );
    END LOOP;
    
    -- 2. 네이버 블로그 (주 3회 x 3개 계정 = 주 9개)
    v_week_start := v_date;
    WHILE v_week_start < (v_date + INTERVAL '1 month') LOOP
        -- 월요일 발행
        INSERT INTO content_ideas (title, platform, scheduled_date, status, assignee, topic) VALUES
        (v_theme.theme || ' - mas9golf 주간포스트', '네이버블로그', v_week_start, 'draft', '제이', v_theme.theme),
        (v_theme.theme || ' - massgoogolf 주간포스트', '네이버블로그', v_week_start, 'draft', '스테피', v_theme.theme),
        (v_theme.theme || ' - massgoogolfkorea 주간포스트', '네이버블로그', v_week_start, 'draft', '허상원', v_theme.theme);
        
        -- 수요일 발행
        INSERT INTO content_ideas (title, platform, scheduled_date, status, assignee, topic) VALUES
        (v_theme.theme || ' 관련 팁 - mas9golf', '네이버블로그', v_week_start + 2, 'draft', '제이', v_theme.theme),
        (v_theme.theme || ' 활용법 - massgoogolf', '네이버블로그', v_week_start + 2, 'draft', '스테피', v_theme.theme),
        (v_theme.theme || ' 리뷰 - massgoogolfkorea', '네이버블로그', v_week_start + 2, 'draft', '나과장', v_theme.theme);
        
        -- 금요일 발행
        INSERT INTO content_ideas (title, platform, scheduled_date, status, assignee, topic) VALUES
        (v_theme.theme || ' 주말특집 - mas9golf', '네이버블로그', v_week_start + 4, 'draft', '제이', v_theme.theme),
        (v_theme.theme || ' 이벤트 - massgoogolf', '네이버블로그', v_week_start + 4, 'draft', '스테피', v_theme.theme),
        (v_theme.theme || ' 소식 - massgoogolfkorea', '네이버블로그', v_week_start + 4, 'draft', '허상원', v_theme.theme);
        
        v_week_start := v_week_start + INTERVAL '7 days';
    END LOOP;
    
    -- 3. 자사 블로그 (주 3회)
    v_week_start := v_date;
    WHILE v_week_start < (v_date + INTERVAL '1 month') LOOP
        INSERT INTO content_ideas (title, platform, scheduled_date, status, assignee, topic) VALUES
        (v_theme.theme || ' - 자사블로그 월요일', '자사블로그', v_week_start, 'draft', '나과장', v_theme.theme),
        (v_theme.theme || ' - 자사블로그 수요일', '자사블로그', v_week_start + 2, 'draft', '나과장', v_theme.theme),
        (v_theme.theme || ' - 자사블로그 금요일', '자사블로그', v_week_start + 4, 'draft', '나과장', v_theme.theme);
        
        v_week_start := v_week_start + INTERVAL '7 days';
    END LOOP;
    
    -- 4. 기타 플랫폼 (인스타그램, 유튜브 등 - 주 2회)
    v_week_start := v_date;
    WHILE v_week_start < (v_date + INTERVAL '1 month') LOOP
        -- 인스타그램
        INSERT INTO content_ideas (title, platform, scheduled_date, status, assignee, topic) VALUES
        (v_theme.theme || ' - 인스타 화요일', '인스타그램', v_week_start + 1, 'draft', '스테피', v_theme.theme),
        (v_theme.theme || ' - 인스타 목요일', '인스타그램', v_week_start + 3, 'draft', '스테피', v_theme.theme);
        
        -- 유튜브 (월 2회)
        IF EXTRACT(DAY FROM v_week_start) <= 7 OR 
           EXTRACT(DAY FROM v_week_start) BETWEEN 15 AND 21 THEN
            INSERT INTO content_ideas (title, platform, scheduled_date, status, assignee, topic) VALUES
            (v_theme.theme || ' - 유튜브 콘텐츠', '유튜브', v_week_start + 5, 'draft', '제이', v_theme.theme);
        END IF;
        
        v_week_start := v_week_start + INTERVAL '7 days';
    END LOOP;
    
    RAISE NOTICE '% 년 % 월 콘텐츠 생성 완료', p_year, p_month;
END;
$$ LANGUAGE plpgsql;

-- 3. 캠페인 생성 시 자동으로 콘텐츠 생성하는 트리거
CREATE OR REPLACE FUNCTION auto_generate_content_on_campaign()
RETURNS TRIGGER AS $$
BEGIN
    -- 새 캠페인이 생성되면 해당 월의 콘텐츠 자동 생성
    IF TG_OP = 'INSERT' THEN
        PERFORM generate_monthly_content(NEW.year, NEW.month);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_content ON marketing_campaigns;
CREATE TRIGGER trigger_auto_content
AFTER INSERT ON marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION auto_generate_content_on_campaign();

-- 4. 통합 대시보드 뷰 생성
CREATE OR REPLACE VIEW integrated_campaign_dashboard AS
WITH monthly_stats AS (
    SELECT 
        mt.year,
        mt.month,
        mt.theme,
        mt.description,
        mt.promotion_details,
        COUNT(DISTINCT mc.id) as campaign_count,
        COUNT(DISTINCT ci.id) as content_count,
        COUNT(DISTINCT CASE WHEN ci.platform = '카카오톡' THEN ci.id END) as kakao_count,
        COUNT(DISTINCT CASE WHEN ci.platform = '문자' THEN ci.id END) as sms_count,
        COUNT(DISTINCT CASE WHEN ci.platform = '네이버블로그' THEN ci.id END) as blog_count,
        COUNT(DISTINCT CASE WHEN ci.platform = '자사블로그' THEN ci.id END) as company_blog_count,
        COUNT(DISTINCT CASE WHEN ci.platform IN ('인스타그램', '유튜브', '카카오채널', '틱톡') THEN ci.id END) as other_platform_count
    FROM monthly_themes mt
    LEFT JOIN marketing_campaigns mc ON mc.year = mt.year AND mc.month = mt.month
    LEFT JOIN content_ideas ci ON ci.topic = mt.theme 
        AND EXTRACT(YEAR FROM ci.scheduled_date) = mt.year 
        AND EXTRACT(MONTH FROM ci.scheduled_date) = mt.month
    GROUP BY mt.year, mt.month, mt.theme, mt.description, mt.promotion_details
)
SELECT 
    year,
    month,
    theme,
    description,
    promotion_details,
    campaign_count,
    content_count,
    kakao_count,
    sms_count,
    blog_count,
    company_blog_count,
    other_platform_count,
    CASE 
        WHEN content_count = 0 THEN '미생성'
        WHEN content_count < 20 THEN '부족'
        ELSE '완료'
    END as content_status
FROM monthly_stats
ORDER BY year, month;

-- 5. 2025년 7월 데이터 자동 생성 (테스트)
-- SELECT generate_monthly_content(2025, 7);

-- 6. 기존 캠페인과 콘텐츠 연결
INSERT INTO campaign_content_mapping (campaign_id, content_id)
SELECT 
    mc.id as campaign_id,
    ci.id as content_id
FROM marketing_campaigns mc
JOIN content_ideas ci ON ci.topic = mc.topic
    AND EXTRACT(YEAR FROM ci.scheduled_date) = mc.year
    AND EXTRACT(MONTH FROM ci.scheduled_date) = mc.month
WHERE NOT EXISTS (
    SELECT 1 FROM campaign_content_mapping ccm 
    WHERE ccm.campaign_id = mc.id AND ccm.content_id = ci.id
);

-- 7. 콘텐츠 발행 현황 뷰
CREATE OR REPLACE VIEW content_publishing_schedule AS
SELECT 
    DATE(scheduled_date) as publish_date,
    platform,
    COUNT(*) as content_count,
    STRING_AGG(assignee, ', ' ORDER BY assignee) as assignees,
    STRING_AGG(title, '; ' ORDER BY title) as titles
FROM content_ideas
WHERE scheduled_date IS NOT NULL
GROUP BY DATE(scheduled_date), platform
ORDER BY publish_date, platform;

-- 8. 권한 설정
GRANT ALL ON campaign_content_mapping TO authenticated;
GRANT ALL ON integrated_campaign_dashboard TO authenticated;
GRANT ALL ON content_publishing_schedule TO authenticated;