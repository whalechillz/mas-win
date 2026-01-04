-- 버킷햇 제품들의 slug를 bucket-hat-muziik-black/white 형식으로 업데이트

-- 1. 현재 상태 확인
SELECT 
  p.id,
  p.name,
  p.sku,
  p.slug,
  p.category,
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  pc.product_id
FROM products p
LEFT JOIN product_composition pc ON pc.product_id = p.id OR pc.slug = p.slug
WHERE p.sku IN ('MZ_BUCKET_BLACK', 'MZ_BUCKET_WHITE')
   OR p.name LIKE '%버킷%'
ORDER BY p.sku, p.name;

-- 2. MZ_BUCKET_BLACK 제품의 slug 업데이트
UPDATE products p
SET 
  slug = 'bucket-hat-muziik-black',
  updated_at = NOW()
WHERE p.sku = 'MZ_BUCKET_BLACK'
  AND (p.slug IS NULL OR p.slug != 'bucket-hat-muziik-black')
  -- 중복 방지: 해당 slug가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.slug = 'bucket-hat-muziik-black'
      AND p2.id != p.id
  );

-- 3. MZ_BUCKET_WHITE 제품의 slug 업데이트
UPDATE products p
SET 
  slug = 'bucket-hat-muziik-white',
  updated_at = NOW()
WHERE p.sku = 'MZ_BUCKET_WHITE'
  AND (p.slug IS NULL OR p.slug != 'bucket-hat-muziik-white')
  -- 중복 방지: 해당 slug가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.slug = 'bucket-hat-muziik-white'
      AND p2.id != p.id
  );

-- 4. 제품명으로 매칭되는 경우 (SKU가 다른 경우)
UPDATE products p
SET 
  slug = CASE 
    WHEN p.name LIKE '%버킷%블랙%' OR p.name LIKE '%버킷%black%' OR p.name LIKE '%bucket%black%' THEN 'bucket-hat-muziik-black'
    WHEN p.name LIKE '%버킷%화이트%' OR p.name LIKE '%버킷%white%' OR p.name LIKE '%bucket%white%' THEN 'bucket-hat-muziik-white'
    ELSE p.slug
  END,
  updated_at = NOW()
WHERE (p.slug IS NULL OR p.slug = '' OR p.slug NOT IN ('bucket-hat-muziik-black', 'bucket-hat-muziik-white'))
  AND p.category IN ('cap', 'bucket_hat', 'hat')
  AND (p.name LIKE '%버킷%' OR p.name LIKE '%bucket%')
  -- product_composition에 해당 slug가 존재하는지 확인
  AND EXISTS (
    SELECT 1 FROM product_composition pc
    WHERE pc.slug IN ('bucket-hat-muziik-black', 'bucket-hat-muziik-white')
      AND (
        ((p.name LIKE '%버킷%블랙%' OR p.name LIKE '%버킷%black%' OR p.name LIKE '%bucket%black%') AND pc.slug = 'bucket-hat-muziik-black')
        OR ((p.name LIKE '%버킷%화이트%' OR p.name LIKE '%버킷%white%' OR p.name LIKE '%bucket%white%') AND pc.slug = 'bucket-hat-muziik-white')
      )
  )
  -- 중복 방지: 해당 slug가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.id != p.id
      AND (
        ((p.name LIKE '%버킷%블랙%' OR p.name LIKE '%버킷%black%' OR p.name LIKE '%bucket%black%') AND p2.slug = 'bucket-hat-muziik-black')
        OR ((p.name LIKE '%버킷%화이트%' OR p.name LIKE '%버킷%white%' OR p.name LIKE '%bucket%white%') AND p2.slug = 'bucket-hat-muziik-white')
      )
  );

-- 5. 업데이트 결과 확인
SELECT 
  p.id,
  p.name,
  p.sku,
  p.slug,
  p.category,
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  CASE 
    WHEN p.slug = pc.slug THEN '✅ slug 일치'
    WHEN pc.slug IS NULL THEN '⚠️ 합성 데이터 없음'
    ELSE '❌ slug 불일치'
  END as match_status
FROM products p
LEFT JOIN product_composition pc ON pc.product_id = p.id OR pc.slug = p.slug
WHERE p.sku IN ('MZ_BUCKET_BLACK', 'MZ_BUCKET_WHITE')
   OR p.name LIKE '%버킷%'
ORDER BY p.sku, p.name;

