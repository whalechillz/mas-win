-- MAS 한정판 모자 제품들의 SKU를 slug 기준으로 강제 업데이트
-- mas-limited-cap-gray → MAS_LIMITED_CAP_GRAY (LIMITED 포함)
-- mas-limited-cap-black → MAS_LIMITED_CAP_BLACK (LIMITED 포함)
-- 기존 MAS_CAP_GRAY, MAS_CAP_BLACK를 올바른 SKU로 변경

-- 1. 현재 상태 확인 (잘못된 SKU 포함)
SELECT 
  p.id,
  p.name,
  p.sku as current_sku,
  p.slug,
  UPPER(REPLACE(p.slug, '-', '_')) as expected_sku,
  p.category,
  CASE 
    WHEN p.sku = UPPER(REPLACE(p.slug, '-', '_')) THEN '✅ SKU 일치'
    WHEN p.sku IN ('MAS_CAP_GRAY', 'MAS_CAP_BLACK') THEN '⚠️ 잘못된 SKU (LIMITED 누락)'
    ELSE '❌ 불일치'
  END as match_status
FROM products p
WHERE p.slug IN ('mas-limited-cap-gray', 'mas-limited-cap-black')
   OR p.sku IN ('MAS_CAP_GRAY', 'MAS_CAP_BLACK', 'MAS_LIMITED_CAP_GRAY', 'MAS_LIMITED_CAP_BLACK')
   OR p.name LIKE '%MAS%한정판%'
ORDER BY p.slug, p.name;

-- 2. 잘못된 SKU를 올바른 SKU로 강제 업데이트 (MAS_CAP_GRAY → MAS_LIMITED_CAP_GRAY)
UPDATE products p
SET 
  sku = 'MAS_LIMITED_CAP_GRAY',
  updated_at = NOW()
WHERE (p.sku = 'MAS_CAP_GRAY' OR p.slug = 'mas-limited-cap-gray')
  AND p.sku != 'MAS_LIMITED_CAP_GRAY'
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'MAS_LIMITED_CAP_GRAY'
      AND p2.id != p.id
  );

-- 3. 잘못된 SKU를 올바른 SKU로 강제 업데이트 (MAS_CAP_BLACK → MAS_LIMITED_CAP_BLACK)
UPDATE products p
SET 
  sku = 'MAS_LIMITED_CAP_BLACK',
  updated_at = NOW()
WHERE (p.sku = 'MAS_CAP_BLACK' OR p.slug = 'mas-limited-cap-black')
  AND p.sku != 'MAS_LIMITED_CAP_BLACK'
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'MAS_LIMITED_CAP_BLACK'
      AND p2.id != p.id
  );

-- 4. slug가 있지만 SKU가 잘못된 경우 slug 기준으로 업데이트
UPDATE products p
SET 
  sku = UPPER(REPLACE(p.slug, '-', '_')),
  updated_at = NOW()
WHERE p.slug IN ('mas-limited-cap-gray', 'mas-limited-cap-black')
  AND p.sku != UPPER(REPLACE(p.slug, '-', '_'))
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = UPPER(REPLACE(p.slug, '-', '_'))
      AND p2.id != p.id
  );

-- 5. product_composition의 slug를 기준으로 SKU 강제 업데이트
UPDATE products p
SET 
  sku = UPPER(REPLACE(pc.slug, '-', '_')),
  slug = COALESCE(p.slug, pc.slug),
  updated_at = NOW()
FROM product_composition pc
WHERE (pc.product_id = p.id OR pc.slug = p.slug)
  AND pc.slug IN ('mas-limited-cap-gray', 'mas-limited-cap-black')
  AND p.sku != UPPER(REPLACE(pc.slug, '-', '_'))
  -- 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
      AND p2.id != p.id
  );

-- 6. 업데이트 결과 확인
SELECT 
  p.id,
  p.name,
  p.sku,
  p.slug,
  UPPER(REPLACE(p.slug, '-', '_')) as expected_sku,
  p.category,
  CASE 
    WHEN p.sku = UPPER(REPLACE(p.slug, '-', '_')) THEN '✅ SKU 일치'
    WHEN p.sku IN ('MAS_CAP_GRAY', 'MAS_CAP_BLACK') THEN '⚠️ 여전히 잘못된 SKU'
    ELSE '❌ 여전히 불일치'
  END as match_status
FROM products p
WHERE p.slug IN ('mas-limited-cap-gray', 'mas-limited-cap-black')
   OR p.sku IN ('MAS_CAP_GRAY', 'MAS_CAP_BLACK', 'MAS_LIMITED_CAP_GRAY', 'MAS_LIMITED_CAP_BLACK')
   OR p.name LIKE '%MAS%한정판%'
ORDER BY p.slug, p.name;

