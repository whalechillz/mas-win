-- 이미지 카테고리 테이블
CREATE TABLE IF NOT EXISTS image_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이미지 태그 테이블
CREATE TABLE IF NOT EXISTS image_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
