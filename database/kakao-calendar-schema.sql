-- 카카오톡 콘텐츠 캘린더 테이블
-- JSON 파일 대신 Supabase 데이터베이스에 저장

-- 1. 프로필 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS kakao_profile_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  account TEXT NOT NULL CHECK (account IN ('account1', 'account2')),
  background_image_url TEXT,
  background_prompt TEXT,
  background_base_prompt TEXT,
  background_image TEXT, -- 설명 (예: "노을 코스")
  profile_image_url TEXT,
  profile_prompt TEXT,
  profile_base_prompt TEXT,
  profile_image TEXT, -- 설명 (예: "시니어 골퍼")
  message TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'created', 'published')),
  created BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, account)
);

-- 2. 피드 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS kakao_feed_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  account TEXT NOT NULL CHECK (account IN ('account1', 'account2')),
  image_category TEXT,
  image_prompt TEXT,
  base_prompt TEXT,
  caption TEXT,
  image_url TEXT,
  url TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'created', 'published')),
  created BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, account)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_kakao_profile_date ON kakao_profile_content(date);
CREATE INDEX IF NOT EXISTS idx_kakao_profile_account ON kakao_profile_content(account);
CREATE INDEX IF NOT EXISTS idx_kakao_profile_date_account ON kakao_profile_content(date, account);
CREATE INDEX IF NOT EXISTS idx_kakao_feed_date ON kakao_feed_content(date);
CREATE INDEX IF NOT EXISTS idx_kakao_feed_account ON kakao_feed_content(account);
CREATE INDEX IF NOT EXISTS idx_kakao_feed_date_account ON kakao_feed_content(date, account);

-- 4. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kakao_profile_updated_at
  BEFORE UPDATE ON kakao_profile_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kakao_feed_updated_at
  BEFORE UPDATE ON kakao_feed_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS (Row Level Security) 정책 (선택사항 - 필요시 활성화)
-- ALTER TABLE kakao_profile_content ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kakao_feed_content ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow all operations for service role"
--   ON kakao_profile_content
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);
-- 
-- CREATE POLICY "Allow all operations for service role"
--   ON kakao_feed_content
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);

