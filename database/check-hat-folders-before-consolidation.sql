-- 폴더 정리 전 DB 확인
-- hat-black-bucket, hat-white-bucket, hat-white-golf 관련 데이터 확인

-- 1. product_composition 테이블 확인
SELECT 
  id,
  name,
  slug,
  category,
  composition_target,
  image_url,
  reference_images,
  is_active,
  display_order
FROM product_composition
WHERE slug IN ('hat-black-bucket', 'hat-white-bucket', 'hat-white-golf')
ORDER BY slug;

-- 2. products 테이블 확인
SELECT 
  id,
  name,
  slug,
  category,
  is_active,
  jsonb_array_length(COALESCE(gallery_images, '[]'::jsonb)) as gallery_count,
  jsonb_array_length(COALESCE(detail_images, '[]'::jsonb)) as detail_count,
  jsonb_array_length(COALESCE(composition_images, '[]'::jsonb)) as composition_count
FROM products
WHERE slug IN ('hat-black-bucket', 'hat-white-bucket', 'hat-white-golf', 'bucket-hat-muziik')
ORDER BY slug;

-- 3. bucket-hat-muziik의 현재 gallery_images 확인
SELECT 
  slug,
  name,
  gallery_images
FROM products
WHERE slug = 'bucket-hat-muziik';

