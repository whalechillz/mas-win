-- 폴더 정리 후 최종 확인

-- 1. product_composition 테이블 확인 (hat-* slug 제품이 비활성화되었는지)
SELECT 
  id,
  name,
  slug,
  category,
  is_active,
  image_url
FROM product_composition
WHERE slug IN ('hat-black-bucket', 'hat-white-bucket', 'hat-white-golf')
ORDER BY slug;

-- 2. bucket-hat-muziik의 gallery_images 확인 (새로 이동한 이미지 포함)
SELECT 
  slug,
  name,
  jsonb_array_length(COALESCE(gallery_images, '[]'::jsonb)) as gallery_count,
  gallery_images
FROM products
WHERE slug = 'bucket-hat-muziik';

-- 3. 활성화된 모자 제품 확인
SELECT 
  id,
  name,
  slug,
  category,
  composition_target,
  is_active
FROM product_composition
WHERE category = 'hat' AND is_active = true
ORDER BY display_order;

