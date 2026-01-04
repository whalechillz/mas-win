-- MAS 한정판 모자 제품들의 SKU를 slug 기준으로 업데이트
-- mas-limited-cap-gray → MAS_LIMITED_CAP_GRAY
-- mas-limited-cap-black → MAS_LIMITED_CAP_BLACK

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
WHERE p.slug IN ('mas-limited-cap-gray', 'mas-limited-cap-black')
   OR p.name LIKE '%MAS%한정판%'
ORDER BY p.slug, p.name;

-- 2. slug가 mas-limited-cap-gray인 제품의 SKU 업데이트
UPDATE products p
SET 
  sku = 'MAS_LIMITED_CAP_GRAY',
  updated_at = NOW()
WHERE p.slug = 'mas-limited-cap-gray'
  AND (p.sku IS NULL OR p.sku != 'MAS_LIMITED_CAP_GRAY')
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'MAS_LIMITED_CAP_GRAY'
      AND p2.id != p.id
  );

-- 3. slug가 mas-limited-cap-black인 제품의 SKU 업데이트
UPDATE products p
SET 
  sku = 'MAS_LIMITED_CAP_BLACK',
  updated_at = NOW()
WHERE p.slug = 'mas-limited-cap-black'
  AND (p.sku IS NULL OR p.sku != 'MAS_LIMITED_CAP_BLACK')
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'MAS_LIMITED_CAP_BLACK'
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
  AND pc.slug IN ('mas-limited-cap-gray', 'mas-limited-cap-black')
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
  AND pc.slug IN ('mas-limited-cap-gray', 'mas-limited-cap-black')
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
  AND pc.slug IN ('mas-limited-cap-gray', 'mas-limited-cap-black')
  AND (
    (pc.slug = 'mas-limited-cap-gray' AND (p.name LIKE '%MAS%한정판%그레이%' OR p.name LIKE '%MAS%한정판%gray%'))
    OR
    (pc.slug = 'mas-limited-cap-black' AND (p.name LIKE '%MAS%한정판%블랙%' OR p.name LIKE '%MAS%한정판%black%'))
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
  pc.product_id,
  CASE 
    WHEN p.sku = UPPER(REPLACE(p.slug, '-', '_')) THEN '✅ SKU 일치'
    WHEN p.slug = pc.slug THEN '✅ Slug 일치'
    WHEN pc.product_id = p.id THEN '✅ product_id 매칭'
    ELSE '❌ 여전히 불일치'
  END as match_status
FROM products p
LEFT JOIN product_composition pc ON pc.product_id = p.id OR pc.slug = p.slug
WHERE p.slug IN ('mas-limited-cap-gray', 'mas-limited-cap-black')
   OR p.name LIKE '%MAS%한정판%'
ORDER BY p.slug, p.name;

