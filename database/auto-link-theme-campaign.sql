-- 🔗 월별 테마와 캠페인 자동 연결 스크립트

-- 1. marketing_campaigns 테이블에 monthly_theme_id 컬럼 추가
ALTER TABLE marketing_campaigns 
ADD COLUMN IF NOT EXISTS monthly_theme_id INTEGER REFERENCES monthly_themes(id) ON DELETE SET NULL;

-- 2. 캠페인 생성/수정 시 자동으로 월별 테마 연결하는 함수
CREATE OR REPLACE FUNCTION auto_link_campaign_to_theme()
RETURNS TRIGGER AS $$
DECLARE
    theme_id INTEGER;
BEGIN
    -- 캠페인의 년/월에 해당하는 테마 찾기
    SELECT id INTO theme_id
    FROM monthly_themes
    WHERE year = NEW.year
    AND month = NEW.month
    LIMIT 1;
    
    -- 테마가 있으면 자동 연결
    IF theme_id IS NOT NULL THEN
        NEW.monthly_theme_id = theme_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 생성
DROP TRIGGER IF EXISTS trigger_auto_link_campaign_theme ON marketing_campaigns;
CREATE TRIGGER trigger_auto_link_campaign_theme
BEFORE INSERT OR UPDATE ON marketing_campaigns
FOR EACH ROW
EXECUTE FUNCTION auto_link_campaign_to_theme();

-- 4. 기존 캠페인들에 테마 연결
UPDATE marketing_campaigns mc
SET monthly_theme_id = mt.id
FROM monthly_themes mt
WHERE mc.year = mt.year 
AND mc.month = mt.month
AND mc.monthly_theme_id IS NULL;

-- 5. 통합 대시보드 뷰 생성 (없으면)
CREATE OR REPLACE VIEW integrated_campaign_dashboard AS
SELECT 
    mt.year,
    mt.month,
    mt.theme,
    COUNT(DISTINCT mc.id) as campaign_count,
    COUNT(DISTINCT ci.id) as content_count,
    COUNT(DISTINCT CASE WHEN mc.channel = 'kakao' THEN mc.id END) as kakao_count,
    COUNT(DISTINCT CASE WHEN mc.channel = 'sms' THEN mc.id END) as sms_count,
    COUNT(DISTINCT CASE WHEN mc.channel = 'blog' THEN mc.id END) as blog_count,
    COUNT(DISTINCT CASE WHEN ci.platform NOT IN ('카카오톡', '문자', '네이버블로그') THEN ci.id END) as other_platform_count
FROM monthly_themes mt
LEFT JOIN marketing_campaigns mc ON mt.id = mc.monthly_theme_id
LEFT JOIN content_ideas ci ON 
    EXTRACT(YEAR FROM ci.scheduled_date) = mt.year AND 
    EXTRACT(MONTH FROM ci.scheduled_date) = mt.month
GROUP BY mt.year, mt.month, mt.theme;

-- 6. 월별 콘텐츠 자동 생성 함수 (없으면 생성)
CREATE OR REPLACE FUNCTION generate_monthly_content(p_year INTEGER, p_month INTEGER)
RETURNS VOID AS $$
DECLARE
    theme_record RECORD;
    start_date DATE;
    end_date DATE;
BEGIN
    -- 해당 월의 테마 가져오기
    SELECT * INTO theme_record
    FROM monthly_themes
    WHERE year = p_year AND month = p_month;
    
    IF NOT FOUND THEN
        RAISE NOTICE '해당 월의 테마가 없습니다';
        RETURN;
    END IF;
    
    -- 날짜 범위 설정
    start_date := make_date(p_year, p_month, 1);
    end_date := (start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- 기본 멀티채널 콘텐츠 생성 (없으면)
    -- 카카오톡: 월 2회
    INSERT INTO content_ideas (scheduled_date, platform, title, assignee, status, tags, is_active)
    SELECT 
        start_date + (i * 15 || ' days')::INTERVAL,
        '카카오톡',
        theme_record.theme || ' - 카카오톡 캠페인 ' || (i + 1),
        CASE i % 2 WHEN 0 THEN '제이' ELSE '스테피' END,
        'pending',
        theme_record.focus_keywords,
        true
    FROM generate_series(0, 1) i
    WHERE NOT EXISTS (
        SELECT 1 FROM content_ideas 
        WHERE platform = '카카오톡' 
        AND scheduled_date BETWEEN start_date AND end_date
    );
    
    -- 문자: 월 2회
    INSERT INTO content_ideas (scheduled_date, platform, title, assignee, status, tags, is_active)
    SELECT 
        start_date + ((i * 15) + 7 || ' days')::INTERVAL,
        '문자',
        theme_record.theme || ' - SMS 캠페인 ' || (i + 1),
        CASE i % 2 WHEN 0 THEN '나과장' ELSE '허상원' END,
        'pending',
        theme_record.focus_keywords,
        true
    FROM generate_series(0, 1) i
    WHERE NOT EXISTS (
        SELECT 1 FROM content_ideas 
        WHERE platform = '문자' 
        AND scheduled_date BETWEEN start_date AND end_date
    );
    
    -- 네이버 블로그: 주 3회
    INSERT INTO content_ideas (scheduled_date, platform, title, assignee, status, tags, is_active)
    SELECT 
        start_date + ((i DIV 3) * 7 + (i % 3) * 2 || ' days')::INTERVAL,
        '네이버블로그',
        theme_record.theme || ' - 블로그 포스트 ' || (i + 1),
        CASE i % 4 
            WHEN 0 THEN '제이' 
            WHEN 1 THEN '스테피' 
            WHEN 2 THEN '나과장' 
            ELSE '허상원' 
        END,
        'pending',
        theme_record.focus_keywords,
        true
    FROM generate_series(0, 11) i
    WHERE NOT EXISTS (
        SELECT 1 FROM content_ideas 
        WHERE platform = '네이버블로그' 
        AND scheduled_date BETWEEN start_date AND end_date
    );
    
END;
$$ LANGUAGE plpgsql;

-- 7. 연간 테마 현황 확인
SELECT 
    year,
    COUNT(*) as total_months,
    STRING_AGG(month::text || '월: ' || theme, ', ' ORDER BY month) as themes
FROM monthly_themes
GROUP BY year
ORDER BY year;