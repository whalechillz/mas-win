-- 제품 이미지 경로를 Supabase Storage 경로로 업데이트
-- 기존 경로: /main/products/goods/... 또는 /main/products/{product-slug}/...
-- 새로운 경로: /originals/products/goods/... 또는 /originals/products/{product-slug}/...

-- 1. 굿즈/액세서리 제품 (모자, 파우치)
UPDATE product_composition
SET 
  image_url = REPLACE(image_url, '/main/products/goods/', '/originals/products/goods/'),
  reference_images = (
    SELECT jsonb_agg(
      REPLACE(value::text, '/main/products/goods/', '/originals/products/goods/')::jsonb
    )
    FROM jsonb_array_elements_text(reference_images)
  ),
  updated_at = NOW()
WHERE category IN ('hat', 'accessory')
  AND (image_url LIKE '/main/products/goods/%' OR reference_images::text LIKE '%/main/products/goods/%');

-- 2. 드라이버 제품들
-- black-beryl
UPDATE product_composition
SET 
  image_url = REPLACE(image_url, '/main/products/black-beryl/', '/originals/products/black-beryl/'),
  reference_images = (
    SELECT jsonb_agg(
      REPLACE(value::text, '/main/products/black-beryl/', '/originals/products/black-beryl/')::jsonb
    )
    FROM jsonb_array_elements_text(reference_images)
  ),
  updated_at = NOW()
WHERE slug = 'black-beryl'
  AND (image_url LIKE '/main/products/black-beryl/%' OR reference_images::text LIKE '%/main/products/black-beryl/%');

-- black-weapon
UPDATE product_composition
SET 
  image_url = REPLACE(image_url, '/main/products/black-weapon/', '/originals/products/black-weapon/'),
  reference_images = (
    SELECT jsonb_agg(
      REPLACE(value::text, '/main/products/black-weapon/', '/originals/products/black-weapon/')::jsonb
    )
    FROM jsonb_array_elements_text(reference_images)
  ),
  updated_at = NOW()
WHERE slug LIKE '%black-weapon%'
  AND (image_url LIKE '/main/products/black-weapon/%' OR reference_images::text LIKE '%/main/products/black-weapon/%');

-- gold-weapon4
UPDATE product_composition
SET 
  image_url = REPLACE(image_url, '/main/products/gold-weapon4/', '/originals/products/gold-weapon4/'),
  reference_images = (
    SELECT jsonb_agg(
      REPLACE(value::text, '/main/products/gold-weapon4/', '/originals/products/gold-weapon4/')::jsonb
    )
    FROM jsonb_array_elements_text(reference_images)
  ),
  updated_at = NOW()
WHERE slug LIKE '%secret-weapon-4-1%'
  AND (image_url LIKE '/main/products/gold-weapon4/%' OR reference_images::text LIKE '%/main/products/gold-weapon4/%');

-- gold2
UPDATE product_composition
SET 
  image_url = REPLACE(image_url, '/main/products/gold2/', '/originals/products/gold2/'),
  reference_images = (
    SELECT jsonb_agg(
      REPLACE(value::text, '/main/products/gold2/', '/originals/products/gold2/')::jsonb
    )
    FROM jsonb_array_elements_text(reference_images)
  ),
  updated_at = NOW()
WHERE slug = 'gold2'
  AND (image_url LIKE '/main/products/gold2/%' OR reference_images::text LIKE '%/main/products/gold2/%');

-- gold2-sapphire
UPDATE product_composition
SET 
  image_url = REPLACE(image_url, '/main/products/gold2-sapphire/', '/originals/products/gold2-sapphire/'),
  reference_images = (
    SELECT jsonb_agg(
      REPLACE(value::text, '/main/products/gold2-sapphire/', '/originals/products/gold2-sapphire/')::jsonb
    )
    FROM jsonb_array_elements_text(reference_images)
  ),
  updated_at = NOW()
WHERE slug = 'gold2-sapphire'
  AND (image_url LIKE '/main/products/gold2-sapphire/%' OR reference_images::text LIKE '%/main/products/gold2-sapphire/%');

-- pro3
UPDATE product_composition
SET 
  image_url = REPLACE(image_url, '/main/products/pro3/', '/originals/products/pro3/'),
  reference_images = (
    SELECT jsonb_agg(
      REPLACE(value::text, '/main/products/pro3/', '/originals/products/pro3/')::jsonb
    )
    FROM jsonb_array_elements_text(reference_images)
  ),
  updated_at = NOW()
WHERE slug LIKE '%secret-force-pro-3%'
  AND (image_url LIKE '/main/products/pro3/%' OR reference_images::text LIKE '%/main/products/pro3/%');

-- pro3-muziik
UPDATE product_composition
SET 
  image_url = REPLACE(image_url, '/main/products/pro3-muziik/', '/originals/products/pro3-muziik/'),
  reference_images = (
    SELECT jsonb_agg(
      REPLACE(value::text, '/main/products/pro3-muziik/', '/originals/products/pro3-muziik/')::jsonb
    )
    FROM jsonb_array_elements_text(reference_images)
  ),
  updated_at = NOW()
WHERE slug LIKE '%pro3-muziik%'
  AND (image_url LIKE '/main/products/pro3-muziik/%' OR reference_images::text LIKE '%/main/products/pro3-muziik/%');

-- v3
UPDATE product_composition
SET 
  image_url = REPLACE(image_url, '/main/products/v3/', '/originals/products/v3/'),
  reference_images = (
    SELECT jsonb_agg(
      REPLACE(value::text, '/main/products/v3/', '/originals/products/v3/')::jsonb
    )
    FROM jsonb_array_elements_text(reference_images)
  ),
  updated_at = NOW()
WHERE slug LIKE '%secret-force-v3%'
  AND (image_url LIKE '/main/products/v3/%' OR reference_images::text LIKE '%/main/products/v3/%');

-- 확인 쿼리
SELECT 
  slug,
  name,
  category,
  image_url,
  reference_images,
  updated_at
FROM product_composition
WHERE image_url LIKE '/originals/products/%'
ORDER BY updated_at DESC;

