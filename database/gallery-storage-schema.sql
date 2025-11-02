-- 고도화된 갤러리 관리 시스템 데이터베이스 스키마
-- 블로그 이미지 정리 우선 작업을 위한 필수 스키마

-- 1. image_metadata 테이블 확장 (기존 테이블이 있는 경우)
ALTER TABLE image_metadata
ADD COLUMN IF NOT EXISTS original_path TEXT,                    -- 실제 Storage 경로
ADD COLUMN IF NOT EXISTS internal_id VARCHAR(255),               -- 내부 고유 ID (UUID)
ADD COLUMN IF NOT EXISTS hash_md5 VARCHAR(32),                   -- 중복 감지용 (MD5)
ADD COLUMN IF NOT EXISTS hash_sha256 VARCHAR(64),                -- 중복 감지용 (SHA256)
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,          -- 사용 횟수
ADD COLUMN IF NOT EXISTS references JSONB DEFAULT '[]',          -- 참조 정보 배열
ADD COLUMN IF NOT EXISTS blog_posts INTEGER[],                   -- 연결된 블로그 글 ID 배열
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '{}',            -- 베리에이션 경로 정보
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE; -- 마지막 사용 시간

-- 2. 인덱스 생성 (검색 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_original_path ON image_metadata(original_path);
CREATE INDEX IF NOT EXISTS idx_internal_id ON image_metadata(internal_id);
CREATE INDEX IF NOT EXISTS idx_hash_md5 ON image_metadata(hash_md5);
CREATE INDEX IF NOT EXISTS idx_hash_sha256 ON image_metadata(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_blog_posts ON image_metadata USING GIN(blog_posts);
CREATE INDEX IF NOT EXISTS idx_usage_count ON image_metadata(usage_count);
CREATE INDEX IF NOT EXISTS idx_last_used_at ON image_metadata(last_used_at);

-- 3. 복합 인덱스 (자주 함께 사용되는 필드)
CREATE INDEX IF NOT EXISTS idx_path_hash ON image_metadata(original_path, hash_md5);
CREATE INDEX IF NOT EXISTS idx_blog_posts_count ON image_metadata USING GIN(blog_posts), usage_count;

-- 4. 이미지 참조 관리 함수 (선택사항, 성능 최적화)
CREATE OR REPLACE FUNCTION update_image_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE image_metadata
  SET 
    usage_count = (
      SELECT COUNT(*)
      FROM jsonb_array_elements(NEW.references) AS ref
    ),
    last_used_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 생성 (자동 usage_count 업데이트)
DROP TRIGGER IF EXISTS trigger_update_image_usage_count ON image_metadata;
CREATE TRIGGER trigger_update_image_usage_count
  AFTER UPDATE OF references ON image_metadata
  FOR EACH ROW
  WHEN (OLD.references IS DISTINCT FROM NEW.references)
  EXECUTE FUNCTION update_image_usage_count();

-- 6. 이미지 중복 검사 함수 (유틸리티)
CREATE OR REPLACE FUNCTION find_duplicate_images()
RETURNS TABLE (
  hash_md5 VARCHAR(32),
  hash_sha256 VARCHAR(64),
  image_count BIGINT,
  image_ids INTEGER[],
  image_paths TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    im.hash_md5,
    im.hash_sha256,
    COUNT(*)::BIGINT as image_count,
    ARRAY_AGG(im.id ORDER BY im.id) as image_ids,
    ARRAY_AGG(im.original_path ORDER BY im.id) as image_paths
  FROM image_metadata im
  WHERE im.hash_md5 IS NOT NULL
    AND im.hash_md5 != ''
  GROUP BY im.hash_md5, im.hash_sha256
  HAVING COUNT(*) > 1
  ORDER BY image_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. 블로그 이미지 검색 함수 (성능 최적화)
CREATE OR REPLACE FUNCTION search_blog_images(
  p_blog_post_id INTEGER DEFAULT NULL,
  p_folder_path TEXT DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
  image_url TEXT,
  original_path TEXT,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  keywords TEXT[],
  blog_posts INTEGER[],
  usage_count INTEGER,
  folder_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    im.id,
    im.image_url,
    im.original_path,
    im.alt_text,
    im.title,
    im.description,
    im.tags as keywords,
    im.blog_posts,
    im.usage_count,
    CASE 
      WHEN im.original_path IS NOT NULL THEN 
        regexp_replace(im.original_path, '/[^/]+$', '')
      ELSE NULL
    END as folder_path,
    im.created_at
  FROM image_metadata im
  WHERE 
    (p_blog_post_id IS NULL OR p_blog_post_id = ANY(im.blog_posts))
    AND (p_folder_path IS NULL OR im.original_path LIKE p_folder_path || '%')
    AND (
      p_search_query IS NULL 
      OR im.title ILIKE '%' || p_search_query || '%'
      OR im.alt_text ILIKE '%' || p_search_query || '%'
      OR im.description ILIKE '%' || p_search_query || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(im.tags) tag 
        WHERE tag ILIKE '%' || p_search_query || '%'
      )
    )
    AND im.status = 'active'
  ORDER BY im.last_used_at DESC NULLS LAST, im.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 8. 메타데이터 품질 점수 계산 함수
CREATE OR REPLACE FUNCTION calculate_metadata_quality_score(p_image_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_metadata RECORD;
BEGIN
  SELECT 
    id,
    alt_text,
    title,
    description,
    tags
  INTO v_metadata
  FROM image_metadata
  WHERE id = p_image_id;
  
  IF v_metadata.alt_text IS NOT NULL AND length(trim(v_metadata.alt_text)) > 0 THEN
    v_score := v_score + 25;
  END IF;
  
  IF v_metadata.title IS NOT NULL AND length(trim(v_metadata.title)) > 0 THEN
    v_score := v_score + 25;
  END IF;
  
  IF v_metadata.description IS NOT NULL AND length(trim(v_metadata.description)) > 0 THEN
    v_score := v_score + 25;
  END IF;
  
  IF v_metadata.tags IS NOT NULL AND array_length(v_metadata.tags, 1) > 0 THEN
    v_score := v_score + 25;
  END IF;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- 9. 이미지 사용 위치 추적 함수
CREATE OR REPLACE FUNCTION get_image_usage_locations(p_image_id INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_image RECORD;
  v_usage JSONB := '[]'::JSONB;
  v_ref JSONB;
BEGIN
  SELECT 
    id,
    references,
    blog_posts
  INTO v_image
  FROM image_metadata
  WHERE id = p_image_id;
  
  -- 참조 정보 추가
  IF v_image.references IS NOT NULL THEN
    v_usage := v_usage || v_image.references;
  END IF;
  
  -- 블로그 글 연결 추가
  IF v_image.blog_posts IS NOT NULL THEN
    FOR v_ref IN SELECT jsonb_build_object(
      'type', 'blog',
      'post_id', unnest(v_image.blog_posts),
      'usage', 'content'
    )
    LOOP
      v_usage := v_usage || jsonb_build_array(v_ref);
    END LOOP;
  END IF;
  
  RETURN v_usage;
END;
$$ LANGUAGE plpgsql;

-- 10. 주석 추가 (문서화)
COMMENT ON COLUMN image_metadata.original_path IS '실제 Storage 경로 (masgolf-images 버킷 기준)';
COMMENT ON COLUMN image_metadata.internal_id IS '내부 고유 ID (UUID, 파일명 변경되어도 찾을 수 있도록)';
COMMENT ON COLUMN image_metadata.hash_md5 IS 'MD5 해시 (중복 이미지 감지용)';
COMMENT ON COLUMN image_metadata.hash_sha256 IS 'SHA256 해시 (중복 이미지 감지용, 더 정확함)';
COMMENT ON COLUMN image_metadata.usage_count IS '사용 횟수 (자동 계산)';
COMMENT ON COLUMN image_metadata.references IS '참조 정보 배열 (JSONB, 블로그, 퍼널 등에서 사용)';
COMMENT ON COLUMN image_metadata.blog_posts IS '연결된 블로그 글 ID 배열 (빠른 검색용)';
COMMENT ON COLUMN image_metadata.variants IS '베리에이션 경로 정보 (JSONB, 채널별 최적화 버전)';
COMMENT ON COLUMN image_metadata.last_used_at IS '마지막 사용 시간 (사용 빈도 정렬용)';

-- 11. 뷰 생성 (편의성 향상)
CREATE OR REPLACE VIEW v_blog_images_summary AS
SELECT 
  im.id,
  im.image_url,
  im.original_path,
  im.alt_text,
  im.title,
  CASE 
    WHEN im.original_path LIKE 'originals/blog/%' THEN 
      regexp_replace(im.original_path, '^originals/blog/', '')
    ELSE NULL
  END as blog_folder_path,
  array_length(im.blog_posts, 1) as blog_post_count,
  im.usage_count,
  calculate_metadata_quality_score(im.id) as metadata_quality_score,
  im.created_at,
  im.last_used_at
FROM image_metadata im
WHERE im.status = 'active'
  AND (im.original_path LIKE 'originals/blog/%' OR im.original_path IS NULL);

-- 12. 통계 함수
CREATE OR REPLACE FUNCTION get_gallery_statistics()
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_images', COUNT(*),
    'images_with_metadata', COUNT(*) FILTER (WHERE alt_text IS NOT NULL OR title IS NOT NULL),
    'images_with_quality_metadata', COUNT(*) FILTER (
      WHERE (alt_text IS NOT NULL AND length(trim(alt_text)) > 0)
        AND (title IS NOT NULL AND length(trim(title)) > 0)
        AND (description IS NOT NULL AND length(trim(description)) > 0)
        AND (tags IS NOT NULL AND array_length(tags, 1) > 0)
    ),
    'blog_images', COUNT(*) FILTER (WHERE original_path LIKE 'originals/blog/%'),
    'duplicate_images', (
      SELECT COUNT(*) 
      FROM find_duplicate_images()
    ),
    'most_used_images', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', id,
          'usage_count', usage_count,
          'original_path', original_path
        )
      )
      FROM (
        SELECT id, usage_count, original_path
        FROM image_metadata
        WHERE usage_count > 0
        ORDER BY usage_count DESC
        LIMIT 10
      ) top_images
    )
  ) INTO v_stats
  FROM image_metadata
  WHERE status = 'active';
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

