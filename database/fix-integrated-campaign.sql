-- 🔧 통합 캠페인 시스템 수정 SQL

-- 1. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. marketing_campaigns 테이블 생성 (없는 경우)
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

-- 3. monthly_themes 테이블 생성 및 수정
CREATE TABLE IF NOT EXISTS monthly_themes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  theme TEXT NOT NULL,
  objective TEXT,              -- 목표 추가
  promotion_detail TEXT,       -- 프로모션 상세 추가
  description TEXT,
  promotion_details TEXT,      -- 기존 필드 유지
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

-- 4. 7월 캠페인 데이터 입력 (엑셀 데이터 기반)
INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status) VALUES
-- 7월 캠페인
('2025-07-08', 7, 2025, 'kakao', '여름 성수기 쿨링 캠페인', '뜨거운 여름, 완벽한 스윙을 위한 준비', 1148, '제이', 'planned'),
('2025-07-09', 7, 2025, 'sms', '여름 휴가 시즌', '여름 휴가철 골프 여행 필수품', 1193, '제이', 'planned'),
('2025-07-15', 7, 2025, 'blog', '가을 라운드 준비', '가을 라운드, 스타일리시하게', 0, '스테피', 'planned'),
('2025-07-22', 7, 2025, 'kakao', '가을 골프 마스터', '가을 골프, 마스구로 완성', 1148, '허상원', 'planned'),

-- 8월 캠페인
('2025-08-05', 8, 2025, 'sms', '여름 휴가 시즌', '휴가철 골프 여행 필수품', 1193, '제이', 'planned'),
('2025-08-12', 8, 2025, 'blog', '가을 시즌 준비', '가을 골프 성수기 준비', 0, '나과장', 'planned'),

-- 9월 캠페인  
('2025-09-02', 9, 2025, 'kakao', '가을 시즌 준비', '가을 골프 시즌 준비 완료', 1148, '스테피', 'planned'),
('2025-09-16', 9, 2025, 'blog', '가을 골프 성수기', '가을 골프의 정석', 0, '제이', 'planned')
ON CONFLICT DO NOTHING;

-- 5. 월별 테마 데이터 입력 (objective와 promotion_detail 포함)
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

-- 6. blog_schedule 테이블 생성 (없는 경우)
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

-- 7. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_campaigns_date ON marketing_campaigns(date);
CREATE INDEX IF NOT EXISTS idx_campaigns_month_year ON marketing_campaigns(month, year);
CREATE INDEX IF NOT EXISTS idx_blog_schedule_date ON blog_schedule(date);

-- 8. 권한 설정
GRANT ALL ON marketing_campaigns TO authenticated;
GRANT ALL ON monthly_themes TO authenticated;
GRANT ALL ON blog_schedule TO authenticated;

-- 9. 데이터 확인
SELECT 'marketing_campaigns' as table_name, COUNT(*) as count FROM marketing_campaigns
UNION ALL
SELECT 'monthly_themes', COUNT(*) FROM monthly_themes
UNION ALL  
SELECT 'blog_schedule', COUNT(*) FROM blog_schedule;