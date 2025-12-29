-- image_metadata 테이블의 folder_path 업데이트
-- originals/products/goods/* → originals/goods/* 로 변경
-- (갤러리 폴더로 이미지가 이동된 경우 반영)

-- 1. 현재 상태 확인
SELECT 
  '업데이트 전 상태' as status,
  COUNT(*) as total_count,
  COUNT(CASE WHEN folder_path LIKE 'originals/products/goods/%' THEN 1 END) as old_path_count,
  COUNT(CASE WHEN folder_path LIKE 'originals/goods/%' THEN 1 END) as new_path_count,
  COUNT(CASE WHEN original_path LIKE '%originals/products/goods/%' THEN 1 END) as old_original_path_count,
  COUNT(CASE WHEN original_path LIKE '%originals/goods/%' THEN 1 END) as new_original_path_count
FROM image_metadata
WHERE folder_path LIKE '%goods%' OR original_path LIKE '%goods%';

-- 2. folder_path 업데이트
UPDATE image_metadata
SET 
  folder_path = REPLACE(folder_path, 'originals/products/goods/', 'originals/goods/'),
  original_path = REPLACE(original_path, 'originals/products/goods/', 'originals/goods/'),
  updated_at = NOW()
WHERE folder_path LIKE 'originals/products/goods/%'
   OR original_path LIKE '%originals/products/goods/%';

-- 3. 업데이트 후 상태 확인
SELECT 
  '업데이트 후 상태' as status,
  COUNT(*) as total_count,
  COUNT(CASE WHEN folder_path LIKE 'originals/products/goods/%' THEN 1 END) as old_path_count,
  COUNT(CASE WHEN folder_path LIKE 'originals/goods/%' THEN 1 END) as new_path_count,
  COUNT(CASE WHEN original_path LIKE '%originals/products/goods/%' THEN 1 END) as old_original_path_count,
  COUNT(CASE WHEN original_path LIKE '%originals/goods/%' THEN 1 END) as new_original_path_count
FROM image_metadata
WHERE folder_path LIKE '%goods%' OR original_path LIKE '%goods%';

-- 4. 샘플 데이터 확인
SELECT 
  id,
  folder_path,
  original_path,
  name
FROM image_metadata
WHERE folder_path LIKE 'originals/goods/%'
   OR original_path LIKE '%originals/goods/%'
ORDER BY updated_at DESC
LIMIT 10;

