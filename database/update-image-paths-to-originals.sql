-- 웹사이트 경로 변경: /main/products/ → /originals/products/
-- Supabase SQL Editor에서 실행하세요

-- product_composition 테이블의 image_url 업데이트
UPDATE product_composition
SET 
  image_url = REPLACE(image_url, '/main/products/', '/originals/products/'),
  updated_at = NOW()
WHERE image_url LIKE '/main/products/%';

-- product_composition 테이블의 reference_images 업데이트 (JSONB 배열)
UPDATE product_composition
SET 
  reference_images = to_jsonb(
    ARRAY(
      SELECT REPLACE(value::text, '/main/products/', '/originals/products/')
      FROM jsonb_array_elements_text(reference_images)
    )
  )::jsonb,
  updated_at = NOW()
WHERE reference_images::text LIKE '%/main/products/%';

-- 업데이트 결과 확인
SELECT 
  id,
  name,
  image_url,
  reference_images,
  updated_at
FROM product_composition
WHERE image_url LIKE '/originals/products/%'
   OR reference_images::text LIKE '%/originals/products/%'
ORDER BY updated_at DESC
LIMIT 20;


