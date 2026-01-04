-- 뮤직 모자 4개 SKU 중복 확인

-- 1. 뮤직 모자 4개의 예상 SKU 확인
SELECT 
  'golf-hat-muziik-black' as slug,
  'GOLF_HAT_MUZIIK_BLACK' as expected_sku
UNION ALL
SELECT 
  'golf-hat-muziik-white' as slug,
  'GOLF_HAT_MUZIIK_WHITE' as expected_sku
UNION ALL
SELECT 
  'golf-hat-muziik-navy' as slug,
  'GOLF_HAT_MUZIIK_NAVY' as expected_sku
UNION ALL
SELECT 
  'golf-hat-muziik-beige' as slug,
  'GOLF_HAT_MUZIIK_BEIGE' as expected_sku;

-- 2. 예상 SKU가 이미 다른 제품에 사용되고 있는지 확인
SELECT 
  p.id,
  p.name,
  p.sku,
  p.slug,
  p.category,
  CASE 
    WHEN p.sku = 'GOLF_HAT_MUZIIK_BLACK' THEN 'golf-hat-muziik-black'
    WHEN p.sku = 'GOLF_HAT_MUZIIK_WHITE' THEN 'golf-hat-muziik-white'
    WHEN p.sku = 'GOLF_HAT_MUZIIK_NAVY' THEN 'golf-hat-muziik-navy'
    WHEN p.sku = 'GOLF_HAT_MUZIIK_BEIGE' THEN 'golf-hat-muziik-beige'
    ELSE NULL
  END as expected_slug,
  '⚠️ 중복 SKU 사용 중' as status
FROM products p
WHERE p.sku IN ('GOLF_HAT_MUZIIK_BLACK', 'GOLF_HAT_MUZIIK_WHITE', 'GOLF_HAT_MUZIIK_NAVY', 'GOLF_HAT_MUZIIK_BEIGE')
ORDER BY p.sku, p.id;

-- 3. 뮤직 모자 4개와 현재 products 테이블의 매칭 상태
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
    WHEN pc.product_id = p.id THEN '✅ product_id 매칭'
    ELSE '❌ 불일치'
  END as match_status
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id OR pc.slug = p.slug
WHERE pc.slug IN ('golf-hat-muziik-black', 'golf-hat-muziik-white', 'golf-hat-muziik-navy', 'golf-hat-muziik-beige')
ORDER BY pc.slug;

