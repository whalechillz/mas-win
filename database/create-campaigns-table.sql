// 캠페인 테이블을 생성하는 Supabase SQL
-- campaigns 테이블 생성
CREATE TABLE campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'ended', 'planned')) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  landing_page_url TEXT,
  landing_page_file TEXT,
  op_manual_url TEXT,
  google_ads_url TEXT,
  phone_number TEXT DEFAULT '080-028-8888',
  event_date TEXT,
  remaining_slots INTEGER DEFAULT 30,
  discount_rate INTEGER DEFAULT 50,
  views INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 캠페인 성과 추적 테이블
CREATE TABLE campaign_metrics (
  id SERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  bookings INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  avg_session_duration INTEGER DEFAULT 0, -- 초 단위
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(campaign_id, date)
);

-- 캠페인 설정 이력 테이블
CREATE TABLE campaign_settings_history (
  id SERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- A/B 테스트 테이블
CREATE TABLE campaign_ab_tests (
  id SERIAL PRIMARY KEY,
  campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  variant_a TEXT NOT NULL,
  variant_b TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  winner TEXT CHECK (winner IN ('A', 'B', NULL)),
  a_conversions INTEGER DEFAULT 0,
  b_conversions INTEGER DEFAULT 0,
  a_views INTEGER DEFAULT 0,
  b_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 캠페인 템플릿 테이블
CREATE TABLE campaign_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE
    ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_templates_updated_at BEFORE UPDATE
    ON campaign_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 인덱스 생성
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX idx_campaign_metrics_date ON campaign_metrics(campaign_id, date);
CREATE INDEX idx_campaign_ab_tests_campaign ON campaign_ab_tests(campaign_id);

-- Row Level Security (RLS) 설정
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_settings_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

-- 관리자만 접근 가능하도록 정책 설정 (추후 auth 연동 시 수정 필요)
CREATE POLICY "Enable all for authenticated users" ON campaigns
    FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON campaign_metrics
    FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON campaign_settings_history
    FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON campaign_ab_tests
    FOR ALL USING (true);

CREATE POLICY "Enable all for authenticated users" ON campaign_templates
    FOR ALL USING (true);

-- 샘플 데이터 삽입
INSERT INTO campaigns (
  id, name, status, start_date, end_date,
  landing_page_url, landing_page_file, op_manual_url, google_ads_url,
  event_date, remaining_slots, discount_rate,
  views, bookings, inquiries, conversion_rate
) VALUES 
(
  '2025-07', '여름 특별 캠페인', 'active', '2025-07-01', '2025-07-31',
  '/funnel-2025-07', '/versions/funnel-2025-07-complete.html',
  '/docs/op-manuals/2025-07-여름특별/', '/google_ads/2025.07.여름특별/',
  '7월 31일', 10, 50,
  1523, 87, 245, 5.7
),
(
  '2025-06', '프라임타임 캠페인', 'ended', '2025-06-01', '2025-06-30',
  '/funnel-2025-06', '/versions/funnel-2025-06.html',
  '/docs/op-manuals/2025-06-프라임타임/', '/google_ads/2025.06.11.프라임타임/',
  '6월 30일', 0, 40,
  2341, 134, 389, 5.7
),
(
  '2025-05', '가정의 달 캠페인', 'ended', '2025-05-01', '2025-05-31',
  '/funnel-2025-05', '/versions/funnel-2025-05.html',
  '/docs/op-manuals/2025-05-가정의달/', '/google_ads/2025.05.01.가정의달/',
  '5월 31일', 0, 30,
  2897, 156, 412, 5.4
);

-- 캠페인 템플릿 샘플 데이터
INSERT INTO campaign_templates (name, description, category, template_data) VALUES
(
  '여름 시즌 캠페인',
  '여름철 특별 할인 캠페인 템플릿',
  '시즌별',
  '{
    "discount_rate": 50,
    "features": ["무료 시타", "여름 특별 할인", "선착순 혜택"],
    "color_scheme": ["#3B82F6", "#10B981", "#F59E0B"],
    "keywords": ["여름", "특별할인", "시원한", "골프"]
  }'::jsonb
),
(
  '신규 회원 유치',
  '골프 입문자를 위한 캠페인 템플릿',
  '타겟별',
  '{
    "discount_rate": 40,
    "features": ["입문자 환영", "1:1 맞춤 레슨", "기초부터 차근차근"],
    "color_scheme": ["#8B5CF6", "#EC4899", "#F97316"],
    "keywords": ["입문", "초보", "쉬운", "기초"]
  }'::jsonb
);