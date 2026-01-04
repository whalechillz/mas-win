-- 이미지 URL을 전체 Supabase URL로 변환
-- product_composition 테이블의 image_url과 reference_images 업데이트

-- ============================================
-- 1. product_composition 테이블: image_url 변환
-- ============================================

UPDATE product_composition
SET 
  image_url = CASE
    -- 이미 전체 URL인 경우 그대로 유지
    WHEN image_url LIKE 'https://%' THEN image_url
    -- 상대 경로인 경우 전체 URL로 변환
    WHEN image_url LIKE '/originals/%' THEN
      'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images' || image_url
    WHEN image_url LIKE 'originals/%' THEN
      'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/' || image_url
    -- /main/products/... 경로인 경우 변환 후 전체 URL로
    WHEN image_url LIKE '/main/products/%' THEN
      'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/' ||
      REPLACE(
        REPLACE(image_url, '/main/products/', 'originals/products/'),
        '/main/products/goods/', 'originals/goods/'
      )
    ELSE
      image_url
  END,
  updated_at = NOW()
WHERE image_url IS NOT NULL
  AND image_url != ''
  AND image_url NOT LIKE 'https://%';

-- ============================================
-- 2. product_composition 테이블: reference_images 변환 (수정)
-- ============================================

UPDATE product_composition
SET 
  reference_images = (
    SELECT jsonb_agg(
      CASE
        -- 이미 전체 URL인 경우 그대로 유지 (jsonb 유지)
        WHEN value::text LIKE 'https://%' THEN value::jsonb
        -- 상대 경로인 경우 전체 URL로 변환
        WHEN value::text LIKE '/originals/%' THEN
          to_jsonb('https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images' || value::text)
        WHEN value::text LIKE 'originals/%' THEN
          to_jsonb('https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/' || value::text)
        -- /main/products/... 경로인 경우 변환 후 전체 URL로
        WHEN value::text LIKE '/main/products/%' THEN
          to_jsonb(
            'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/' ||
            REPLACE(
              REPLACE(value::text, '/main/products/', 'originals/products/'),
              '/main/products/goods/', 'originals/goods/'
            )
          )
        ELSE
          value::jsonb
      END
    )
    FROM jsonb_array_elements(reference_images) AS t(value)
  ),
  updated_at = NOW()
WHERE reference_images IS NOT NULL
  AND jsonb_array_length(reference_images) > 0
  AND reference_images::text NOT LIKE '%https://%';

-- ============================================
-- 3. products 테이블: gallery_images 변환 (선택사항)
-- ============================================

-- 주의: products 테이블의 gallery_images는 상대 경로로 유지하는 것이 좋을 수 있음
-- (getProductImageUrl 함수가 자동으로 변환하므로)
-- 필요시 아래 주석을 해제하여 실행

/*
UPDATE products
SET 
  gallery_images = (
    SELECT jsonb_agg(
      CASE
        WHEN value::text LIKE 'https://%' THEN value
        WHEN value::text LIKE '/originals/%' THEN
          to_jsonb('https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images' || value::text)
        WHEN value::text LIKE 'originals/%' THEN
          to_jsonb('https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/' || value::text)
        ELSE
          value
      END
    )
    FROM jsonb_array_elements_text(gallery_images) AS t(value)
  ),
  updated_at = NOW()
WHERE gallery_images IS NOT NULL
  AND jsonb_array_length(gallery_images) > 0
  AND gallery_images::text NOT LIKE '%https://%';
*/

-- ============================================
-- 4. 변환 결과 확인
-- ============================================

-- 4-1. product_composition 테이블 확인
SELECT 
  id,
  name,
  slug,
  image_url,
  CASE 
    WHEN image_url LIKE 'https://%' THEN '✅ 전체 URL'
    ELSE '⚠️ 상대 경로'
  END as url_status,
  jsonb_array_length(COALESCE(reference_images, '[]'::jsonb)) as ref_count
FROM product_composition
WHERE category = 'hat'
ORDER BY display_order
LIMIT 20;

-- 4-2. 상대 경로가 남아있는지 확인
SELECT 
  COUNT(*) as remaining_relative_paths
FROM product_composition
WHERE image_url IS NOT NULL
  AND image_url != ''
  AND image_url NOT LIKE 'https://%'
  AND image_url NOT LIKE 'http://%';

