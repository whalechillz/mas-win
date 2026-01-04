-- 제품 합성 관리의 slug를 기준으로 제품 관리의 SKU 업데이트
-- product_id로 연결된 제품들의 SKU를 product_composition의 slug 기반으로 업데이트

-- 1. 현재 상태 확인: product_id로 연결된 제품들의 SKU/slug 상태
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
INNER JOIN products p ON pc.product_id = p.id
WHERE pc.slug IS NOT NULL 
  AND pc.slug != ''
ORDER BY pc.category, pc.slug;

-- 2. product_id로 연결된 제품들의 SKU를 product_composition의 slug 기반으로 업데이트
-- (기존 SKU가 있어도 업데이트 - slug 기반이 우선)
UPDATE products p
SET 
  slug = COALESCE(p.slug, pc.slug), -- slug가 없으면 product_composition의 slug 사용
  sku = CASE 
    -- SKU가 없거나 slug 기반 SKU와 다르면 업데이트
    WHEN p.sku IS NULL OR p.sku = '' THEN UPPER(REPLACE(pc.slug, '-', '_'))
    WHEN p.sku != UPPER(REPLACE(pc.slug, '-', '_')) THEN 
      -- 중복 체크 후 업데이트
      CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM products p2
          WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
            AND p2.id != p.id
        ) THEN UPPER(REPLACE(pc.slug, '-', '_'))
        ELSE p.sku -- 중복이면 기존 SKU 유지
      END
    ELSE p.sku -- 이미 일치하면 유지
  END,
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id = p.id
  AND pc.slug IS NOT NULL
  AND pc.slug != ''
  -- SKU가 slug 기반과 다른 경우만 업데이트
  AND (
    p.sku IS NULL 
    OR p.sku = ''
    OR p.sku != UPPER(REPLACE(pc.slug, '-', '_'))
  );

-- 3. slug로 매칭되는 경우 (product_id가 없는 경우)
UPDATE products p
SET 
  slug = COALESCE(p.slug, pc.slug), -- slug가 없으면 product_composition의 slug 사용
  sku = CASE 
    WHEN p.sku IS NULL OR p.sku = '' THEN UPPER(REPLACE(pc.slug, '-', '_'))
    WHEN p.sku != UPPER(REPLACE(pc.slug, '-', '_')) THEN 
      CASE 
        WHEN NOT EXISTS (
          SELECT 1 FROM products p2
          WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
            AND p2.id != p.id
        ) THEN UPPER(REPLACE(pc.slug, '-', '_'))
        ELSE p.sku
      END
    ELSE p.sku
  END,
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id IS NULL
  AND pc.slug = p.slug
  AND pc.slug IS NOT NULL
  AND pc.slug != ''
  -- SKU가 slug 기반과 다른 경우만 업데이트
  AND (
    p.sku IS NULL 
    OR p.sku = ''
    OR p.sku != UPPER(REPLACE(pc.slug, '-', '_'))
  );

-- 4. 제품명으로 매칭되는 경우 (product_id와 slug 모두 없는 경우)
UPDATE products p
SET 
  slug = pc.slug,
  sku = CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM products p2
      WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
        AND p2.id != p.id
    ) THEN UPPER(REPLACE(pc.slug, '-', '_'))
    ELSE p.sku
  END,
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id IS NULL
  AND (p.slug IS NULL OR p.slug = '' OR p.slug != pc.slug)
  AND pc.slug IS NOT NULL
  AND pc.slug != ''
  -- 골프모자 매칭
  AND (
    (pc.slug LIKE '%golf-hat%' AND (p.name LIKE '%골프%' OR p.name LIKE '%golf%'))
    OR
    -- 버킷햇 매칭
    (pc.slug LIKE '%bucket-hat%' AND (p.name LIKE '%버킷%' OR p.name LIKE '%bucket%'))
    OR
    -- MAS 한정판 모자 매칭
    (pc.slug LIKE '%mas-limited%' AND p.name LIKE '%MAS%한정판%')
  )
  -- SKU가 slug 기반과 다른 경우만 업데이트
  AND (
    p.sku IS NULL 
    OR p.sku = ''
    OR p.sku != UPPER(REPLACE(pc.slug, '-', '_'))
  )
  -- 중복 방지
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
WHERE pc.slug IS NOT NULL 
  AND pc.slug != ''
ORDER BY pc.category, pc.slug;

