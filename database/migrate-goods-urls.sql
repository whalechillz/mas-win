-- 굿즈 이미지 URL 업데이트
-- originals/products/goods/* → originals/goods/* 로 변경

-- 1. product_composition 테이블 업데이트
-- image_url 필드
UPDATE product_composition
SET 
  image_url = REPLACE(image_url, 'originals/products/goods/', 'originals/goods/'),
  updated_at = NOW()
WHERE category IN ('goods', 'hat', 'accessory')
  AND image_url LIKE '%originals/products/goods/%';

-- reference_images 필드 (JSONB 배열)
UPDATE product_composition
SET 
  reference_images = (
    SELECT jsonb_agg(
      REPLACE(value::text, 'originals/products/goods/', 'originals/goods/')::jsonb
    )
    FROM jsonb_array_elements_text(reference_images)
  ),
  updated_at = NOW()
WHERE category IN ('goods', 'hat', 'accessory')
  AND reference_images::text LIKE '%originals/products/goods/%';

-- color_variants 필드 (JSONB 객체)
UPDATE product_composition
SET 
  color_variants = (
    SELECT jsonb_object_agg(
      key,
      REPLACE(value::text, 'originals/products/goods/', 'originals/goods/')
    )
    FROM jsonb_each_text(color_variants)
  ),
  updated_at = NOW()
WHERE category IN ('goods', 'hat', 'accessory')
  AND color_variants::text LIKE '%originals/products/goods/%';

-- 2. image_metadata 테이블 업데이트
UPDATE image_metadata
SET 
  folder_path = REPLACE(folder_path, 'originals/products/goods/', 'originals/goods/'),
  original_path = REPLACE(original_path, 'originals/products/goods/', 'originals/goods/'),
  updated_at = NOW()
WHERE folder_path LIKE 'originals/products/goods/%'
   OR original_path LIKE '%originals/products/goods/%';

-- 3. 업데이트 결과 확인
SELECT 
  'product_composition' as table_name,
  COUNT(*) as updated_count
FROM product_composition
WHERE category IN ('goods', 'hat', 'accessory')
  AND (
    image_url LIKE '%originals/goods/%'
    OR reference_images::text LIKE '%originals/goods/%'
    OR color_variants::text LIKE '%originals/goods/%'
  )

UNION ALL

SELECT 
  'image_metadata' as table_name,
  COUNT(*) as updated_count
FROM image_metadata
WHERE folder_path LIKE 'originals/goods/%'
   OR original_path LIKE '%originals/goods/%';

