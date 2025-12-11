-- 제품 합성 테이블의 image_url을 .png에서 .webp로 업데이트
-- goods 폴더의 모자 제품 이미지 경로 수정

-- 1. image_url에서 .png를 .webp로 변경
UPDATE product_composition
SET image_url = REPLACE(image_url, '.png', '.webp')
WHERE image_url LIKE '%.png';

-- 2. color_variants JSONB 필드 내부의 .png도 .webp로 변경
UPDATE product_composition
SET color_variants = (
  SELECT jsonb_object_agg(
    key,
    REPLACE(value::text, '.png', '.webp')::text
  )
  FROM jsonb_each_text(color_variants)
)
WHERE color_variants IS NOT NULL
  AND color_variants::text LIKE '%.png%';

-- 3. reference_images 배열 내부의 .png도 .webp로 변경
UPDATE product_composition
SET reference_images = (
  SELECT jsonb_agg(
    REPLACE(value::text, '.png', '.webp')
  )
  FROM jsonb_array_elements_text(reference_images)
)
WHERE reference_images IS NOT NULL
  AND reference_images::text LIKE '%.png%';

-- 4. goods 폴더의 모자 제품들 특별 처리
-- beige-golf-cap
UPDATE product_composition
SET image_url = '/main/products/goods/beige-golf-cap.webp'
WHERE image_url LIKE '%beige-golf-cap%'
  AND image_url NOT LIKE '%.webp';

-- black-bucket-hat
UPDATE product_composition
SET image_url = '/main/products/goods/black-bucket-hat.webp'
WHERE image_url LIKE '%black-bucket-hat%'
  AND image_url NOT LIKE '%.webp';

-- black-golf-cap
UPDATE product_composition
SET image_url = '/main/products/goods/black-golf-cap.webp'
WHERE image_url LIKE '%black-golf-cap%'
  AND image_url NOT LIKE '%.webp';

-- navy-golf-cap
UPDATE product_composition
SET image_url = '/main/products/goods/navy-golf-cap.webp'
WHERE image_url LIKE '%navy-golf-cap%'
  AND image_url NOT LIKE '%.webp';

-- white-bucket-hat
UPDATE product_composition
SET image_url = '/main/products/goods/white-bucket-hat.webp'
WHERE image_url LIKE '%white-bucket-hat%'
  AND image_url NOT LIKE '%.webp';

-- white-golf-cap
UPDATE product_composition
SET image_url = '/main/products/goods/white-golf-cap.webp'
WHERE image_url LIKE '%white-golf-cap%'
  AND image_url NOT LIKE '%.webp';

-- 5. 업데이트 결과 확인
SELECT 
  id,
  name,
  image_url,
  color_variants,
  reference_images
FROM product_composition
WHERE composition_target = 'head'
ORDER BY display_order;

