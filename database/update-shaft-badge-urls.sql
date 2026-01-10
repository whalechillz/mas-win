-- 샤프트 및 배지 이미지 URL 업데이트
-- product_composition 테이블의 각 제품에 샤프트/배지 이미지 URL 설정

-- V3 제품
UPDATE product_composition
SET 
  shaft_image_url = 'originals/products/secret-force-v3/composition/secret-force-v3-shaft.webp',
  badge_image_url = 'originals/products/secret-force-v3/composition/secret-force-v3-badge.webp'
WHERE slug = 'secret-force-v3';

-- PRO 3 제품
UPDATE product_composition
SET 
  shaft_image_url = 'originals/products/secret-force-pro-3/composition/secret-force-pro-3-shaft.webp',
  badge_image_url = 'originals/products/secret-force-pro-3/composition/secret-force-pro-3-badge.webp'
WHERE slug = 'secret-force-pro-3';

-- PRO 3 MUZIIK 제품 (배지만, 샤프트는 PRO 3와 동일)
UPDATE product_composition
SET 
  shaft_image_url = 'originals/products/secret-force-pro-3/composition/secret-force-pro-3-shaft.webp',
  badge_image_url = 'originals/products/secret-force-pro-3-muziik/composition/secret-force-pro-3-badge.webp'
WHERE slug = 'secret-force-pro-3-muziik';

-- 업데이트 결과 확인
SELECT 
  slug,
  name,
  shaft_image_url,
  badge_image_url
FROM product_composition
WHERE slug IN ('secret-force-v3', 'secret-force-pro-3', 'secret-force-pro-3-muziik')
ORDER BY slug;
