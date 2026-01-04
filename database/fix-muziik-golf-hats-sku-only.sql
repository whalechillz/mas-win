-- 뮤직 모자 4개만 우선 SKU 업데이트
-- golf-hat-muziik-black, golf-hat-muziik-white, golf-hat-muziik-navy, golf-hat-muziik-beige

-- 1. 현재 상태 확인 (뮤직 모자 4개)
SELECT 
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  pc.product_id,
  p.id as product_id,
  p.name as product_name,
  p.sku as product_sku,
  p.slug as product_slug,
  p.category as product_category,
  UPPER(REPLACE(pc.slug, '-', '_')) as expected_sku,
  CASE 
    WHEN p.sku = UPPER(REPLACE(pc.slug, '-', '_')) THEN '✅ SKU 일치'
    WHEN p.slug = pc.slug THEN '✅ Slug 일치'
    ELSE '❌ 불일치'
  END as match_status
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id OR pc.slug = p.slug
WHERE pc.slug IN ('golf-hat-muziik-black', 'golf-hat-muziik-white', 'golf-hat-muziik-navy', 'golf-hat-muziik-beige')
ORDER BY pc.slug;

-- 2. product_id로 연결된 뮤직 모자 4개의 SKU 업데이트 (중복 체크 강화)
UPDATE products p
SET 
  slug = COALESCE(p.slug, pc.slug),
  sku = UPPER(REPLACE(pc.slug, '-', '_')),
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id = p.id
  AND pc.slug IN ('golf-hat-muziik-black', 'golf-hat-muziik-white', 'golf-hat-muziik-navy', 'golf-hat-muziik-beige')
  -- ✅ 중복 체크: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
      AND p2.id != p.id
  );

-- 3. slug로 매칭되는 경우 (product_id가 없는 경우)
UPDATE products p
SET 
  slug = pc.slug,
  sku = UPPER(REPLACE(pc.slug, '-', '_')),
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id IS NULL
  AND pc.slug = p.slug
  AND pc.slug IN ('golf-hat-muziik-black', 'golf-hat-muziik-white', 'golf-hat-muziik-navy', 'golf-hat-muziik-beige')
  -- ✅ 중복 체크: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
      AND p2.id != p.id
  );

-- 4. 제품명으로 매칭되는 경우 (product_id와 slug 모두 없는 경우)
UPDATE products p
SET 
  slug = pc.slug,
  sku = UPPER(REPLACE(pc.slug, '-', '_')),
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id IS NULL
  AND (p.slug IS NULL OR p.slug = '' OR p.slug != pc.slug)
  AND pc.slug IN ('golf-hat-muziik-black', 'golf-hat-muziik-white', 'golf-hat-muziik-navy', 'golf-hat-muziik-beige')
  -- 골프모자 제품명 매칭
  AND (
    (pc.slug = 'golf-hat-muziik-black' AND (p.name LIKE '%골프%블랙%' OR p.name LIKE '%골프%black%' OR p.name LIKE '%golf%black%'))
    OR
    (pc.slug = 'golf-hat-muziik-white' AND (p.name LIKE '%골프%화이트%' OR p.name LIKE '%골프%white%' OR p.name LIKE '%golf%white%'))
    OR
    (pc.slug = 'golf-hat-muziik-navy' AND (p.name LIKE '%골프%네이비%' OR p.name LIKE '%골프%navy%' OR p.name LIKE '%golf%navy%'))
    OR
    (pc.slug = 'golf-hat-muziik-beige' AND (p.name LIKE '%골프%베이지%' OR p.name LIKE '%골프%beige%' OR p.name LIKE '%golf%beige%'))
  )
  -- ✅ 중복 체크: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
      AND p2.id != p.id
  )
  -- ✅ slug 중복 체크
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.slug = pc.slug
      AND p2.id != p.id
  );

-- 5. 업데이트 결과 확인
SELECT 
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  pc.product_id,
  p.id as product_id,
  p.name as product_name,
  p.sku as product_sku,
  p.slug as product_slug,
  UPPER(REPLACE(pc.slug, '-', '_')) as expected_sku,
  CASE 
    WHEN p.sku = UPPER(REPLACE(pc.slug, '-', '_')) THEN '✅ SKU 일치'
    WHEN p.slug = pc.slug THEN '✅ Slug 일치'
    ELSE '❌ 여전히 불일치'
  END as match_status
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id OR pc.slug = p.slug
WHERE pc.slug IN ('golf-hat-muziik-black', 'golf-hat-muziik-white', 'golf-hat-muziik-navy', 'golf-hat-muziik-beige')
ORDER BY pc.slug;

