-- 이미지 카테고리 테이블
CREATE TABLE IF NOT EXISTS image_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE image_categories ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Allow read access to image_categories" ON image_categories
  FOR SELECT USING (true);

-- 서비스 키로 모든 작업 가능
CREATE POLICY "Allow all operations for service role" ON image_categories
  FOR ALL USING (true);

-- 이미지 태그 테이블
CREATE TABLE IF NOT EXISTS image_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE image_tags ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Allow read access to image_tags" ON image_tags
  FOR SELECT USING (true);

-- 서비스 키로 모든 작업 가능
CREATE POLICY "Allow all operations for service role" ON image_tags
  FOR ALL USING (true);

-- 기본 카테고리 데이터 삽입
INSERT INTO image_categories (name, slug) VALUES 
  ('general', 'general'),
  ('golf', 'golf'),
  ('equipment', 'equipment'),
  ('course', 'course'),
  ('instruction', 'instruction')
ON CONFLICT (name) DO NOTHING;

-- 기본 태그 데이터 삽입
INSERT INTO image_tags (name, slug) VALUES 
  ('golf', 'golf'),
  ('equipment', 'equipment'),
  ('course', 'course'),
  ('instruction', 'instruction'),
  ('review', 'review')
ON CONFLICT (name) DO NOTHING;

-- 이미지 메타데이터 테이블
CREATE TABLE IF NOT EXISTS image_metadata (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL UNIQUE,
  prompt TEXT,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  category_id INTEGER REFERENCES image_categories(id),
  tags TEXT[], -- 태그 배열
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  format VARCHAR(20),
  upload_source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'file_upload', 'ai_generated'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'deleted', 'broken'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Allow read access to image_metadata" ON image_metadata
  FOR SELECT USING (true);

-- 서비스 키로 모든 작업 가능
CREATE POLICY "Allow all operations for service role" ON image_metadata
  FOR ALL USING (true);
