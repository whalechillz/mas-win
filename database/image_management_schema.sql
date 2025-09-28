-- 이미지 자산 관리 시스템 데이터베이스 스키마

-- 1. 이미지 메타데이터 테이블
CREATE TABLE image_assets (
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
  optimized_versions JSONB DEFAULT '{}', -- {thumbnail: "path", medium: "path", large: "path"}
  cdn_url TEXT,
  
  -- 사용 통계
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- 관리 정보
  uploaded_by VARCHAR(100),
  upload_source VARCHAR(50), -- 'manual', 'naver_scraper', 'ai_generated', 'bulk_upload'
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'deleted'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 이미지 태그 테이블 (정규화)
CREATE TABLE image_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  tag_type VARCHAR(20) NOT NULL, -- 'ai_generated', 'manual', 'seo_optimized'
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 이미지 사용 기록 테이블
CREATE TABLE image_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
  blog_post_id UUID,
  usage_type VARCHAR(20) NOT NULL, -- 'featured', 'content', 'gallery'
  usage_position INTEGER, -- 이미지가 사용된 위치
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 이미지 검색 인덱스 테이블
CREATE TABLE image_search_index (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
  search_vector TSVECTOR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 이미지 최적화 설정 테이블
CREATE TABLE image_optimization_settings (
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
CREATE INDEX idx_image_assets_hash_md5 ON image_assets(hash_md5);
CREATE INDEX idx_image_assets_hash_sha256 ON image_assets(hash_sha256);
CREATE INDEX idx_image_assets_upload_source ON image_assets(upload_source);
CREATE INDEX idx_image_assets_status ON image_assets(status);
CREATE INDEX idx_image_assets_usage_count ON image_assets(usage_count DESC);
CREATE INDEX idx_image_assets_created_at ON image_assets(created_at DESC);

CREATE INDEX idx_image_tags_image_id ON image_tags(image_id);
CREATE INDEX idx_image_tags_tag_name ON image_tags(tag_name);
CREATE INDEX idx_image_tags_tag_type ON image_tags(tag_type);

CREATE INDEX idx_image_usage_logs_image_id ON image_usage_logs(image_id);
CREATE INDEX idx_image_usage_logs_blog_post_id ON image_usage_logs(blog_post_id);

CREATE INDEX idx_image_search_index_vector ON image_search_index USING GIN(search_vector);

-- 트리거: 이미지 사용 시 자동 업데이트
CREATE OR REPLACE FUNCTION update_image_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE image_assets 
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.image_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_image_usage_stats
  AFTER INSERT ON image_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_image_usage_stats();

-- 트리거: 이미지 메타데이터 업데이트 시 검색 인덱스 갱신
CREATE OR REPLACE FUNCTION update_image_search_index()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO image_search_index (image_id, search_vector)
  VALUES (
    NEW.id,
    to_tsvector('korean', 
      COALESCE(NEW.alt_text, '') || ' ' ||
      COALESCE(NEW.title, '') || ' ' ||
      COALESCE(NEW.caption, '') || ' ' ||
      COALESCE(NEW.description, '') || ' ' ||
      COALESCE(NEW.ai_text_extracted, '') || ' ' ||
      COALESCE(array_to_string(NEW.ai_tags, ' '), '')
    )
  )
  ON CONFLICT (image_id) DO UPDATE SET
    search_vector = EXCLUDED.search_vector,
    created_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_image_search_index
  AFTER INSERT OR UPDATE ON image_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_image_search_index();

-- 기본 최적화 설정 데이터
INSERT INTO image_optimization_settings (name, width, height, quality, format, is_default) VALUES
('thumbnail', 150, 150, 80, 'webp', false),
('small', 300, 300, 85, 'webp', false),
('medium', 600, 600, 90, 'webp', true),
('large', 1200, 1200, 95, 'webp', false),
('original', NULL, NULL, 100, 'original', false);
