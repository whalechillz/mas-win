-- 제품 합성 관리 slug가 있지만 제품 관리에서 매칭되지 않은 제품들의 SKU 업데이트
-- 검증 결과: 10개 제품이 매칭되지 않음

-- 1. 매칭되지 않은 제품 확인
SELECT 
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  UPPER(REPLACE(pc.slug, '-', '_')) as expected_sku,
  pc.product_id,
  p.id as product_id,
  p.name as product_name,
  p.sku as current_sku,
  p.slug as product_slug
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id OR pc.slug = p.slug
WHERE pc.slug IS NOT NULL 
  AND pc.slug != ''
  AND p.id IS NULL
ORDER BY pc.display_order, pc.slug;

-- 2. 제품명으로 매칭하여 SKU 업데이트 (드라이버 제품)
-- 시크리트포스 PRO 3
UPDATE products p
SET 
  sku = 'SECRET_FORCE_PRO_3',
  slug = COALESCE(p.slug, 'secret-force-pro-3'),
  updated_at = NOW()
WHERE (p.name LIKE '%시크리트포스%PRO%3%' OR p.name LIKE '%PRO 3%')
  AND (p.sku IS NULL OR p.sku != 'SECRET_FORCE_PRO_3')
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'SECRET_FORCE_PRO_3' AND p2.id != p.id
  );

-- 시크리트포스 V3
UPDATE products p
SET 
  sku = 'SECRET_FORCE_V3',
  slug = COALESCE(p.slug, 'secret-force-v3'),
  updated_at = NOW()
WHERE (p.name LIKE '%시크리트포스%V3%' OR p.name LIKE '%V3%')
  AND p.product_type = 'driver'
  AND (p.sku IS NULL OR p.sku != 'SECRET_FORCE_V3')
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'SECRET_FORCE_V3' AND p2.id != p.id
  );

-- 시크리트웨폰 블랙
UPDATE products p
SET 
  sku = 'SECRET_WEAPON_BLACK',
  slug = COALESCE(p.slug, 'secret-weapon-black'),
  updated_at = NOW()
WHERE (p.name LIKE '%시크리트웨폰%블랙%' OR p.name LIKE '%블랙 웨폰%')
  AND p.product_type = 'driver'
  AND (p.sku IS NULL OR p.sku != 'SECRET_WEAPON_BLACK')
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'SECRET_WEAPON_BLACK' AND p2.id != p.id
  );

-- 시크리트웨폰 골드 4.1
UPDATE products p
SET 
  sku = 'SECRET_WEAPON_GOLD_4_1',
  slug = COALESCE(p.slug, 'secret-weapon-gold-4-1'),
  updated_at = NOW()
WHERE (p.name LIKE '%시크리트웨폰%골드%4.1%' OR p.name LIKE '%골드 4.1%')
  AND p.product_type = 'driver'
  AND (p.sku IS NULL OR p.sku != 'SECRET_WEAPON_GOLD_4_1')
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'SECRET_WEAPON_GOLD_4_1' AND p2.id != p.id
  );

-- 3. 제품명으로 매칭하여 SKU 업데이트 (모자 제품)
-- 마쓰구 화이트캡
UPDATE products p
SET 
  sku = 'MASSGOO_WHITE_CAP',
  slug = COALESCE(p.slug, 'massgoo-white-cap'),
  updated_at = NOW()
WHERE (p.name LIKE '%마쓰구%화이트%캡%' OR p.name LIKE '%화이트캡%')
  AND (p.sku IS NULL OR p.sku != 'MASSGOO_WHITE_CAP')
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'MASSGOO_WHITE_CAP' AND p2.id != p.id
  );

-- 마쓰구 블랙캡
UPDATE products p
SET 
  sku = 'MASSGOO_BLACK_CAP',
  slug = COALESCE(p.slug, 'massgoo-black-cap'),
  updated_at = NOW()
WHERE (p.name LIKE '%마쓰구%블랙%캡%' OR p.name LIKE '%블랙캡%')
  AND (p.sku IS NULL OR p.sku != 'MASSGOO_BLACK_CAP')
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'MASSGOO_BLACK_CAP' AND p2.id != p.id
  );

-- MAS 한정판 모자(그레이)
UPDATE products p
SET 
  sku = 'MAS_LIMITED_CAP_GRAY',
  slug = COALESCE(p.slug, 'mas-limited-cap-gray'),
  updated_at = NOW()
WHERE (p.name LIKE '%MAS%한정판%그레이%' OR p.name LIKE '%MAS 한정판 모자(그레이)%')
  AND (p.sku IS NULL OR p.sku != 'MAS_LIMITED_CAP_GRAY')
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'MAS_LIMITED_CAP_GRAY' AND p2.id != p.id
  );

-- MAS 한정판 모자(블랙)
UPDATE products p
SET 
  sku = 'MAS_LIMITED_CAP_BLACK',
  slug = COALESCE(p.slug, 'mas-limited-cap-black'),
  updated_at = NOW()
WHERE (p.name LIKE '%MAS%한정판%블랙%' OR p.name LIKE '%MAS 한정판 모자(블랙)%')
  AND (p.sku IS NULL OR p.sku != 'MAS_LIMITED_CAP_BLACK')
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'MAS_LIMITED_CAP_BLACK' AND p2.id != p.id
  );

-- 4. 제품명으로 매칭하여 SKU 업데이트 (액세서리)
-- MASSGOO × MUZIIK 프리미엄 클러치백 (베이지)
UPDATE products p
SET 
  sku = 'MASSGOO_MUZIIK_CLUTCH_BEIGE',
  slug = COALESCE(p.slug, 'massgoo-muziik-clutch-beige'),
  updated_at = NOW()
WHERE (p.name LIKE '%클러치백%베이지%' OR p.name LIKE '%CLUTCH%BEIGE%')
  AND (p.sku IS NULL OR p.sku != 'MASSGOO_MUZIIK_CLUTCH_BEIGE')
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'MASSGOO_MUZIIK_CLUTCH_BEIGE' AND p2.id != p.id
  );

-- MASSGOO × MUZIIK 프리미엄 클러치백 (그레이)
UPDATE products p
SET 
  sku = 'MASSGOO_MUZIIK_CLUTCH_GRAY',
  slug = COALESCE(p.slug, 'massgoo-muziik-clutch-gray'),
  updated_at = NOW()
WHERE (p.name LIKE '%클러치백%그레이%' OR p.name LIKE '%CLUTCH%GRAY%')
  AND (p.sku IS NULL OR p.sku != 'MASSGOO_MUZIIK_CLUTCH_GRAY')
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = 'MASSGOO_MUZIIK_CLUTCH_GRAY' AND p2.id != p.id
  );

-- 5. product_composition의 product_id 업데이트
UPDATE product_composition pc
SET product_id = p.id
FROM products p
WHERE pc.slug = p.slug
  AND pc.product_id IS NULL
  AND p.slug IS NOT NULL;

-- 6. 최종 결과 확인
SELECT 
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  UPPER(REPLACE(pc.slug, '-', '_')) as expected_sku,
  pc.product_id,
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

