-- 제품 slug 마이그레이션 SQL
-- 기존 slug를 새 slug로 변경

-- 1. products 테이블 slug 업데이트
UPDATE products 
SET 
  slug = CASE 
    WHEN slug = 'black-beryl' THEN 'secret-weapon-black-muziik'
    WHEN slug = 'black-weapon' THEN 'secret-weapon-black'
    WHEN slug = 'gold-weapon4' THEN 'secret-weapon-gold-4-1'
    WHEN slug = 'gold2' THEN 'secret-force-gold-2'
    WHEN slug = 'gold2-sapphire' THEN 'secret-force-gold-2-muziik'
    WHEN slug = 'pro3-muziik' THEN 'secret-force-pro-3-muziik'
    WHEN slug = 'pro3' THEN 'secret-force-pro-3'
    WHEN slug = 'v3' THEN 'secret-force-v3'
    ELSE slug
  END,
  updated_at = NOW()
WHERE slug IN ('black-beryl', 'black-weapon', 'gold-weapon4', 'gold2', 'gold2-sapphire', 'pro3-muziik', 'pro3', 'v3');

-- 2. product_composition 테이블 slug 업데이트
UPDATE product_composition 
SET 
  slug = CASE 
    WHEN slug = 'black-beryl' THEN 'secret-weapon-black-muziik'
    WHEN slug = 'black-weapon' THEN 'secret-weapon-black'
    WHEN slug = 'gold-weapon4' THEN 'secret-weapon-gold-4-1'
    WHEN slug = 'secret-weapon-4-1' THEN 'secret-weapon-gold-4-1'
    WHEN slug = 'gold2' THEN 'secret-force-gold-2'
    WHEN slug = 'gold2-sapphire' THEN 'secret-force-gold-2-muziik'
    WHEN slug = 'pro3-muziik' THEN 'secret-force-pro-3-muziik'
    WHEN slug = 'pro3' THEN 'secret-force-pro-3'
    WHEN slug = 'v3' THEN 'secret-force-v3'
    ELSE slug
  END,
  updated_at = NOW()
WHERE slug IN ('black-beryl', 'black-weapon', 'gold-weapon4', 'secret-weapon-4-1', 'gold2', 'gold2-sapphire', 'pro3-muziik', 'pro3', 'v3');

-- 3. products 테이블 이미지 경로 업데이트 (detail_images)
UPDATE products 
SET 
  detail_images = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%originals/products/black-beryl/%' 
          THEN replace(value::text, 'originals/products/black-beryl/', 'originals/products/secret-weapon-black-muziik/')::jsonb
        WHEN value::text LIKE '%originals/products/black-weapon/%' 
          THEN replace(value::text, 'originals/products/black-weapon/', 'originals/products/secret-weapon-black/')::jsonb
        WHEN value::text LIKE '%originals/products/gold-weapon4/%' 
          THEN replace(value::text, 'originals/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/')::jsonb
        WHEN value::text LIKE '%originals/products/gold2/%' 
          THEN replace(value::text, 'originals/products/gold2/', 'originals/products/secret-force-gold-2/')::jsonb
        WHEN value::text LIKE '%originals/products/gold2-sapphire/%' 
          THEN replace(value::text, 'originals/products/gold2-sapphire/', 'originals/products/secret-force-gold-2-muziik/')::jsonb
        WHEN value::text LIKE '%originals/products/pro3-muziik/%' 
          THEN replace(value::text, 'originals/products/pro3-muziik/', 'originals/products/secret-force-pro-3-muziik/')::jsonb
        WHEN value::text LIKE '%originals/products/pro3/%' 
          THEN replace(value::text, 'originals/products/pro3/', 'originals/products/secret-force-pro-3/')::jsonb
        WHEN value::text LIKE '%originals/products/v3/%' 
          THEN replace(value::text, 'originals/products/v3/', 'originals/products/secret-force-v3/')::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(detail_images) AS value
  ),
  updated_at = NOW()
WHERE detail_images IS NOT NULL 
  AND (
    detail_images::text LIKE '%originals/products/black-beryl/%' OR
    detail_images::text LIKE '%originals/products/black-weapon/%' OR
    detail_images::text LIKE '%originals/products/gold-weapon4/%' OR
    detail_images::text LIKE '%originals/products/gold2/%' OR
    detail_images::text LIKE '%originals/products/gold2-sapphire/%' OR
    detail_images::text LIKE '%originals/products/pro3-muziik/%' OR
    detail_images::text LIKE '%originals/products/pro3/%' OR
    detail_images::text LIKE '%originals/products/v3/%'
  );

-- 4. products 테이블 이미지 경로 업데이트 (gallery_images)
UPDATE products 
SET 
  gallery_images = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%originals/products/black-beryl/%' 
          THEN replace(value::text, 'originals/products/black-beryl/', 'originals/products/secret-weapon-black-muziik/')::jsonb
        WHEN value::text LIKE '%originals/products/black-weapon/%' 
          THEN replace(value::text, 'originals/products/black-weapon/', 'originals/products/secret-weapon-black/')::jsonb
        WHEN value::text LIKE '%originals/products/gold-weapon4/%' 
          THEN replace(value::text, 'originals/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/')::jsonb
        WHEN value::text LIKE '%originals/products/gold2/%' 
          THEN replace(value::text, 'originals/products/gold2/', 'originals/products/secret-force-gold-2/')::jsonb
        WHEN value::text LIKE '%originals/products/gold2-sapphire/%' 
          THEN replace(value::text, 'originals/products/gold2-sapphire/', 'originals/products/secret-force-gold-2-muziik/')::jsonb
        WHEN value::text LIKE '%originals/products/pro3-muziik/%' 
          THEN replace(value::text, 'originals/products/pro3-muziik/', 'originals/products/secret-force-pro-3-muziik/')::jsonb
        WHEN value::text LIKE '%originals/products/pro3/%' 
          THEN replace(value::text, 'originals/products/pro3/', 'originals/products/secret-force-pro-3/')::jsonb
        WHEN value::text LIKE '%originals/products/v3/%' 
          THEN replace(value::text, 'originals/products/v3/', 'originals/products/secret-force-v3/')::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(gallery_images) AS value
  ),
  updated_at = NOW()
WHERE gallery_images IS NOT NULL 
  AND (
    gallery_images::text LIKE '%originals/products/black-beryl/%' OR
    gallery_images::text LIKE '%originals/products/black-weapon/%' OR
    gallery_images::text LIKE '%originals/products/gold-weapon4/%' OR
    gallery_images::text LIKE '%originals/products/gold2/%' OR
    gallery_images::text LIKE '%originals/products/gold2-sapphire/%' OR
    gallery_images::text LIKE '%originals/products/pro3-muziik/%' OR
    gallery_images::text LIKE '%originals/products/pro3/%' OR
    gallery_images::text LIKE '%originals/products/v3/%'
  );

-- 5. products 테이블 이미지 경로 업데이트 (composition_images)
UPDATE products 
SET 
  composition_images = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%originals/products/black-beryl/%' 
          THEN replace(value::text, 'originals/products/black-beryl/', 'originals/products/secret-weapon-black-muziik/')::jsonb
        WHEN value::text LIKE '%originals/products/black-weapon/%' 
          THEN replace(value::text, 'originals/products/black-weapon/', 'originals/products/secret-weapon-black/')::jsonb
        WHEN value::text LIKE '%originals/products/gold-weapon4/%' 
          THEN replace(value::text, 'originals/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/')::jsonb
        WHEN value::text LIKE '%originals/products/gold2/%' 
          THEN replace(value::text, 'originals/products/gold2/', 'originals/products/secret-force-gold-2/')::jsonb
        WHEN value::text LIKE '%originals/products/gold2-sapphire/%' 
          THEN replace(value::text, 'originals/products/gold2-sapphire/', 'originals/products/secret-force-gold-2-muziik/')::jsonb
        WHEN value::text LIKE '%originals/products/pro3-muziik/%' 
          THEN replace(value::text, 'originals/products/pro3-muziik/', 'originals/products/secret-force-pro-3-muziik/')::jsonb
        WHEN value::text LIKE '%originals/products/pro3/%' 
          THEN replace(value::text, 'originals/products/pro3/', 'originals/products/secret-force-pro-3/')::jsonb
        WHEN value::text LIKE '%originals/products/v3/%' 
          THEN replace(value::text, 'originals/products/v3/', 'originals/products/secret-force-v3/')::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(composition_images) AS value
  ),
  updated_at = NOW()
WHERE composition_images IS NOT NULL 
  AND (
    composition_images::text LIKE '%originals/products/black-beryl/%' OR
    composition_images::text LIKE '%originals/products/black-weapon/%' OR
    composition_images::text LIKE '%originals/products/gold-weapon4/%' OR
    composition_images::text LIKE '%originals/products/gold2/%' OR
    composition_images::text LIKE '%originals/products/gold2-sapphire/%' OR
    composition_images::text LIKE '%originals/products/pro3-muziik/%' OR
    composition_images::text LIKE '%originals/products/pro3/%' OR
    composition_images::text LIKE '%originals/products/v3/%'
  );

-- 6. 업데이트 결과 확인
SELECT 
  'products' as table_name,
  slug,
  COUNT(*) as count
FROM products
WHERE slug IN (
  'secret-weapon-black-muziik',
  'secret-weapon-black',
  'secret-weapon-gold-4-1',
  'secret-force-gold-2',
  'secret-force-gold-2-muziik',
  'secret-force-pro-3-muziik',
  'secret-force-pro-3',
  'secret-force-v3'
)
GROUP BY slug
ORDER BY slug;

SELECT 
  'product_composition' as table_name,
  slug,
  COUNT(*) as count
FROM product_composition
WHERE slug IN (
  'secret-weapon-black-muziik',
  'secret-weapon-black',
  'secret-weapon-gold-4-1',
  'secret-force-gold-2',
  'secret-force-gold-2-muziik',
  'secret-force-pro-3-muziik',
  'secret-force-pro-3',
  'secret-force-v3'
)
GROUP BY slug
ORDER BY slug;
