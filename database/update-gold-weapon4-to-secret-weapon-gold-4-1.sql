-- gold-weapon4 → secret-weapon-gold-4-1 완전 업데이트
-- 데이터베이스 slug와 이미지 경로를 정확히 매칭

-- ============================================
-- 1단계: products 테이블 slug 업데이트
-- ============================================
UPDATE products 
SET 
  slug = 'secret-weapon-gold-4-1',
  updated_at = NOW()
WHERE slug = 'gold-weapon4';

-- ============================================
-- 2단계: product_composition 테이블 slug 업데이트
-- ============================================
UPDATE product_composition 
SET 
  slug = 'secret-weapon-gold-4-1',
  updated_at = NOW()
WHERE slug = 'gold-weapon4';

-- ============================================
-- 3단계: products 테이블 이미지 경로 업데이트
-- ============================================
-- detail_images 업데이트
UPDATE products 
SET 
  detail_images = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%originals/products/gold-weapon4/%' 
          THEN replace(value::text, 'originals/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/')::jsonb
        WHEN value::text LIKE '%/main/products/gold-weapon4/%' 
          THEN replace(value::text, '/main/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/detail/')::jsonb
        WHEN value::text LIKE '%gold-weapon4%' 
          THEN replace(value::text, 'gold-weapon4', 'secret-weapon-gold-4-1')::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(COALESCE(detail_images, '[]'::jsonb)) AS value
  ),
  updated_at = NOW()
WHERE slug = 'secret-weapon-gold-4-1'
   AND (
     detail_images::text LIKE '%gold-weapon4%' 
     OR detail_images::text LIKE '%/main/products/gold-weapon4%'
   );

-- gallery_images 업데이트
UPDATE products 
SET 
  gallery_images = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%originals/products/gold-weapon4/%' 
          THEN replace(value::text, 'originals/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/')::jsonb
        WHEN value::text LIKE '%/main/products/gold-weapon4/%' 
          THEN replace(value::text, '/main/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/gallery/')::jsonb
        WHEN value::text LIKE '%gold-weapon4%' 
          THEN replace(value::text, 'gold-weapon4', 'secret-weapon-gold-4-1')::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(COALESCE(gallery_images, '[]'::jsonb)) AS value
  ),
  updated_at = NOW()
WHERE slug = 'secret-weapon-gold-4-1'
   AND (
     gallery_images::text LIKE '%gold-weapon4%' 
     OR gallery_images::text LIKE '%/main/products/gold-weapon4%'
   );

-- composition_images 업데이트
UPDATE products 
SET 
  composition_images = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%originals/products/gold-weapon4/%' 
          THEN replace(value::text, 'originals/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/')::jsonb
        WHEN value::text LIKE '%/main/products/gold-weapon4/%' 
          THEN replace(value::text, '/main/products/gold-weapon4/', 'originals/products/secret-weapon-gold-4-1/composition/')::jsonb
        WHEN value::text LIKE '%gold-weapon4%' 
          THEN replace(value::text, 'gold-weapon4', 'secret-weapon-gold-4-1')::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(COALESCE(composition_images, '[]'::jsonb)) AS value
  ),
  updated_at = NOW()
WHERE slug = 'secret-weapon-gold-4-1'
   AND (
     composition_images::text LIKE '%gold-weapon4%' 
     OR composition_images::text LIKE '%/main/products/gold-weapon4%'
   );

-- ============================================
-- 4단계: 최종 확인
-- ============================================
SELECT 
  'products 최종 확인' as step,
  slug,
  name,
  detail_images,
  gallery_images,
  composition_images
FROM products
WHERE slug = 'secret-weapon-gold-4-1';

SELECT 
  'product_composition 최종 확인' as step,
  slug,
  name
FROM product_composition
WHERE slug = 'secret-weapon-gold-4-1';

-- 모든 제품 slug 확인
SELECT 
  '모든 드라이버 제품 slug' as step,
  slug,
  name
FROM products
WHERE product_type = 'driver'
ORDER BY slug;

SELECT 
  '모든 드라이버 composition slug' as step,
  slug,
  name
FROM product_composition
WHERE category = 'driver'
ORDER BY slug;
