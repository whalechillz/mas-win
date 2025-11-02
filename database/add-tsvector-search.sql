-- TSVECTOR 전체 텍스트 검색 인덱스 추가 (한글 지원)
-- Supabase에서 'korean' 설정이 없으므로 'simple' 사용 또는 언어 설정 생략

-- 1. image_metadata 테이블에 검색 벡터 컬럼 추가
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- 2. GIN 인덱스 생성 (빠른 검색을 위해)
CREATE INDEX IF NOT EXISTS idx_image_metadata_search_vector 
ON image_metadata USING GIN(search_vector);

-- 3. 기존 데이터에 대한 검색 벡터 생성 (simple 설정 사용)
UPDATE image_metadata 
SET search_vector = to_tsvector('simple',
  COALESCE(alt_text, '') || ' ' ||
  COALESCE(title, '') || ' ' ||
  COALESCE(description, '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
)
WHERE search_vector IS NULL;

-- 4. 메타데이터 업데이트 시 자동으로 검색 벡터 업데이트하는 트리거 생성
CREATE OR REPLACE FUNCTION update_image_metadata_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('simple',
    COALESCE(NEW.alt_text, '') || ' ' ||
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 적용
DROP TRIGGER IF EXISTS trigger_update_image_metadata_search_vector ON image_metadata;
CREATE TRIGGER trigger_update_image_metadata_search_vector
  BEFORE INSERT OR UPDATE OF alt_text, title, description, tags ON image_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_image_metadata_search_vector();

-- 6. 검색 함수 생성 (선택사항, 더 빠른 검색)
CREATE OR REPLACE FUNCTION search_image_metadata(
  p_search_terms TEXT,
  p_limit INTEGER DEFAULT 1000,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id INTEGER,
  image_url TEXT,
  alt_text TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[],
  category_id INTEGER,
  usage_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    im.id,
    im.image_url,
    im.alt_text,
    im.title,
    im.description,
    im.tags,
    im.category_id,
    im.usage_count
  FROM image_metadata im
  WHERE 
    im.status = 'active'
    AND (
      -- TSVECTOR 검색 (전체 텍스트 검색)
      im.search_vector @@ plainto_tsquery('simple', p_search_terms)
      -- 폴백: ILIKE 검색 (부분 일치)
      OR im.alt_text ILIKE '%' || p_search_terms || '%'
      OR im.title ILIKE '%' || p_search_terms || '%'
      OR im.description ILIKE '%' || p_search_terms || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(im.tags) tag 
        WHERE tag ILIKE '%' || p_search_terms || '%'
      )
    )
  ORDER BY 
    -- 관련도 순 정렬 (TSVECTOR 매칭이 있을 경우)
    CASE WHEN im.search_vector @@ plainto_tsquery('simple', p_search_terms) 
      THEN ts_rank(im.search_vector, plainto_tsquery('simple', p_search_terms)) 
      ELSE 0 
    END DESC,
    im.usage_count DESC NULLS LAST,
    im.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

