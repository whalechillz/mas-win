-- 통합 마케팅 캠페인 관리 테이블

-- 1. 마케팅 캠페인 메인 테이블
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- 기본 정보
  date DATE NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  channel TEXT NOT NULL, -- kakao, sms, blog
  
  -- 캠페인 내용
  topic TEXT NOT NULL,               -- 주제/마케팅 포인트
  content TEXT,                      -- 발송 내용 (카톡/문자)
  image_url TEXT,                    -- 이미지 URL
  
  -- 대상 및 성과
  target_count INTEGER DEFAULT 0,    -- 발송 대상 수
  click_count INTEGER DEFAULT 0,     -- 클릭수
  click_rate DECIMAL(5,2),          -- 클릭율
  
  -- 담당자 및 상태
  assignee TEXT,                     -- 담당자
  status TEXT DEFAULT 'planned',     -- planned, in_progress, completed
  
  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 블로그 발행 스케줄 (기존 simple_blog_posts 확장)
CREATE TABLE IF NOT EXISTS blog_schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES marketing_campaigns(id),
  
  -- 블로그 정보
  date DATE NOT NULL,
  account TEXT NOT NULL,             -- mas9golf, massgoogolf, massgoogolfkorea
  topic TEXT NOT NULL,               -- 주제
  title TEXT,                        -- 실제 제목
  content TEXT,                      -- 내용
  
  -- 발행 정보
  naver_url TEXT,                    -- 네이버 URL
  view_count INTEGER DEFAULT 0,      -- 조회수
  
  -- 담당자 및 상태
  assignee TEXT,
  status TEXT DEFAULT 'planned',     -- planned, writing, ready, published
  
  -- 메타 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 월별 마케팅 테마
CREATE TABLE IF NOT EXISTS monthly_themes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  theme TEXT NOT NULL,               -- 예: "뜨거운 여름, 완벽한 스윙을 위한 준비"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

-- 인덱스
CREATE INDEX idx_campaigns_date ON marketing_campaigns(date);
CREATE INDEX idx_campaigns_channel ON marketing_campaigns(channel);
CREATE INDEX idx_campaigns_month_year ON marketing_campaigns(month, year);
CREATE INDEX idx_blog_schedule_date ON blog_schedule(date);
CREATE INDEX idx_blog_schedule_account ON blog_schedule(account);

-- 월별 테마 샘플 데이터
INSERT INTO monthly_themes (month, year, theme) VALUES
(7, 2025, '뜨거운 여름, 완벽한 스윙을 위한 준비'),
(8, 2025, '늦여름 라운딩, 가을 시즌 준비'),
(9, 2025, '선선한 가을, 최고의 골프 시즌'),
(10, 2025, '단풍 라운딩, 연말 준비'),
(11, 2025, '겨울 대비, 실내 연습'),
(12, 2025, '연말 특별 이벤트');

-- 기존 엑셀 데이터 마이그레이션 예시
INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status) VALUES
('2025-07-08', 7, 2025, 'kakao', '7월 여름 행사', '무더운 7월, 상담만 받아도 받는 것은?', 1148, '제이', 'completed'),
('2025-07-09', 7, 2025, 'sms', '7월 여름 행사', '%고객명%고객님을 위한 무더운 여름 시원한 혜택!', 1193, '제이', 'completed');

-- 블로그 스케줄 마이그레이션 예시
INSERT INTO blog_schedule (date, account, topic, title, assignee, status, naver_url, view_count) VALUES
('2025-06-30', 'massgoogolf', '기능성 드라이버', '여름 티샷, MAS9 드라이버 하나면 충분합니다!', '스테피', 'published', 'https://blog.naver.com/massgoogolf/223916836341', 0),
('2025-06-30', 'mas9golf', '기능성 드라이버', 'MAS9 드라이버로 여름 필드를 정복하다', '제이', 'published', 'https://blog.naver.com/mas9golf/223916628865', 0),
('2025-07-02', 'massgoogolf', '스윙연습', '여름에도 드라이버 비거리 늘리는 스윙 연습법 3가지', '스테피', 'published', 'https://blog.naver.com/massgoogolf/223919185481', 0);