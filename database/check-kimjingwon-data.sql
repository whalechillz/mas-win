-- "김진권" 관련 데이터 확인 쿼리

-- 1. image_metadata 테이블에서 "김진권" 검색
SELECT 
  id,
  image_url,
  alt_text,
  title,
  description,
  tags,
  created_at
FROM image_metadata
WHERE 
  alt_text ILIKE '%김진권%' OR
  title ILIKE '%김진권%' OR
  description ILIKE '%김진권%' OR
  array_to_string(tags, ',') ILIKE '%김진권%'
LIMIT 10;

-- 2. image_assets 테이블에서 "김진권" 검색
SELECT 
  id,
  cdn_url,
  alt_text,
  title,
  description,
  ai_tags,
  ai_text_extracted,
  created_at
FROM image_assets
WHERE 
  alt_text ILIKE '%김진권%' OR
  title ILIKE '%김진권%' OR
  description ILIKE '%김진권%' OR
  ai_text_extracted ILIKE '%김진권%' OR
  (ai_tags::text ILIKE '%김진권%')
LIMIT 10;

-- 3. 파일명에 "김진권"이 포함된 이미지 확인 (Storage 경로 기반)
-- 이 쿼리는 직접 실행 불가, API에서 확인 필요

-- 4. 전체 메타데이터 개수 확인
SELECT 
  'image_metadata' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN alt_text IS NOT NULL AND alt_text != '' THEN 1 END) as has_alt_text,
  COUNT(CASE WHEN title IS NOT NULL AND title != '' THEN 1 END) as has_title,
  COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as has_description
FROM image_metadata
UNION ALL
SELECT 
  'image_assets' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN alt_text IS NOT NULL AND alt_text != '' THEN 1 END) as has_alt_text,
  COUNT(CASE WHEN title IS NOT NULL AND title != '' THEN 1 END) as has_title,
  COUNT(CASE WHEN description IS NOT NULL AND description != '' THEN 1 END) as has_description
FROM image_assets;

-- 5. "김진권"이 포함된 모든 필드 확인 (대소문자 구분 없음)
SELECT 
  'image_metadata' as source,
  id,
  image_url,
  alt_text,
  title,
  description
FROM image_metadata
WHERE 
  LOWER(COALESCE(alt_text, '')) LIKE '%김진권%' OR
  LOWER(COALESCE(title, '')) LIKE '%김진권%' OR
  LOWER(COALESCE(description, '')) LIKE '%김진권%'
UNION ALL
SELECT 
  'image_assets' as source,
  id::text,
  cdn_url as image_url,
  alt_text,
  title,
  description
FROM image_assets
WHERE 
  LOWER(COALESCE(alt_text, '')) LIKE '%김진권%' OR
  LOWER(COALESCE(title, '')) LIKE '%김진권%' OR
  LOWER(COALESCE(description, '')) LIKE '%김진권%';
