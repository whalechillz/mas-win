-- 설문 페이지용 제품 확인 및 수정
-- bucket-hat-muziik, golf-hat-muziik 제품 확인

-- 1. 현재 상태 확인
SELECT 
  slug,
  name,
  is_active,
  gallery_images,
  detail_images,
  composition_images,
  created_at,
  updated_at
FROM products
WHERE slug IN ('bucket-hat-muziik', 'golf-hat-muziik');

-- 2. 제품이 없거나 비활성화된 경우 활성화
UPDATE products
SET 
  is_active = true,
  updated_at = NOW()
WHERE slug IN ('bucket-hat-muziik', 'golf-hat-muziik')
  AND (is_active = false OR is_active IS NULL);

-- 3. gallery_images 경로 업데이트 (필요한 경우)
UPDATE products
SET 
  gallery_images = (
    SELECT jsonb_agg(
      to_jsonb(REPLACE(value::text, 'originals/products/goods/', 'originals/goods/'))
    )
    FROM jsonb_array_elements_text(gallery_images) AS t(value)
  ),
  updated_at = NOW()
WHERE slug IN ('bucket-hat-muziik', 'golf-hat-muziik')
  AND gallery_images::text LIKE '%originals/products/goods/%';

-- 4. 업데이트 후 확인
SELECT 
  slug,
  name,
  is_active,
  jsonb_array_length(gallery_images) as gallery_count,
  gallery_images
FROM products
WHERE slug IN ('bucket-hat-muziik', 'golf-hat-muziik');

