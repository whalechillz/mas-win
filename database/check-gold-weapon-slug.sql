-- 시크리트웨폰 골드 4.1 slug 확인 및 업데이트

-- 1. products 테이블에서 기존 slug 확인
SELECT 
  id,
  name,
  slug,
  sku,
  detail_images,
  gallery_images,
  composition_images
FROM products
WHERE slug LIKE '%weapon%gold%4%'
   OR slug LIKE '%weapon%4%'
   OR slug LIKE '%gold%weapon%4%'
   OR name LIKE '%시크리트웨폰%골드%4%'
   OR name LIKE '%시크리트웨폰%4%'
ORDER BY slug;

-- 2. product_composition 테이블에서 기존 slug 확인
SELECT 
  id,
  name,
  slug,
  product_id
FROM product_composition
WHERE slug LIKE '%weapon%gold%4%'
   OR slug LIKE '%weapon%4%'
   OR slug LIKE '%gold%weapon%4%'
   OR name LIKE '%시크리트웨폰%골드%4%'
   OR name LIKE '%시크리트웨폰%4%'
ORDER BY slug;

-- 3. 업데이트 실행 (기존 slug를 새 slug로 변경)
UPDATE products 
SET 
  slug = 'secret-weapon-gold-4-1',
  updated_at = NOW()
WHERE (slug = 'gold-weapon4' 
   OR slug = 'secret-weapon-4-1'
   OR slug LIKE '%weapon%gold%4%')
   AND slug != 'secret-weapon-gold-4-1';

UPDATE product_composition 
SET 
  slug = 'secret-weapon-gold-4-1',
  updated_at = NOW()
WHERE (slug = 'gold-weapon4' 
   OR slug = 'secret-weapon-4-1'
   OR slug LIKE '%weapon%gold%4%')
   AND slug != 'secret-weapon-gold-4-1';

-- 4. 이미지 경로 업데이트 (products 테이블)
UPDATE products 
SET 
  detail_images = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%originals/products/gold-weapon4/%' 
          THEN replace(value::text, 'originals/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/')::jsonb
        WHEN value::text LIKE '%/main/products/gold-weapon4/%' 
          THEN replace(value::text, '/main/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/detail/')::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(detail_images) AS value
  ),
  gallery_images = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%originals/products/gold-weapon4/%' 
          THEN replace(value::text, 'originals/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/')::jsonb
        WHEN value::text LIKE '%/main/products/gold-weapon4/%' 
          THEN replace(value::text, '/main/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/gallery/')::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(gallery_images) AS value
  ),
  composition_images = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%originals/products/gold-weapon4/%' 
          THEN replace(value::text, 'originals/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/')::jsonb
        WHEN value::text LIKE '%/main/products/gold-weapon4/%' 
          THEN replace(value::text, '/main/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/composition/')::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(composition_images) AS value
  ),
  updated_at = NOW()
WHERE slug = 'secret-weapon-gold-4-1'
   AND (
     detail_images::text LIKE '%gold-weapon4%' 
     OR gallery_images::text LIKE '%gold-weapon4%'
     OR composition_images::text LIKE '%gold-weapon4%'
   );

-- 5. 최종 확인
SELECT 
  'products' as table_name,
  slug,
  name,
  detail_images,
  gallery_images
FROM products
WHERE slug = 'secret-weapon-gold-4-1';

SELECT 
  'product_composition' as table_name,
  slug,
  name
FROM product_composition
WHERE slug = 'secret-weapon-gold-4-1';
