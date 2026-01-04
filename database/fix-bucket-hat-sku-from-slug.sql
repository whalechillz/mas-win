-- 버킷햇 제품들의 SKU를 slug 기준으로 업데이트
-- bucket-hat-muziik-black → BUCKET_HAT_MUZIIK_BLACK
-- bucket-hat-muziik-white → BUCKET_HAT_MUZIIK_WHITE

-- 1. 현재 상태 확인
SELECT 
  p.id,
  p.name,
  p.sku as current_sku,
  p.slug,
  UPPER(REPLACE(p.slug, '-', '_')) as expected_sku,
  p.category,
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  pc.product_id,
  CASE 
    WHEN p.sku = UPPER(REPLACE(p.slug, '-', '_')) THEN '✅ SKU 일치'
    WHEN p.slug = pc.slug THEN '✅ Slug 일치'
    ELSE '❌ 불일치'
  END as match_status
FROM products p
LEFT JOIN product_composition pc ON pc.product_id = p.id OR pc.slug = p.slug
WHERE p.sku IN ('MZ_BUCKET_BLACK', 'MZ_BUCKET_WHITE')
   OR p.slug IN ('bucket-hat-muziik-black', 'bucket-hat-muziik-white')
   OR p.name LIKE '%버킷%'
ORDER BY p.sku, p.name;

-- 2. slug가 bucket-hat-muziik-black인 제품의 SKU 업데이트
UPDATE products p
SET 
  sku = 'BUCKET_HAT_MUZIIK_BLACK',
  updated_at = NOW()
WHERE p.slug = 'bucket-hat-muziik-black'
  AND (p.sku IS NULL OR p.sku != 'BUCKET_HAT_MUZIIK_BLACK')
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'BUCKET_HAT_MUZIIK_BLACK'
      AND p2.id != p.id
  );

-- 3. slug가 bucket-hat-muziik-white인 제품의 SKU 업데이트
UPDATE products p
SET 
  sku = 'BUCKET_HAT_MUZIIK_WHITE',
  updated_at = NOW()
WHERE p.slug = 'bucket-hat-muziik-white'
  AND (p.sku IS NULL OR p.sku != 'BUCKET_HAT_MUZIIK_WHITE')
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'BUCKET_HAT_MUZIIK_WHITE'
      AND p2.id != p.id
  );

-- 4. product_composition의 slug를 기준으로 SKU 업데이트 (product_id로 연결된 경우)
UPDATE products p
SET 
  sku = UPPER(REPLACE(pc.slug, '-', '_')),
  slug = COALESCE(p.slug, pc.slug),
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id = p.id
  AND pc.slug IN ('bucket-hat-muziik-black', 'bucket-hat-muziik-white')
  AND (p.sku IS NULL OR p.sku != UPPER(REPLACE(pc.slug, '-', '_')))
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
      AND p2.id != p.id
  );

-- 5. slug로 매칭되는 경우 (product_id가 없는 경우)
UPDATE products p
SET 
  sku = UPPER(REPLACE(pc.slug, '-', '_')),
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id IS NULL
  AND pc.slug = p.slug
  AND pc.slug IN ('bucket-hat-muziik-black', 'bucket-hat-muziik-white')
  AND (p.sku IS NULL OR p.sku != UPPER(REPLACE(pc.slug, '-', '_')))
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
      AND p2.id != p.id
  );

-- 6. 제품명으로 매칭되는 경우 (slug가 없는 경우)
UPDATE products p
SET 
  slug = pc.slug,
  sku = UPPER(REPLACE(pc.slug, '-', '_')),
  updated_at = NOW()
FROM product_composition pc
WHERE (p.slug IS NULL OR p.slug = '' OR p.slug != pc.slug)
  AND pc.slug IN ('bucket-hat-muziik-black', 'bucket-hat-muziik-white')
  AND (
    (pc.slug = 'bucket-hat-muziik-black' AND (p.name LIKE '%버킷%블랙%' OR p.name LIKE '%버킷%black%' OR p.name LIKE '%bucket%black%'))
    OR
    (pc.slug = 'bucket-hat-muziik-white' AND (p.name LIKE '%버킷%화이트%' OR p.name LIKE '%버킷%white%' OR p.name LIKE '%bucket%white%'))
  )
  AND (p.sku IS NULL OR p.sku != UPPER(REPLACE(pc.slug, '-', '_')))
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
      AND p2.id != p.id
  )
  -- slug 중복 방지
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.slug = pc.slug
      AND p2.id != p.id
  );

-- 7. 업데이트 결과 확인
SELECT 
  p.id,
  p.name,
  p.sku,
  p.slug,
  UPPER(REPLACE(p.slug, '-', '_')) as expected_sku,
  p.category,
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  CASE 
    WHEN p.sku = UPPER(REPLACE(p.slug, '-', '_')) THEN '✅ SKU 일치'
    WHEN p.slug = pc.slug THEN '✅ Slug 일치'
    ELSE '❌ 여전히 불일치'
  END as match_status
FROM products p
LEFT JOIN product_composition pc ON pc.product_id = p.id OR pc.slug = p.slug
WHERE p.sku IN ('MZ_BUCKET_BLACK', 'MZ_BUCKET_WHITE', 'BUCKET_HAT_MUZIIK_BLACK', 'BUCKET_HAT_MUZIIK_WHITE')
   OR p.slug IN ('bucket-hat-muziik-black', 'bucket-hat-muziik-white')
   OR p.name LIKE '%버킷%'
ORDER BY p.sku, p.name;

