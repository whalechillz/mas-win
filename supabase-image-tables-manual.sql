-- Supabase 이미지 관리 테이블 생성 SQL
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. 이미지 자산 테이블
CREATE TABLE IF NOT EXISTS image_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  width INTEGER,
  height INTEGER,
  format VARCHAR(10) NOT NULL,
  
  -- SEO 최적화 필드
  alt_text TEXT,
  title TEXT,
  caption TEXT,
  description TEXT,
  
  -- AI 인식 결과
  ai_tags JSONB DEFAULT '[]',
  ai_objects JSONB DEFAULT '[]',
  ai_colors JSONB DEFAULT '[]',
  ai_text_extracted TEXT,
  ai_confidence_score DECIMAL(3,2),
  
  -- 중복 관리
  hash_md5 VARCHAR(32) UNIQUE,
  hash_sha256 VARCHAR(64) UNIQUE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  original_image_id UUID REFERENCES image_assets(id),
  
  -- 성능 최적화
  optimized_versions JSONB DEFAULT '{}',
  cdn_url TEXT,
  
  -- 사용 통계
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- 관리 정보
  uploaded_by VARCHAR(100),
  upload_source VARCHAR(50) DEFAULT 'manual',
  status VARCHAR(20) DEFAULT 'active',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 이미지 태그 테이블
CREATE TABLE IF NOT EXISTS image_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  tag_type VARCHAR(20) NOT NULL,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 이미지 사용 기록 테이블
CREATE TABLE IF NOT EXISTS image_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
  blog_post_id UUID,
  usage_type VARCHAR(20) NOT NULL,
  usage_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 이미지 검색 인덱스 테이블
CREATE TABLE IF NOT EXISTS image_search_index (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
  search_vector TSVECTOR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 이미지 최적화 설정 테이블
CREATE TABLE IF NOT EXISTS image_optimization_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  width INTEGER,
  height INTEGER,
  quality INTEGER DEFAULT 85,
  format VARCHAR(10) DEFAULT 'webp',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_image_assets_hash_md5 ON image_assets(hash_md5);
CREATE INDEX IF NOT EXISTS idx_image_assets_hash_sha256 ON image_assets(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_image_assets_upload_source ON image_assets(upload_source);
CREATE INDEX IF NOT EXISTS idx_image_assets_status ON image_assets(status);
CREATE INDEX IF NOT EXISTS idx_image_assets_usage_count ON image_assets(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_image_assets_created_at ON image_assets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_image_tags_image_id ON image_tags(image_id);
CREATE INDEX IF NOT EXISTS idx_image_tags_tag_name ON image_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_image_tags_tag_type ON image_tags(tag_type);

CREATE INDEX IF NOT EXISTS idx_image_usage_logs_image_id ON image_usage_logs(image_id);
CREATE INDEX IF NOT EXISTS idx_image_usage_logs_blog_post_id ON image_usage_logs(blog_post_id);

CREATE INDEX IF NOT EXISTS idx_image_search_index_vector ON image_search_index USING GIN(search_vector);

-- 기본 최적화 설정 데이터
INSERT INTO image_optimization_settings (name, width, height, quality, format, is_default) VALUES
('thumbnail', 150, 150, 80, 'webp', false),
('small', 300, 300, 85, 'webp', false),
('medium', 600, 600, 90, 'webp', true),
('large', 1200, 1200, 95, 'webp', false),
('original', NULL, NULL, 100, 'original', false)
ON CONFLICT (name) DO NOTHING;

-- 테이블 생성 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'image_%'
ORDER BY table_name;
