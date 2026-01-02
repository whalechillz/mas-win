-- 제품 합성 이미지 경로 수정
-- /main/products/... → originals/products/... 또는 originals/goods/... 로 변환
-- Supabase SQL Editor에서 실행하세요

-- 1. product_composition 테이블의 image_url 업데이트
-- 드라이버 제품: /main/products/{slug}/... → originals/products/{slug}/composition/...
UPDATE product_composition
SET 
  image_url = CASE
    -- 드라이버 제품 (category = 'driver')
    WHEN category = 'driver' AND image_url LIKE '/main/products/%' THEN
      REPLACE(
        REPLACE(image_url, '/main/products/', 'originals/products/'),
        '/detail/',
        '/composition/'
      )
    -- goods/hat/accessory 제품: /main/products/goods/... → originals/goods/...
    WHEN category IN ('goods', 'hat', 'accessory') AND image_url LIKE '/main/products/goods/%' THEN
      REPLACE(image_url, '/main/products/goods/', 'originals/goods/')
    -- 기타 /main/products/... 경로
    WHEN image_url LIKE '/main/products/%' THEN
      REPLACE(image_url, '/main/products/', 'originals/products/')
    ELSE
      image_url
  END,
  updated_at = NOW()
WHERE image_url LIKE '/main/products/%'
   OR image_url LIKE '%/main/products/%';

-- 2. product_composition 테이블의 reference_images 업데이트 (JSONB 배열)
UPDATE product_composition
SET 
  reference_images = (
    SELECT jsonb_agg(
      CASE
        -- 드라이버 제품
        WHEN value::text LIKE '/main/products/%' AND category = 'driver' THEN
          to_jsonb(
            REPLACE(
              REPLACE(value::text, '/main/products/', 'originals/products/'),
              '/detail/',
              '/composition/'
            )
          )
        -- goods/hat/accessory 제품
        WHEN value::text LIKE '/main/products/goods/%' AND category IN ('goods', 'hat', 'accessory') THEN
          to_jsonb(REPLACE(value::text, '/main/products/goods/', 'originals/goods/'))
        -- 기타
        WHEN value::text LIKE '/main/products/%' THEN
          to_jsonb(REPLACE(value::text, '/main/products/', 'originals/products/'))
        ELSE
          to_jsonb(value::text)
      END
    )
    FROM jsonb_array_elements_text(reference_images) AS t(value)
  ),
  updated_at = NOW()
WHERE reference_images::text LIKE '%/main/products/%';

-- 3. color_variants 필드 업데이트 (JSONB 객체)
UPDATE product_composition
SET 
  color_variants = (
    SELECT jsonb_object_agg(
      key,
      CASE
        -- 드라이버 제품
        WHEN value LIKE '/main/products/%' AND category = 'driver' THEN
          REPLACE(
            REPLACE(value, '/main/products/', 'originals/products/'),
            '/detail/',
            '/composition/'
          )
        -- goods/hat/accessory 제품
        WHEN value LIKE '/main/products/goods/%' AND category IN ('goods', 'hat', 'accessory') THEN
          REPLACE(value, '/main/products/goods/', 'originals/goods/')
        -- 기타
        WHEN value LIKE '/main/products/%' THEN
          REPLACE(value, '/main/products/', 'originals/products/')
        ELSE
          value
      END
    )
    FROM jsonb_each_text(color_variants) AS t(key, value)
  ),
  updated_at = NOW()
WHERE color_variants::text LIKE '%/main/products/%';

-- 4. 업데이트 결과 확인
SELECT 
  'product_composition (image_url)' as field_name,
  COUNT(*) as updated_count
FROM product_composition
WHERE image_url LIKE '%originals/products/%'
   OR image_url LIKE '%originals/goods/%'
UNION ALL
SELECT 
  'product_composition (reference_images)' as field_name,
  COUNT(*) as updated_count
FROM product_composition
WHERE reference_images::text LIKE '%originals/products/%'
   OR reference_images::text LIKE '%originals/goods/%'
UNION ALL
SELECT 
  'product_composition (color_variants)' as field_name,
  COUNT(*) as updated_count
FROM product_composition
WHERE color_variants::text LIKE '%originals/products/%'
   OR color_variants::text LIKE '%originals/goods/%';

-- 5. 아직 /main/products/ 경로가 남아있는지 확인
SELECT 
  id,
  name,
  category,
  image_url,
  updated_at
FROM product_composition
WHERE image_url LIKE '/main/products/%'
   OR image_url LIKE '%/main/products/%'
   OR reference_images::text LIKE '%/main/products/%'
   OR color_variants::text LIKE '%/main/products/%'
ORDER BY updated_at DESC;

