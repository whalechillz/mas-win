-- image_metadata 테이블의 original_path 업데이트
-- originals/products/goods/* → originals/goods/* 로 변경
-- (갤러리 폴더로 이미지가 이동된 경우 반영)
-- 
-- 참고: image_metadata 테이블에는 folder_path 컬럼이 없고, original_path만 있습니다.
-- folder_path는 API에서 original_path를 기반으로 동적으로 생성됩니다.

-- 1. 현재 상태 확인
SELECT 
  '업데이트 전 상태' as status,
  COUNT(*) as total_count,
  COUNT(CASE WHEN original_path LIKE '%originals/products/goods/%' THEN 1 END) as old_path_count,
  COUNT(CASE WHEN original_path LIKE '%originals/goods/%' THEN 1 END) as new_path_count,
  COUNT(CASE WHEN image_url LIKE '%originals/products/goods/%' THEN 1 END) as old_url_count,
  COUNT(CASE WHEN image_url LIKE '%originals/goods/%' THEN 1 END) as new_url_count
FROM image_metadata
WHERE original_path LIKE '%goods%' 
   OR image_url LIKE '%goods%';

-- 2. original_path 업데이트
UPDATE image_metadata
SET 
  original_path = REPLACE(original_path, 'originals/products/goods/', 'originals/goods/'),
  image_url = REPLACE(image_url, 'originals/products/goods/', 'originals/goods/'),
  updated_at = NOW()
WHERE original_path LIKE '%originals/products/goods/%'
   OR image_url LIKE '%originals/products/goods/%';

-- 3. 업데이트 후 상태 확인
SELECT 
  '업데이트 후 상태' as status,
  COUNT(*) as total_count,
  COUNT(CASE WHEN original_path LIKE '%originals/products/goods/%' THEN 1 END) as old_path_count,
  COUNT(CASE WHEN original_path LIKE '%originals/goods/%' THEN 1 END) as new_path_count,
  COUNT(CASE WHEN image_url LIKE '%originals/products/goods/%' THEN 1 END) as old_url_count,
  COUNT(CASE WHEN image_url LIKE '%originals/goods/%' THEN 1 END) as new_url_count
FROM image_metadata
WHERE original_path LIKE '%goods%' 
   OR image_url LIKE '%goods%';

-- 4. 샘플 데이터 확인
SELECT 
  id,
  image_url,
  original_path,
  title,
  alt_text,
  updated_at
FROM image_metadata
WHERE original_path LIKE '%originals/goods/%'
   OR image_url LIKE '%originals/goods/%'
ORDER BY updated_at DESC
LIMIT 10;

