-- 📌 가장 간단한 버전 - 에러 없이 실행 가능

-- 1단계: 테이블 생성 (없으면 생성)
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

-- 2단계: monthly_themes 구조 확인
ALTER TABLE monthly_themes 
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS promotion_detail TEXT,
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(200);

-- 3단계: 7월 데이터만 먼저 테스트
INSERT INTO monthly_themes (year, month, theme, objective, promotion_detail, target_audience) VALUES
(2025, 7, '여름 성수기 쿨링 캠페인', 
 '뜨거운 여름, 완벽한 스윙을 위한 준비', 
 '상담/방문 고객 전체 쿨링 패키지(스포츠 타월, 팔토시) 증정 + 구매 고객 고급 위스키 증정',
 '고소득층 및 4060세대')
ON CONFLICT (year, month) DO UPDATE SET
  theme = EXCLUDED.theme,
  objective = EXCLUDED.objective,
  promotion_detail = EXCLUDED.promotion_detail,
  target_audience = EXCLUDED.target_audience;

-- 4단계: 7월 캠페인 생성
INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status) VALUES
('2025-07-01', 7, 2025, 'kakao', '여름 성수기 쿨링 캠페인', '뜨거운 여름, 완벽한 스윙을 위한 준비!', 1200, '제이', 'planned'),
('2025-07-15', 7, 2025, 'kakao', '여름 성수기 쿨링 캠페인', '쿨링 패키지로 시원한 여름 골프!', 1200, '제이', 'planned'),
('2025-07-02', 7, 2025, 'sms', '여름 성수기 쿨링 캠페인', '고객님을 위한 7월 특별 혜택!', 1200, '제이', 'planned'),
('2025-07-16', 7, 2025, 'sms', '여름 성수기 쿨링 캠페인', '구매시 고급 위스키 증정!', 1200, '제이', 'planned'),
('2025-07-07', 7, 2025, 'blog', '여름 성수기 쿨링 캠페인', '블로그: 여름 골프 완벽 가이드', 0, '스테피', 'planned')
ON CONFLICT DO NOTHING;

-- 5단계: 결과 확인
SELECT 
    mt.year,
    mt.month,
    mt.theme,
    COUNT(mc.id) as campaign_count
FROM monthly_themes mt
LEFT JOIN marketing_campaigns mc ON mc.year = mt.year AND mc.month = mt.month
WHERE mt.year = 2025 AND mt.month = 7
GROUP BY mt.year, mt.month, mt.theme;

-- 이제 멀티채널 콘텐츠 생성 함수가 있다면 실행
-- SELECT generate_monthly_content(2025, 7);