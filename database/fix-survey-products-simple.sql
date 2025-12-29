-- 설문 페이지 제품 이미지 경로 수정 (간단 버전)
-- products 테이블의 gallery_images만 업데이트

-- 1. 현재 상태 확인
SELECT 
  slug,
  name,
  is_active,
  jsonb_array_length(gallery_images) as gallery_count,
  gallery_images
FROM products
WHERE slug IN ('bucket-hat-muziik', 'golf-hat-muziik');

-- 2. gallery_images 경로 업데이트
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

-- 3. 제품 활성화 (없거나 비활성화된 경우)
UPDATE products
SET 
  is_active = true,
  updated_at = NOW()
WHERE slug IN ('bucket-hat-muziik', 'golf-hat-muziik')
  AND (is_active = false OR is_active IS NULL);

-- 4. 업데이트 후 확인
SELECT 
  slug,
  name,
  is_active,
  jsonb_array_length(gallery_images) as gallery_count
FROM products
WHERE slug IN ('bucket-hat-muziik', 'golf-hat-muziik');

