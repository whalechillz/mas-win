-- 🚨 통합 캠페인 시스템 설치 순서 (중요!)

-- =====================================
-- STEP 1: 테이블 구조 수정 (가장 먼저!)
-- =====================================

-- 1-1. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1-2. monthly_themes 테이블 컬럼 추가
ALTER TABLE monthly_themes 
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS promotion_detail TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS promotion_details TEXT,
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(200),
ADD COLUMN IF NOT EXISTS focus_keywords TEXT[];

-- 1-3. marketing_campaigns 테이블 확인/생성
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  channel TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  target_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  click_rate DECIMAL(5,2),
  assignee TEXT,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1-4. blog_schedule 테이블 생성
CREATE TABLE IF NOT EXISTS blog_schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES marketing_campaigns(id),
  date DATE NOT NULL,
  account TEXT NOT NULL,
  topic TEXT NOT NULL,
  title TEXT,
  content TEXT,
  naver_url TEXT,
  view_count INTEGER DEFAULT 0,
  assignee TEXT,
  status TEXT DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1-5. campaign_content_mapping 테이블 생성
CREATE TABLE IF NOT EXISTS campaign_content_mapping (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- STEP 2: 월별 테마 데이터 입력
-- =====================================

-- 2025년 7-12월 테마 입력
INSERT INTO monthly_themes (month, year, theme, objective, promotion_detail) VALUES
(7, 2025, '여름 성수기 쿨링 캠페인', '뜨거운 여름, 완벽한 스윙을 위한 준비', '상담/방문 고객 전체 쿨링 패키지(스포츠 타월, 팔토시) 증정 + 구매 고객 고급 위스키 증정'),
(8, 2025, '여름 휴가 시즌', '휴가철 골프 여행 필수품', '00만원 이상 구매 시 골프 여행 상품권 00만원 증정 + 방수파우치 증정'),
(9, 2025, '가을 시즌 준비', '가을 라운드, 스타일리시하게 / 골프 성수기 전 점검 OR 교체', '00만원 이상 구매 시 골프 의류 상품권 00만원 증정 + 마스구 로고 볼캡 증정'),
(10, 2025, '가을 골프 성수기', '가을 골프, 마스구로 완성', '적정 할인 00% 제공 + 골프 장갑 증정'),
(11, 2025, '블랙 프라이데이 세일', '블랙 프라이데이, 마스골프 특별 세일', '연중 최대 할인 00% 제공'),
(12, 2025, '연말 고객 감사', '연말, 마스구와 함께한 골프의 추억', '00만원 이상 구매 시 마스구 굿즈(악세서리) 증정')
ON CONFLICT (month, year) 
DO UPDATE SET 
  theme = EXCLUDED.theme,
  objective = EXCLUDED.objective,
  promotion_detail = EXCLUDED.promotion_detail;

-- =====================================
-- STEP 3: 인덱스 생성
-- =====================================

CREATE INDEX IF NOT EXISTS idx_campaigns_date ON marketing_campaigns(date);
CREATE INDEX IF NOT EXISTS idx_campaigns_month_year ON marketing_campaigns(month, year);
CREATE INDEX IF NOT EXISTS idx_blog_schedule_date ON blog_schedule(date);
CREATE INDEX IF NOT EXISTS idx_campaigns_channel ON marketing_campaigns(channel);
CREATE INDEX IF NOT EXISTS idx_blog_schedule_account ON blog_schedule(account);

-- =====================================
-- STEP 4: 함수 생성 (드롭 후 재생성)
-- =====================================

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS generate_monthly_content(INTEGER, INTEGER);

-- 월별 콘텐츠 자동 생성 함수
CREATE OR REPLACE FUNCTION generate_monthly_content(
    p_year INTEGER,
    p_month INTEGER
) RETURNS void AS $$
DECLARE
    v_theme RECORD;
    v_date DATE;
    v_week_start DATE;
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
    
    -- 1. 카카오톡/문자 캠페인 (월 2회)
    FOR i IN 1..2 LOOP
        -- 카카오톡
        INSERT INTO content_ideas (
            title, platform, content, scheduled_date, status, tags, assignee, topic
        ) VALUES (
            v_theme.theme || ' - 카카오톡 ' || i || '차',
            '카카오톡',
            COALESCE(v_theme.objective, '') || ' - ' || COALESCE(v_theme.promotion_detail, ''),
            v_date + ((i-1) * 14),
            'draft',
            ARRAY['카카오톡', '월간캠페인', p_month::TEXT || '월'],
            '제이',
            v_theme.theme
        )
        ON CONFLICT DO NOTHING;
        
        -- 문자
        INSERT INTO content_ideas (
            title, platform, content, scheduled_date, status, tags, assignee, topic
        ) VALUES (
            v_theme.theme || ' - 문자 ' || i || '차',
            '문자',
            '고객님을 위한 ' || p_month || '월 특별 혜택!',
            v_date + ((i-1) * 14) + 1,
            'draft',
            ARRAY['문자', '월간캠페인', p_month::TEXT || '월'],
            '제이',
            v_theme.theme
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    -- 2. 네이버 블로그 (간단히 주 3회씩만)
    v_week_start := v_date;
    WHILE v_week_start < (v_date + INTERVAL '1 month') LOOP
        -- 3개 계정에 각각 3개씩
        INSERT INTO content_ideas (title, platform, scheduled_date, status, assignee, topic) 
        SELECT 
            v_theme.theme || ' - ' || account || ' ' || TO_CHAR(v_week_start + day_offset, 'MM/DD'),
            '네이버블로그',
            v_week_start + day_offset,
            'draft',
            CASE account 
                WHEN 'mas9golf' THEN '제이'
                WHEN 'massgoogolf' THEN '스테피'
                ELSE '허상원'
            END,
            v_theme.theme
        FROM (VALUES ('mas9golf'), ('massgoogolf'), ('massgoogolfkorea')) AS accounts(account)
        CROSS JOIN (VALUES (0), (2), (4)) AS days(day_offset)
        ON CONFLICT DO NOTHING;
        
        v_week_start := v_week_start + INTERVAL '7 days';
    END LOOP;
    
    RAISE NOTICE '% 년 % 월 콘텐츠 생성 완료', p_year, p_month;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- STEP 5: 뷰 생성
-- =====================================

-- 통합 대시보드 뷰
CREATE OR REPLACE VIEW integrated_campaign_dashboard AS
SELECT 
    mt.year,
    mt.month,
    mt.theme,
    mt.objective,
    mt.promotion_detail,
    COUNT(DISTINCT mc.id) as campaign_count,
    COUNT(DISTINCT ci.id) as content_count,
    COUNT(DISTINCT CASE WHEN ci.platform = '카카오톡' THEN ci.id END) as kakao_count,
    COUNT(DISTINCT CASE WHEN ci.platform = '문자' THEN ci.id END) as sms_count,
    COUNT(DISTINCT CASE WHEN ci.platform = '네이버블로그' THEN ci.id END) as blog_count
FROM monthly_themes mt
LEFT JOIN marketing_campaigns mc ON mc.year = mt.year AND mc.month = mt.month
LEFT JOIN content_ideas ci ON ci.topic = mt.theme 
    AND EXTRACT(YEAR FROM ci.scheduled_date) = mt.year 
    AND EXTRACT(MONTH FROM ci.scheduled_date) = mt.month
GROUP BY mt.year, mt.month, mt.theme, mt.objective, mt.promotion_detail
ORDER BY mt.year, mt.month;

-- =====================================
-- STEP 6: 권한 설정
-- =====================================

GRANT ALL ON marketing_campaigns TO authenticated;
GRANT ALL ON monthly_themes TO authenticated;
GRANT ALL ON blog_schedule TO authenticated;
GRANT ALL ON campaign_content_mapping TO authenticated;
GRANT ALL ON integrated_campaign_dashboard TO authenticated;

-- =====================================
-- STEP 7: 확인
-- =====================================

-- 테이블 구조 확인
SELECT 'Tables created successfully!' as status;

-- 월별 테마 확인
SELECT year, month, theme, objective FROM monthly_themes ORDER BY year, month;

-- 이제 다른 SQL 파일들을 실행할 수 있습니다!