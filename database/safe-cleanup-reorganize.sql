-- 🔧 에러 수정 버전 - 안전하게 단계별 실행

-- =====================================
-- STEP 1: 테이블 존재 여부 확인 및 백업
-- =====================================

-- marketing_campaigns 테이블이 있는 경우에만 백업
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_campaigns') THEN
        CREATE TABLE IF NOT EXISTS _backup_marketing_campaigns AS SELECT * FROM marketing_campaigns;
    END IF;
END $$;

-- monthly_themes 테이블이 있는 경우에만 백업
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'monthly_themes') THEN
        CREATE TABLE IF NOT EXISTS _backup_monthly_themes AS SELECT * FROM monthly_themes;
    END IF;
END $$;

-- =====================================
-- STEP 2: 필요한 테이블 생성
-- =====================================

-- marketing_campaigns 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- blog_schedule 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS blog_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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

-- campaign_content_mapping 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS campaign_content_mapping (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content_ideas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================
-- STEP 3: monthly_themes 테이블 구조 확인 및 수정
-- =====================================

-- monthly_themes 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS monthly_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  theme TEXT NOT NULL,
  objective TEXT,
  promotion_detail TEXT,
  description TEXT,
  promotion_details TEXT,
  target_audience VARCHAR(200),
  focus_keywords TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

-- 기존 테이블에 컬럼 추가 (없는 경우만)
ALTER TABLE monthly_themes 
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS promotion_detail TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS promotion_details TEXT,
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(200),
ADD COLUMN IF NOT EXISTS focus_keywords TEXT[];

-- =====================================
-- STEP 4: 중복 뷰 삭제
-- =====================================

DROP VIEW IF EXISTS annual_marketing_calendar CASCADE;
DROP VIEW IF EXISTS annual_theme_plan CASCADE;
DROP VIEW IF EXISTS monthly_marketing_plan CASCADE;
DROP VIEW IF EXISTS monthly_theme_calendar CASCADE;
DROP VIEW IF EXISTS integrated_campaign_dashboard CASCADE;

-- =====================================
-- STEP 5: 엑셀 기반 데이터 입력
-- =====================================

-- monthly_themes 데이터 입력
INSERT INTO monthly_themes (year, month, theme, objective, promotion_detail, target_audience, focus_keywords) VALUES
-- 2025년
(2025, 7, '여름 성수기 쿨링 캠페인', 
 '뜨거운 여름, 완벽한 스윙을 위한 준비', 
 '상담/방문 고객 전체 쿨링 패키지(스포츠 타월, 팔토시) 증정 + 구매 고객 고급 위스키 증정',
 '고소득층 및 4060세대',
 ARRAY['여름 골프', '쿨링', '스포츠 타월', '팔토시', '위스키']),

(2025, 8, '여름 휴가 시즌', 
 '휴가철, 골프 휴양지 필수품', 
 '00만원 이상 구매 시 골프 여행 상품권 00만원 증정 + 방수파우치 증정',
 '휴가철 골프 여행객',
 ARRAY['휴가', '골프 여행', '방수파우치', '여행 상품권']),

(2025, 9, '가을 시즌 준비', 
 '가을 라운드, 스타일리시하게 / 골프 성수기 전 점검 OR 교체', 
 '00만원 이상 구매 시 골프 의류 상품권 00만원 증정 + 마쓰구 로고 볼캡 증정',
 '가을 골프 시즌 고객',
 ARRAY['가을 골프', '스타일', '골프 의류', '볼캡']),

(2025, 10, '가을 골프 성수기', 
 '가을 골프, 마쓰구로 완성', 
 '적정 할인 00% 제공 + 골프 장갑 증정',
 '고소득층',
 ARRAY['가을 성수기', '마쓰구', '골프 장갑', '할인']),

(2025, 11, '블랙 프라이데이 세일', 
 '블랙 프라이데이, 마쓰골프 특별 세일', 
 '연중 최대 할인 00% 제공',
 '전체 고객',
 ARRAY['블랙프라이데이', '연말 세일', '최대 할인']),

(2025, 12, '연말 고객 감사', 
 '연말, 마쓰구와 함께한 골프의 추억', 
 '00만원 이상 구매 시 마쓰구 굿즈(악세서리) 증정',
 '충성 고객',
 ARRAY['연말', '고객 감사', '마쓰구 굿즈', '악세서리']),

-- 2026년
(2026, 1, '새해 다짐과 골프 시작', 
 '2026년, 새해 첫 스윙을 마쓰구와', 
 '00만원 이상 구매 시 골프공, 볼마커, 비거리 측정기 증정 + 신년 럭키 드로우 추첨 이벤트(1등: 골프백)',
 '신규 고객',
 ARRAY['새해', '첫 스윙', '골프공', '럭키 드로우']),

(2026, 2, '설날 선물 캠페인', 
 '설날, 골프 선물로 마음을 전하세요', 
 '설 선물 패키지 00% 할인 + 명절 전용 선물 포장',
 '설 선물 구매 고객',
 ARRAY['설날', '명절 선물', '선물 패키지', '선물 포장']),

(2026, 3, '봄 맞이 준비', 
 '봄 골프 시즌, 마쓰구로 준비 완료', 
 '적정 할인 00% 제공 + 골프 장갑 증정',
 '시즌 준비 고객',
 ARRAY['봄 골프', '시즌 준비', '장비 교체', '골프 장갑']),

(2026, 4, '골프 시즌 본격 개막', 
 '본격 골프 시즌, 마쓰구와 함께', 
 '00만원 이상 구매 시 골프 의류 상품권 00만원 증정 + 마쓰구 로고 볼캡 증정',
 '신규 및 기존 고객',
 ARRAY['골프 시즌', '개막', '골프 의류', '볼캡']),

(2026, 5, '가정의 달 선물 캠페인', 
 '가족과 함께하는 골프 선물', 
 '00만원 이상 구매 시 골프 XXXX 증정 + 고급 골프 우산 증정',
 '가족 단위 고객',
 ARRAY['가정의 달', '가족', '골프 선물', '골프 우산']),

(2026, 6, '초여름 준비', 
 '여름 골프를 위한 필수 준비', 
 '00만원 이상 구매 시 고급 스포츠 선글라스 증정',
 '여름 준비 고객',
 ARRAY['초여름', '여름 준비', '선글라스'])
ON CONFLICT (year, month) DO UPDATE SET
  theme = EXCLUDED.theme,
  objective = EXCLUDED.objective,
  promotion_detail = EXCLUDED.promotion_detail,
  target_audience = EXCLUDED.target_audience,
  focus_keywords = EXCLUDED.focus_keywords;

-- =====================================
-- STEP 6: 인덱스 생성
-- =====================================

CREATE INDEX IF NOT EXISTS idx_campaigns_date ON marketing_campaigns(date);
CREATE INDEX IF NOT EXISTS idx_campaigns_month_year ON marketing_campaigns(month, year);
CREATE INDEX IF NOT EXISTS idx_campaigns_channel ON marketing_campaigns(channel);
CREATE INDEX IF NOT EXISTS idx_blog_schedule_date ON blog_schedule(date);
CREATE INDEX IF NOT EXISTS idx_blog_schedule_account ON blog_schedule(account);

-- =====================================
-- STEP 7: 간단한 현황 뷰 생성
-- =====================================

CREATE OR REPLACE VIEW monthly_campaign_overview AS
SELECT 
    mt.year,
    mt.month,
    mt.theme,
    mt.objective,
    mt.promotion_detail,
    mt.target_audience,
    COUNT(DISTINCT mc.id) as campaign_count,
    COUNT(DISTINCT CASE WHEN mc.channel = 'kakao' THEN mc.id END) as kakao_campaigns,
    COUNT(DISTINCT CASE WHEN mc.channel = 'sms' THEN mc.id END) as sms_campaigns,
    COUNT(DISTINCT CASE WHEN mc.channel = 'blog' THEN mc.id END) as blog_campaigns,
    COUNT(DISTINCT ci.id) as content_count
FROM monthly_themes mt
LEFT JOIN marketing_campaigns mc ON mc.year = mt.year AND mc.month = mt.month
LEFT JOIN content_ideas ci ON ci.topic = mt.theme 
    AND EXTRACT(YEAR FROM ci.scheduled_date) = mt.year 
    AND EXTRACT(MONTH FROM ci.scheduled_date) = mt.month
GROUP BY mt.year, mt.month, mt.theme, mt.objective, mt.promotion_detail, mt.target_audience
ORDER BY mt.year, mt.month;

-- 연간 계획 뷰
CREATE VIEW annual_plan_view AS
SELECT 
    year,
    COUNT(DISTINCT month) as total_months,
    STRING_AGG(
        month || '월: ' || theme, 
        E'\n' ORDER BY month
    ) as yearly_themes
FROM monthly_themes
GROUP BY year
ORDER BY year;

-- =====================================
-- STEP 8: 권한 설정
-- =====================================

GRANT ALL ON marketing_campaigns TO authenticated;
GRANT ALL ON monthly_themes TO authenticated;
GRANT ALL ON blog_schedule TO authenticated;
GRANT ALL ON campaign_content_mapping TO authenticated;
GRANT ALL ON monthly_campaign_overview TO authenticated;
GRANT ALL ON annual_plan_view TO authenticated;

-- =====================================
-- STEP 9: 확인
-- =====================================

-- 월별 테마 확인
SELECT year, month, theme FROM monthly_themes ORDER BY year, month;

-- 테이블 생성 확인
SELECT 'Tables created successfully!' as status;