-- 클러치백 이미지 업데이트 (새로운 WebP 파일 및 back 이미지 추가)
-- Supabase SQL Editor에서 실행하세요

-- 1. MASSGOO × MUZIIK 프리미엄 클러치백 (베이지)
UPDATE product_composition
SET image_url = '/main/products/goods/massgoo-muziik-clutch-beige-front.webp',
    reference_images = '["/main/products/goods/massgoo-muziik-clutch-beige-front.webp", "/main/products/goods/massgoo-muziik-clutch-beige-back.webp"]'::jsonb,
    updated_at = NOW()
WHERE slug = 'massgoo-muziik-clutch-beige';

-- 2. MASSGOO × MUZIIK 프리미엄 클러치백 (그레이)
UPDATE product_composition
SET image_url = '/main/products/goods/massgoo-muziik-clutch-gray-front.webp',
    reference_images = '["/main/products/goods/massgoo-muziik-clutch-gray-front.webp", "/main/products/goods/massgoo-muziik-clutch-gray-back.webp"]'::jsonb,
    updated_at = NOW()
WHERE slug = 'massgoo-muziik-clutch-gray';

-- 확인 쿼리
SELECT 
  slug,
  name,
  image_url,
  reference_images,
  jsonb_array_length(reference_images) as ref_count
FROM product_composition
WHERE slug IN (
  'massgoo-muziik-clutch-beige',
  'massgoo-muziik-clutch-gray'
)
ORDER BY display_order;

