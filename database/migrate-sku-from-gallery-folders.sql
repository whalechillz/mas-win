-- SKU 마이그레이션: 갤러리 폴더명에서 SKU 자동 추출 및 업데이트
-- 드라이버 제품 포함

-- 1. 갤러리 폴더명에서 slug 추출 함수 (PostgreSQL)
CREATE OR REPLACE FUNCTION extract_slug_from_image_path(image_path TEXT)
RETURNS TEXT AS $$
BEGIN
  IF image_path IS NULL OR image_path = '' THEN
    RETURN NULL;
  END IF;
  
  -- originals/goods/{slug}/detail 또는 originals/products/{slug}/detail 패턴
  -- originals/goods/{slug}/gallery 또는 originals/products/{slug}/gallery 패턴
  -- originals/goods/{slug}/composition 또는 originals/products/{slug}/composition 패턴
  IF image_path ~ 'originals/(goods|products)/([^/]+)/(detail|gallery|composition)' THEN
    RETURN (regexp_match(image_path, 'originals/(?:goods|products)/([^/]+)/'))[1];
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. slug를 SKU로 변환 함수
CREATE OR REPLACE FUNCTION slug_to_sku(slug TEXT)
RETURNS TEXT AS $$
BEGIN
  IF slug IS NULL OR slug = '' THEN
    RETURN NULL;
  END IF;
  
  -- 소문자를 대문자로, 하이픈을 언더스코어로 변환
  RETURN UPPER(REPLACE(slug, '-', '_'));
END;
$$ LANGUAGE plpgsql;

-- 3. 제품별 갤러리 폴더명에서 SKU 추출 및 업데이트
-- detail_images, gallery_images, composition_images에서 slug 추출

-- 3-1. detail_images에서 SKU 추출
UPDATE products p
SET sku = COALESCE(
  p.sku, -- 기존 SKU가 있으면 유지
  (
    SELECT slug_to_sku(extract_slug_from_image_path(img))
    FROM jsonb_array_elements_text(p.detail_images) AS img
    WHERE extract_slug_from_image_path(img) IS NOT NULL
    LIMIT 1
  )
)
WHERE p.sku IS NULL OR p.sku = ''
  AND p.detail_images IS NOT NULL
  AND jsonb_array_length(p.detail_images) > 0;

-- 3-2. gallery_images에서 SKU 추출 (detail_images에서 못 찾은 경우)
UPDATE products p
SET sku = COALESCE(
  p.sku,
  (
    SELECT slug_to_sku(extract_slug_from_image_path(img))
    FROM jsonb_array_elements_text(p.gallery_images) AS img
    WHERE extract_slug_from_image_path(img) IS NOT NULL
    LIMIT 1
  )
)
WHERE (p.sku IS NULL OR p.sku = '')
  AND p.gallery_images IS NOT NULL
  AND jsonb_array_length(p.gallery_images) > 0;

-- 3-3. composition_images에서 SKU 추출 (위에서 못 찾은 경우)
UPDATE products p
SET sku = COALESCE(
  p.sku,
  (
    SELECT slug_to_sku(extract_slug_from_image_path(img))
    FROM jsonb_array_elements_text(p.composition_images) AS img
    WHERE extract_slug_from_image_path(img) IS NOT NULL
    LIMIT 1
  )
)
WHERE (p.sku IS NULL OR p.sku = '')
  AND p.composition_images IS NOT NULL
  AND jsonb_array_length(p.composition_images) > 0;

-- 4. slug가 있으면 slug에서 SKU 추출 (이미지가 없는 경우)
UPDATE products p
SET sku = COALESCE(
  p.sku,
  slug_to_sku(p.slug)
)
WHERE (p.sku IS NULL OR p.sku = '')
  AND p.slug IS NOT NULL
  AND p.slug != '';

-- 5. 드라이버 제품의 경우 slug에서 SKU 추출 (드라이버는 product_type='driver')
UPDATE products p
SET sku = COALESCE(
  p.sku,
  slug_to_sku(p.slug)
)
WHERE p.product_type = 'driver'
  AND (p.sku IS NULL OR p.sku = '')
  AND p.slug IS NOT NULL
  AND p.slug != '';

-- 6. 마이그레이션 결과 확인
SELECT 
  id,
  name,
  sku,
  slug,
  category,
  product_type,
  CASE 
    WHEN detail_images IS NOT NULL THEN jsonb_array_length(detail_images)
    ELSE 0
  END as detail_images_count,
  CASE 
    WHEN gallery_images IS NOT NULL THEN jsonb_array_length(gallery_images)
    ELSE 0
  END as gallery_images_count,
  CASE 
    WHEN composition_images IS NOT NULL THEN jsonb_array_length(composition_images)
    ELSE 0
  END as composition_images_count
FROM products
WHERE sku IS NOT NULL AND sku != ''
ORDER BY product_type, category, name;

-- 7. SKU가 여전히 없는 제품 확인
SELECT 
  id,
  name,
  sku,
  slug,
  category,
  product_type,
  detail_images,
  gallery_images,
  composition_images
FROM products
WHERE sku IS NULL OR sku = ''
ORDER BY product_type, category, name;

