-- 제품 합성 관리의 모든 slug를 기준으로 제품 관리의 SKU 업데이트

-- 1. 제품 합성 관리의 모든 slug 확인
SELECT 
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  UPPER(REPLACE(pc.slug, '-', '_')) as expected_sku,
  pc.product_id,
  p.id as product_id,
  p.name as product_name,
  p.sku as current_sku,
  p.slug as product_slug,
  CASE 
    WHEN p.sku = UPPER(REPLACE(pc.slug, '-', '_')) THEN '✅ SKU 일치'
    WHEN p.slug = pc.slug THEN '✅ Slug 일치'
    WHEN pc.product_id = p.id THEN '✅ product_id 매칭'
    ELSE '❌ 불일치'
  END as match_status
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id OR pc.slug = p.slug
WHERE pc.slug IS NOT NULL 
  AND pc.slug != ''
ORDER BY pc.display_order, pc.slug;

-- 2. product_id로 연결된 제품들의 SKU 업데이트
UPDATE products p
SET 
  sku = UPPER(REPLACE(pc.slug, '-', '_')),
  slug = COALESCE(p.slug, pc.slug),
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id = p.id
  AND pc.slug IS NOT NULL
  AND pc.slug != ''
  AND (p.sku IS NULL OR p.sku != UPPER(REPLACE(pc.slug, '-', '_')))
  -- 중복 방지
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
      AND p2.id != p.id
  );

-- 3. slug로 매칭되는 경우 (product_id가 없는 경우)
UPDATE products p
SET 
  sku = UPPER(REPLACE(pc.slug, '-', '_')),
  slug = COALESCE(p.slug, pc.slug),
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id IS NULL
  AND pc.slug = p.slug
  AND pc.slug IS NOT NULL
  AND pc.slug != ''
  AND (p.sku IS NULL OR p.sku != UPPER(REPLACE(pc.slug, '-', '_')))
  -- 중복 방지
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = UPPER(REPLACE(pc.slug, '-', '_'))
      AND p2.id != p.id
  );

-- 4. 업데이트 결과 확인 (19개 제품 확인)
SELECT 
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  UPPER(REPLACE(pc.slug, '-', '_')) as expected_sku,
  p.id as product_id,
  p.name as product_name,
  p.sku as product_sku,
  p.slug as product_slug,
  CASE 
    WHEN p.sku = UPPER(REPLACE(pc.slug, '-', '_')) THEN '✅ SKU 일치'
    WHEN p.slug = pc.slug THEN '✅ Slug 일치'
    WHEN pc.product_id = p.id THEN '✅ product_id 매칭'
    ELSE '❌ 여전히 불일치'
  END as match_status
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id OR pc.slug = p.slug
WHERE pc.slug IS NOT NULL 
  AND pc.slug != ''
ORDER BY pc.display_order, pc.slug;

