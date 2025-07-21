-- 캠페인 정보 테이블 추가 (선택사항)
-- 캠페인 메타데이터를 저장하고 싶다면 추가
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'planned', -- planned, active, completed
  color VARCHAR(20) DEFAULT 'blue',
  target_views INTEGER DEFAULT 0,
  target_conversions INTEGER DEFAULT 0,
  budget DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 샘플 데이터
INSERT INTO campaigns (id, name, start_date, end_date, status, color) VALUES
('2025-06', '초여름 프로모션', '2025-06-01', '2025-06-30', 'completed', 'green'),
('2025-07', '여름 특별 캠페인', '2025-07-01', '2025-07-31', 'active', 'blue'),
('2025-08', '가을 시즌 캠페인', '2025-08-01', '2025-08-31', 'planned', 'orange')
ON CONFLICT (id) DO NOTHING;

-- campaign_metrics 테이블은 이미 있으므로 추가 데이터만
INSERT INTO campaign_metrics (campaign_id, views, phone_clicks, form_submissions) VALUES
('2025-06', 2156, 78, 41),
('2025-08', 0, 0, 0)
ON CONFLICT (campaign_id) DO NOTHING;