-- product_composition 테이블의 gold-weapon4 slug 수정 (공백 제거 및 업데이트)

-- 1단계: 앞뒤 공백 제거
UPDATE product_composition 
SET 
  slug = TRIM(slug),
  updated_at = NOW()
WHERE slug LIKE '%gold-weapon4%' OR slug LIKE '%secret-weapon-4-1%';

-- 2단계: gold-weapon4를 secret-weapon-gold-4-1로 업데이트
UPDATE product_composition 
SET 
  slug = 'secret-weapon-gold-4-1',
  updated_at = NOW()
WHERE slug = 'gold-weapon4' OR slug = 'secret-weapon-4-1';

-- 3단계: image_url 경로도 업데이트 (필요한 경우)
UPDATE product_composition 
SET 
  image_url = CASE 
    WHEN image_url LIKE '%originals/products/gold-weapon4%' 
      THEN replace(image_url, 'originals/products/gold-weapon4', 'originals/products/secret-weapon-gold-4-1')
    WHEN image_url LIKE '%/main/products/gold-weapon4%' 
      THEN replace(image_url, '/main/products/gold-weapon4', 'originals/products/secret-weapon-gold-4-1/detail')
    ELSE image_url
  END,
  updated_at = NOW()
WHERE image_url LIKE '%gold-weapon4%' OR image_url LIKE '%/main/products/gold-weapon4%';

-- 4단계: reference_images도 업데이트 (JSONB 배열)
UPDATE product_composition 
SET 
  reference_images = (
    SELECT jsonb_agg(
      CASE 
        WHEN value::text LIKE '%originals/products/gold-weapon4%' 
          THEN replace(value::text, 'originals/products/gold-weapon4', 'originals/products/secret-weapon-gold-4-1')::jsonb
        WHEN value::text LIKE '%/main/products/gold-weapon4%' 
          THEN replace(value::text, '/main/products/gold-weapon4', 'originals/products/secret-weapon-gold-4-1/detail')::jsonb
        ELSE value
      END
    )
    FROM jsonb_array_elements(COALESCE(reference_images, '[]'::jsonb)) AS value
  ),
  updated_at = NOW()
WHERE reference_images::text LIKE '%gold-weapon4%' OR reference_images::text LIKE '%/main/products/gold-weapon4%';

-- 5단계: 확인
SELECT 
  id,
  name,
  slug,
  image_url,
  reference_images
FROM product_composition
WHERE name LIKE '%골드 4.1%' OR slug LIKE '%gold%' OR slug LIKE '%weapon%'
ORDER BY name;
