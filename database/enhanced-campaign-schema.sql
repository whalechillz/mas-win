-- 강화된 캠페인 관리 스키마

-- 1. 월별 마케팅 테마 (상세 버전)
DROP TABLE IF EXISTS monthly_themes CASCADE;
CREATE TABLE monthly_themes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  theme TEXT NOT NULL,
  objective TEXT NOT NULL,
  promotion_detail TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

-- 2. 콘텐츠 아이디어 뱅크
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  keywords TEXT[],
  target_audience TEXT,
  content_type TEXT, -- blog, social, video
  priority INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idea', -- idea, planned, in_progress, published
  assigned_to TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 캠페인 성과 KPI
CREATE TABLE IF NOT EXISTS campaign_kpis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES marketing_campaigns(id),
  metric_name TEXT NOT NULL, -- clicks, views, conversions, roi
  target_value DECIMAL,
  actual_value DECIMAL,
  achievement_rate DECIMAL GENERATED ALWAYS AS (
    CASE WHEN target_value > 0 THEN (actual_value / target_value * 100) 
    ELSE 0 END
  ) STORED,
  measured_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI 콘텐츠 생성 이력
CREATE TABLE IF NOT EXISTS ai_content_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  generated_content TEXT,
  edited_content TEXT,
  status TEXT DEFAULT 'generated', -- generated, edited, published
  quality_score INTEGER,
  used_for TEXT[], -- blog_ids or campaign_ids
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 콘텐츠 배포 스케줄
CREATE TABLE IF NOT EXISTS content_distribution (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_id UUID,
  platform TEXT NOT NULL, -- naver, kakao, instagram, etc
  scheduled_time TIMESTAMPTZ NOT NULL,
  published_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled', -- scheduled, published, failed
  publish_url TEXT,
  error_message TEXT,
  auto_publish BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 마케팅 통계 대시보드
CREATE TABLE IF NOT EXISTS marketing_statistics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  channel TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  cost DECIMAL DEFAULT 0,
  roi DECIMAL GENERATED ALWAYS AS (
    CASE WHEN cost > 0 THEN ((revenue - cost) / cost * 100) 
    ELSE 0 END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, channel)
);

-- 월별 테마 데이터 삽입 (2025년 7월 ~ 2026년 6월)
INSERT INTO monthly_themes (month, year, theme, objective, promotion_detail) VALUES
(7, 2025, '뜨거운 여름, 완벽한 스윙을 위한 준비', 
 '고소득층 및 4060세대 매출 극대화', 
 '상담/방문 고객 전체 쿨링 패키지(스포츠 타월, 팔 토시) 증정 + 구매 고객 고급 위스키 증정'),

(8, 2025, '휴가철, 골프 휴양지 필수품', 
 '휴가철 골프 여행객 타겟 매출 극대화', 
 '00만 원 이상 구매 시 골프 여행 상품권 00만원 증정 + 방수파우치 증정'),

(9, 2025, '가을 라운드, 스타일리시하게', 
 '가을 골프 시즌 수요 공략, 브랜드 인지도 강화', 
 '00만원 이상 구매 시 골프 의류 상품권 00만원 증정 + 마쓰구 로고 볼캡 증정'),

(10, 2025, '가을 골프, 마쓰구로 완성', 
 '고소득층 매출 증대, 브랜드 인지도 강화', 
 '적정 할인 00% 제공 + 골프 장갑 증정'),

(11, 2025, '블랙 프라이데이, 마쓰골프 특별 세일', 
 '연말 최대 매출 달성', 
 '연중 최대 할인 00% 제공'),

(12, 2025, '연말, 마쓰구와 함께한 골프의 추억', 
 '충성 고객 유지, 재구매율 증가', 
 '00만원 이상 구매 시 마쓰구 굿즈(악세서리) 증정'),

(1, 2026, '2025년, 새해 첫 스윙을 마쓰구와', 
 '신규 고객 유치, 브랜드 인지도 제고', 
 '00만원 이상 구매 시 골프공, 볼마커, 비거리 측정기 증정 + 신년 럭키 드로우 추첨 이벤트(1등: 골프백, 2등: OOO)'),

(2, 2026, '설날, 골프 선물로 마음을 전하세요', 
 '설 선물 수요 공략, 고소득층 매출 증대', 
 '설 선물 패키지 00% 할인 + 명절 전용 선물 포장'),

(3, 2026, '봄 골프 시즌, 마쓰구로 준비 완료', 
 '시즌 시작 전 장비 구매 수요 공략', 
 '적정 할인 00% 제공 + 골프 장갑 증정'),

(4, 2026, '본격 골프 시즌, 마쓰구와 함께', 
 '신규 및 기존 고객 전환율 증가', 
 '00만원 이상 구매 시 골프 의류 상품권 00만원 증정 + 마쓰구 로고 볼캡 증정'),

(5, 2026, '가족과 함께하는 골프 선물', 
 '가족 단위 고객 타겟, 매출 집중', 
 '00만원 이상 구매 시 골프 OOOO 증정 + 고급 골프 우산 증정'),

(6, 2026, '여름 골프를 위한 필수 준비', 
 '여름 성수기 전 수요 선점', 
 '00만원 이상 구매 시 고급 스포츠 선글라스 증정');

-- 인덱스 생성
CREATE INDEX idx_content_ideas_status ON content_ideas(status);
CREATE INDEX idx_content_ideas_priority ON content_ideas(priority DESC);
CREATE INDEX idx_distribution_scheduled ON content_distribution(scheduled_time);
CREATE INDEX idx_distribution_status ON content_distribution(status);
CREATE INDEX idx_statistics_date ON marketing_statistics(date);
CREATE INDEX idx_kpis_campaign ON campaign_kpis(campaign_id);

-- 뷰 생성: 이번 달 캠페인 현황
CREATE OR REPLACE VIEW current_month_campaigns AS
SELECT 
  mc.*,
  mt.theme,
  mt.objective,
  mt.promotion_detail,
  COUNT(DISTINCT CASE WHEN mc.channel = 'blog' THEN bs.id END) as blog_posts,
  AVG(ck.achievement_rate) as avg_kpi_achievement
FROM marketing_campaigns mc
LEFT JOIN monthly_themes mt ON mt.month = mc.month AND mt.year = mc.year
LEFT JOIN blog_schedule bs ON bs.campaign_id = mc.id
LEFT JOIN campaign_kpis ck ON ck.campaign_id = mc.id
WHERE mc.month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND mc.year = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY mc.id, mt.theme, mt.objective, mt.promotion_detail;

-- 뷰 생성: 주간 콘텐츠 일정
CREATE OR REPLACE VIEW weekly_content_schedule AS
SELECT 
  cd.scheduled_time,
  cd.platform,
  cd.status,
  ci.title,
  ci.assigned_to,
  ci.content_type
FROM content_distribution cd
JOIN content_ideas ci ON ci.id = cd.content_id
WHERE cd.scheduled_time BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY cd.scheduled_time;