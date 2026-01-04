-- 모자 제품의 slug와 SKU를 Supabase Storage 폴더 기준으로 업데이트
-- 이미지 경로에서 slug 추출하여 업데이트

-- 1. 이미지 경로에서 slug 추출 함수 (이미 생성되어 있으면 재사용)
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

-- 2. slug를 SKU로 변환 함수 (이미 생성되어 있으면 재사용)
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

-- 3. 모자 제품의 slug 업데이트 (이미지 경로에서 추출)
-- detail_images에서 slug 추출
UPDATE products p
SET 
  slug = COALESCE(
    p.slug, -- 기존 slug가 있으면 유지
    (
      SELECT extract_slug_from_image_path(img)
      FROM jsonb_array_elements_text(p.detail_images) AS img
      WHERE extract_slug_from_image_path(img) IS NOT NULL
      LIMIT 1
    )
  ),
  updated_at = NOW()
WHERE (p.slug IS NULL OR p.slug = '')
  AND p.category IN ('cap', 'bucket_hat', 'hat')
  AND p.detail_images IS NOT NULL
  AND jsonb_array_length(p.detail_images) > 0;

-- gallery_images에서 slug 추출 (detail_images에서 못 찾은 경우)
UPDATE products p
SET 
  slug = COALESCE(
    p.slug,
    (
      SELECT extract_slug_from_image_path(img)
      FROM jsonb_array_elements_text(p.gallery_images) AS img
      WHERE extract_slug_from_image_path(img) IS NOT NULL
      LIMIT 1
    )
  ),
  updated_at = NOW()
WHERE (p.slug IS NULL OR p.slug = '')
  AND p.category IN ('cap', 'bucket_hat', 'hat')
  AND p.gallery_images IS NOT NULL
  AND jsonb_array_length(p.gallery_images) > 0;

-- composition_images에서 slug 추출 (위에서 못 찾은 경우)
UPDATE products p
SET 
  slug = COALESCE(
    p.slug,
    (
      SELECT extract_slug_from_image_path(img)
      FROM jsonb_array_elements_text(p.composition_images) AS img
      WHERE extract_slug_from_image_path(img) IS NOT NULL
      LIMIT 1
    )
  ),
  updated_at = NOW()
WHERE (p.slug IS NULL OR p.slug = '')
  AND p.category IN ('cap', 'bucket_hat', 'hat')
  AND p.composition_images IS NOT NULL
  AND jsonb_array_length(p.composition_images) > 0;

-- 4. 제품명 기반 slug 매핑 (이미지가 없는 경우)
-- 버킷햇 색상별 매핑
UPDATE products
SET 
  slug = CASE 
    WHEN name LIKE '%버킷%화이트%' OR name LIKE '%버킷%white%' OR name LIKE '%bucket%white%' THEN 'bucket-hat-muziik-white'
    WHEN name LIKE '%버킷%블랙%' OR name LIKE '%버킷%black%' OR name LIKE '%bucket%black%' THEN 'bucket-hat-muziik-black'
    ELSE slug
  END,
  updated_at = NOW()
WHERE (slug IS NULL OR slug = '')
  AND category IN ('cap', 'bucket_hat', 'hat')
  AND (name LIKE '%버킷%' OR name LIKE '%bucket%');

-- 골프모자 색상별 매핑
UPDATE products
SET 
  slug = CASE 
    WHEN name LIKE '%골프%화이트%' OR name LIKE '%골프%white%' OR name LIKE '%golf%white%' THEN 'golf-hat-muziik-white'
    WHEN name LIKE '%골프%블랙%' OR name LIKE '%골프%black%' OR name LIKE '%golf%black%' THEN 'golf-hat-muziik-black'
    WHEN name LIKE '%골프%네이비%' OR name LIKE '%골프%navy%' OR name LIKE '%golf%navy%' THEN 'golf-hat-muziik-navy'
    WHEN name LIKE '%골프%베이지%' OR name LIKE '%골프%beige%' OR name LIKE '%golf%beige%' THEN 'golf-hat-muziik-beige'
    ELSE slug
  END,
  updated_at = NOW()
WHERE (slug IS NULL OR slug = '')
  AND category IN ('cap', 'bucket_hat', 'hat')
  AND (name LIKE '%골프%' OR name LIKE '%golf%');

-- MAS 한정판 모자 매핑
UPDATE products
SET 
  slug = CASE 
    WHEN name LIKE '%MAS%한정판%그레이%' OR name LIKE '%MAS%한정판%gray%' THEN 'mas-limited-cap-gray'
    WHEN name LIKE '%MAS%한정판%블랙%' OR name LIKE '%MAS%한정판%black%' THEN 'mas-limited-cap-black'
    ELSE slug
  END,
  updated_at = NOW()
WHERE (slug IS NULL OR slug = '')
  AND category IN ('cap', 'bucket_hat', 'hat')
  AND name LIKE '%MAS%한정판%';

-- 5. SKU 업데이트 (slug가 있는 경우)
UPDATE products
SET 
  sku = COALESCE(
    sku, -- 기존 SKU가 있으면 유지
    slug_to_sku(slug)
  ),
  updated_at = NOW()
WHERE (sku IS NULL OR sku = '')
  AND slug IS NOT NULL
  AND slug != ''
  AND category IN ('cap', 'bucket_hat', 'hat');

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
  END as gallery_images_count
FROM products
WHERE category IN ('cap', 'bucket_hat', 'hat')
ORDER BY category, name;

-- 7. slug나 SKU가 여전히 없는 제품 확인
SELECT 
  id,
  name,
  sku,
  slug,
  category,
  product_type,
  detail_images,
  gallery_images
FROM products
WHERE category IN ('cap', 'bucket_hat', 'hat')
  AND (slug IS NULL OR slug = '' OR sku IS NULL OR sku = '')
ORDER BY name;

