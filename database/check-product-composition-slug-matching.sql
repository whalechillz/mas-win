-- 제품 합성 관리의 slug와 제품 관리의 SKU/slug 매칭 확인

-- 1. 제품 합성 관리의 모든 slug 확인
SELECT 
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  pc.category as composition_category,
  pc.product_id,
  p.id as product_id,
  p.name as product_name,
  p.sku as product_sku,
  p.slug as product_slug,
  p.category as product_category,
  p.product_type
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id OR pc.slug = p.slug
ORDER BY pc.category, pc.slug;

-- 2. 제품 합성 관리의 slug와 제품 관리의 SKU/slug가 매칭되지 않은 경우
SELECT 
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  pc.category as composition_category,
  pc.product_id,
  '❌ 매칭 안됨' as status
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id OR pc.slug = p.slug
WHERE p.id IS NULL
ORDER BY pc.category, pc.slug;

-- 3. 제품 합성 관리의 slug를 SKU로 변환했을 때 제품 관리에 존재하는지 확인
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
    WHEN p.sku = UPPER(REPLACE(pc.slug, '-', '_')) THEN '✅ SKU 매칭'
    WHEN p.slug = pc.slug THEN '✅ Slug 매칭'
    WHEN pc.product_id = p.id THEN '✅ product_id 매칭'
    ELSE '❌ 매칭 안됨'
  END as match_status
FROM product_composition pc
LEFT JOIN products p ON 
  p.sku = UPPER(REPLACE(pc.slug, '-', '_'))
  OR p.slug = pc.slug
  OR pc.product_id = p.id
ORDER BY pc.category, pc.slug;

-- 4. 드라이버 제품의 slug/SKU 매칭 확인 (특별 확인)
SELECT 
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  pc.category as composition_category,
  p.id as product_id,
  p.name as product_name,
  p.sku as product_sku,
  p.slug as product_slug,
  p.product_type,
  CASE 
    WHEN p.sku = UPPER(REPLACE(pc.slug, '-', '_')) THEN '✅ SKU 매칭'
    WHEN p.slug = pc.slug THEN '✅ Slug 매칭'
    WHEN pc.product_id = p.id THEN '✅ product_id 매칭'
    ELSE '❌ 매칭 안됨'
  END as match_status
FROM product_composition pc
LEFT JOIN products p ON 
  (p.sku = UPPER(REPLACE(pc.slug, '-', '_'))
   OR p.slug = pc.slug
   OR pc.product_id = p.id)
  AND p.product_type = 'driver'
WHERE pc.category = 'driver'
ORDER BY pc.slug;

