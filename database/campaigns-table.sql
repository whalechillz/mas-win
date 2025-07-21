-- 캠페인 정보 테이블
CREATE TABLE IF NOT EXISTS campaigns (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) UNIQUE NOT NULL,
  campaign_name VARCHAR(200) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, active, ended
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_views INTEGER DEFAULT 10000,
  target_conversions INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 설정
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for all users" ON campaigns
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable all for authenticated users" ON campaigns
  FOR ALL TO authenticated
  USING (true);

-- 초기 데이터 삽입
INSERT INTO campaigns (campaign_id, campaign_name, description, status, start_date, end_date, target_views, target_conversions)
VALUES 
  ('2025-07', '7월 썸머 스페셜', '여름 시즌 특별 프로모션 - 최대 35% 할인 + 프리미엄 위스키 증정', 'active', '2025-07-01', '2025-07-31', 10000, 100),
  ('2025-06', '6월 프라임타임', '장마 시즌 실내 연습장 프로모션', 'ended', '2025-06-01', '2025-06-30', 8000, 80),
  ('2025-08', '8월 가을맞이', '가을 시즌 신제품 출시 이벤트', 'scheduled', '2025-08-01', '2025-08-31', 12000, 120)
ON CONFLICT (campaign_id) DO UPDATE SET
  campaign_name = EXCLUDED.campaign_name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 캠페인 상태 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_campaign_status()
RETURNS void AS $$
BEGIN
  -- 시작일이 지난 캠페인을 active로
  UPDATE campaigns 
  SET status = 'active'
  WHERE status = 'scheduled' 
  AND start_date <= CURRENT_DATE
  AND end_date >= CURRENT_DATE;
  
  -- 종료일이 지난 캠페인을 ended로
  UPDATE campaigns 
  SET status = 'ended'
  WHERE status = 'active' 
  AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 상태 업데이트 실행
SELECT update_campaign_status();
