-- image_metadata 테이블 구조 확인 및 folder_path 컬럼 확인

-- 1. 테이블 구조 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'image_metadata'
ORDER BY ordinal_position;

-- 2. folder_path 컬럼이 있는지 확인
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'image_metadata' 
      AND column_name = 'folder_path'
    ) THEN 'folder_path 컬럼 존재'
    ELSE 'folder_path 컬럼 없음'
  END as folder_path_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'image_metadata' 
      AND column_name = 'original_path'
    ) THEN 'original_path 컬럼 존재'
    ELSE 'original_path 컬럼 없음'
  END as original_path_status;

-- 3. folder_path가 있다면 샘플 데이터 확인
SELECT 
  id,
  image_url,
  folder_path,
  original_path,
  title,
  alt_text
FROM image_metadata
WHERE folder_path IS NOT NULL 
   OR original_path IS NOT NULL
LIMIT 5;

-- 4. goods 관련 경로가 있는지 확인 (image_url 기준)
SELECT 
  COUNT(*) as total_count,
  COUNT(CASE WHEN image_url LIKE '%originals/products/goods/%' THEN 1 END) as old_path_count,
  COUNT(CASE WHEN image_url LIKE '%originals/goods/%' THEN 1 END) as new_path_count
FROM image_metadata
WHERE image_url LIKE '%goods%';

