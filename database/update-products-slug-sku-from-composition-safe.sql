-- product_composition 테이블의 slug를 기준으로 products 테이블의 slug와 SKU 업데이트
-- 중복 slug 방지 안전 버전

-- 1. slug를 SKU로 변환 함수 (이미 생성되어 있으면 재사용)
CREATE OR REPLACE FUNCTION slug_to_sku(slug TEXT)
RETURNS TEXT AS $$
BEGIN
  IF slug IS NULL OR slug = '' THEN
    RETURN NULL;
  END IF;
  
  -- 소문자를 대문자로, 하이픈을 언더스코어로 변환
  RETURN UPPER(REPLACE(slug, '-', '_'));
END;
$$ LANGUAGE plpgsql;

-- 2. 중복 slug 확인 (실행 전 확인)
SELECT 
  slug,
  COUNT(*) as count,
  array_agg(id ORDER BY id) as product_ids,
  array_agg(name ORDER BY id) as product_names
FROM products
WHERE slug IS NOT NULL 
  AND slug != ''
  AND category IN ('cap', 'bucket_hat', 'hat')
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY slug;

-- 3. product_id로 직접 매칭 (가장 정확, 중복 방지)
-- product_composition.product_id가 있으면 그것으로 products 테이블 업데이트
UPDATE products p
SET 
  slug = COALESCE(
    p.slug, -- 기존 slug가 있으면 유지
    pc.slug -- product_composition의 slug 사용
  ),
  sku = COALESCE(
    p.sku, -- 기존 SKU가 있으면 유지
    CASE 
      WHEN NOT EXISTS (
        SELECT 1 FROM products p2
        WHERE p2.sku = slug_to_sku(pc.slug)
          AND p2.id != p.id
      ) THEN slug_to_sku(pc.slug) -- 중복이 아닌 경우만 SKU 생성
      ELSE p.sku -- 중복이면 기존 SKU 유지
    END
  ),
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id = p.id
  AND pc.slug IS NOT NULL
  AND pc.slug != ''
  AND p.category IN ('cap', 'bucket_hat', 'hat')
  -- ✅ 중복 방지: 해당 slug가 다른 제품에 사용되지 않는 경우만 업데이트
  AND (p.slug IS NULL OR p.slug = '') -- slug가 없는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.slug = pc.slug
      AND p2.id != p.id
  );

-- 4. product_id가 없는 경우, 제품명으로 매칭 (중복 방지)
-- product_composition의 slug를 products 테이블의 slug로 업데이트
UPDATE products p
SET 
  slug = pc.slug, -- product_composition의 slug 사용
  sku = slug_to_sku(pc.slug), -- product_composition의 slug에서 SKU 생성
  updated_at = NOW()
FROM product_composition pc
WHERE pc.product_id IS NULL
  AND pc.slug IS NOT NULL
  AND pc.slug != ''
  AND pc.category IN ('hat', 'cap')
  AND p.category IN ('cap', 'bucket_hat', 'hat')
  AND (p.slug IS NULL OR p.slug = '') -- ✅ slug가 없는 경우만 업데이트
  -- 제품명이 유사한 경우 매칭
  AND (
    -- 버킷햇 매칭
    (pc.slug LIKE '%bucket-hat%' AND (p.name LIKE '%버킷%' OR p.name LIKE '%bucket%'))
    OR
    -- 골프모자 매칭
    (pc.slug LIKE '%golf-hat%' AND (p.name LIKE '%골프%' OR p.name LIKE '%golf%'))
    OR
    -- MAS 한정판 모자 매칭
    (pc.slug LIKE '%mas-limited%' AND p.name LIKE '%MAS%한정판%')
  )
  -- ✅ 중복 방지: 해당 slug가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.slug = pc.slug
      AND p2.id != p.id
  )
  -- ✅ SKU 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = slug_to_sku(pc.slug)
      AND p2.id != p.id
  );

-- 5. 제품명 기반 slug 매핑 (중복 방지, slug가 없는 경우만)
-- 버킷햇 색상별 매핑
UPDATE products p
SET 
  slug = CASE 
    WHEN p.name LIKE '%버킷%화이트%' OR p.name LIKE '%버킷%white%' OR p.name LIKE '%bucket%white%' THEN 'bucket-hat-muziik-white'
    WHEN p.name LIKE '%버킷%블랙%' OR p.name LIKE '%버킷%black%' OR p.name LIKE '%bucket%black%' THEN 'bucket-hat-muziik-black'
    ELSE p.slug
  END,
  sku = CASE 
    WHEN p.name LIKE '%버킷%화이트%' OR p.name LIKE '%버킷%white%' OR p.name LIKE '%bucket%white%' THEN 'BUCKET_HAT_MUZIIK_WHITE'
    WHEN p.name LIKE '%버킷%블랙%' OR p.name LIKE '%버킷%black%' OR p.name LIKE '%bucket%black%' THEN 'BUCKET_HAT_MUZIIK_BLACK'
    ELSE p.sku
  END,
  updated_at = NOW()
WHERE (p.slug IS NULL OR p.slug = '') -- ✅ slug가 없는 경우만
  AND (p.sku IS NULL OR p.sku = '')
  AND p.category IN ('cap', 'bucket_hat', 'hat')
  AND (p.name LIKE '%버킷%' OR p.name LIKE '%bucket%')
  -- product_composition에 해당 slug가 존재하는지 확인
  AND EXISTS (
    SELECT 1 FROM product_composition pc
    WHERE pc.slug IN ('bucket-hat-muziik-white', 'bucket-hat-muziik-black')
      AND (
        (p.name LIKE '%버킷%화이트%' AND pc.slug = 'bucket-hat-muziik-white')
        OR (p.name LIKE '%버킷%블랙%' AND pc.slug = 'bucket-hat-muziik-black')
      )
  )
  -- ✅ 중복 방지: 해당 slug가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.id != p.id
      AND (
        (p.name LIKE '%버킷%화이트%' AND p2.slug = 'bucket-hat-muziik-white')
        OR (p.name LIKE '%버킷%블랙%' AND p2.slug = 'bucket-hat-muziik-black')
      )
  );

-- 골프모자 색상별 매핑
UPDATE products p
SET 
  slug = CASE 
    WHEN p.name LIKE '%골프%화이트%' OR p.name LIKE '%골프%white%' OR p.name LIKE '%golf%white%' THEN 'golf-hat-muziik-white'
    WHEN p.name LIKE '%골프%블랙%' OR p.name LIKE '%골프%black%' OR p.name LIKE '%golf%black%' THEN 'golf-hat-muziik-black'
    WHEN p.name LIKE '%골프%네이비%' OR p.name LIKE '%골프%navy%' OR p.name LIKE '%golf%navy%' THEN 'golf-hat-muziik-navy'
    WHEN p.name LIKE '%골프%베이지%' OR p.name LIKE '%골프%beige%' OR p.name LIKE '%golf%beige%' THEN 'golf-hat-muziik-beige'
    ELSE p.slug
  END,
  sku = CASE 
    WHEN p.name LIKE '%골프%화이트%' OR p.name LIKE '%골프%white%' OR p.name LIKE '%golf%white%' THEN 'GOLF_HAT_MUZIIK_WHITE'
    WHEN p.name LIKE '%골프%블랙%' OR p.name LIKE '%골프%black%' OR p.name LIKE '%golf%black%' THEN 'GOLF_HAT_MUZIIK_BLACK'
    WHEN p.name LIKE '%골프%네이비%' OR p.name LIKE '%골프%navy%' OR p.name LIKE '%golf%navy%' THEN 'GOLF_HAT_MUZIIK_NAVY'
    WHEN p.name LIKE '%골프%베이지%' OR p.name LIKE '%골프%beige%' OR p.name LIKE '%golf%beige%' THEN 'GOLF_HAT_MUZIIK_BEIGE'
    ELSE p.sku
  END,
  updated_at = NOW()
WHERE (p.slug IS NULL OR p.slug = '') -- ✅ slug가 없는 경우만
  AND (p.sku IS NULL OR p.sku = '')
  AND p.category IN ('cap', 'bucket_hat', 'hat')
  AND (p.name LIKE '%골프%' OR p.name LIKE '%golf%')
  -- product_composition에 해당 slug가 존재하는지 확인
  AND EXISTS (
    SELECT 1 FROM product_composition pc
    WHERE pc.slug IN ('golf-hat-muziik-white', 'golf-hat-muziik-black', 'golf-hat-muziik-navy', 'golf-hat-muziik-beige')
      AND (
        (p.name LIKE '%골프%화이트%' AND pc.slug = 'golf-hat-muziik-white')
        OR (p.name LIKE '%골프%블랙%' AND pc.slug = 'golf-hat-muziik-black')
        OR (p.name LIKE '%골프%네이비%' AND pc.slug = 'golf-hat-muziik-navy')
        OR (p.name LIKE '%골프%베이지%' AND pc.slug = 'golf-hat-muziik-beige')
      )
  )
  -- ✅ 중복 방지: 해당 slug가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.id != p.id
      AND (
        (p.name LIKE '%골프%화이트%' AND p2.slug = 'golf-hat-muziik-white')
        OR (p.name LIKE '%골프%블랙%' AND p2.slug = 'golf-hat-muziik-black')
        OR (p.name LIKE '%골프%네이비%' AND p2.slug = 'golf-hat-muziik-navy')
        OR (p.name LIKE '%골프%베이지%' AND p2.slug = 'golf-hat-muziik-beige')
      )
  );

-- MAS 한정판 모자 매핑 (중복 방지 강화)
UPDATE products p
SET 
  slug = CASE 
    WHEN p.name LIKE '%MAS%한정판%그레이%' OR p.name LIKE '%MAS%한정판%gray%' THEN 'mas-limited-cap-gray'
    WHEN p.name LIKE '%MAS%한정판%블랙%' OR p.name LIKE '%MAS%한정판%black%' THEN 'mas-limited-cap-black'
    ELSE p.slug
  END,
  sku = CASE 
    WHEN p.name LIKE '%MAS%한정판%그레이%' OR p.name LIKE '%MAS%한정판%gray%' THEN 'MAS_LIMITED_CAP_GRAY'
    WHEN p.name LIKE '%MAS%한정판%블랙%' OR p.name LIKE '%MAS%한정판%black%' THEN 'MAS_LIMITED_CAP_BLACK'
    ELSE p.sku
  END,
  updated_at = NOW()
WHERE (p.slug IS NULL OR p.slug = '') -- ✅ slug가 없는 경우만
  AND (p.sku IS NULL OR p.sku = '')
  AND p.category IN ('cap', 'bucket_hat', 'hat')
  AND p.name LIKE '%MAS%한정판%'
  -- product_composition에 해당 slug가 존재하는지 확인
  AND EXISTS (
    SELECT 1 FROM product_composition pc
    WHERE pc.slug IN ('mas-limited-cap-gray', 'mas-limited-cap-black')
      AND (
        (p.name LIKE '%MAS%한정판%그레이%' AND pc.slug = 'mas-limited-cap-gray')
        OR (p.name LIKE '%MAS%한정판%블랙%' AND pc.slug = 'mas-limited-cap-black')
      )
  )
  -- ✅ 중복 방지: 해당 slug가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.id != p.id
      AND (
        (p.name LIKE '%MAS%한정판%그레이%' AND p2.slug = 'mas-limited-cap-gray')
        OR (p.name LIKE '%MAS%한정판%블랙%' AND p2.slug = 'mas-limited-cap-black')
      )
  );

-- 6. 중복 SKU 확인 (실행 전 확인)
SELECT 
  sku,
  COUNT(*) as count,
  array_agg(id ORDER BY id) as product_ids,
  array_agg(name ORDER BY id) as product_names,
  array_agg(slug ORDER BY id) as product_slugs
FROM products
WHERE sku IS NOT NULL 
  AND sku != ''
  AND category IN ('cap', 'bucket_hat', 'hat')
GROUP BY sku
HAVING COUNT(*) > 1
ORDER BY sku;

-- 7. SKU 업데이트 (slug가 있는 경우, 중복 방지)
UPDATE products p
SET 
  sku = slug_to_sku(p.slug), -- slug에서 SKU 생성
  updated_at = NOW()
WHERE (p.sku IS NULL OR p.sku = '') -- ✅ SKU가 없는 경우만
  AND p.slug IS NOT NULL
  AND p.slug != ''
  AND p.category IN ('cap', 'bucket_hat', 'hat')
  -- ✅ 중복 방지: 해당 SKU가 다른 제품에 사용되지 않는 경우만 업데이트
  AND NOT EXISTS (
    SELECT 1 FROM products p2
    WHERE p2.sku = slug_to_sku(p.slug)
      AND p2.id != p.id
  );

-- 8. 마이그레이션 결과 확인
SELECT 
  p.id,
  p.name,
  p.sku,
  p.slug,
  p.category,
  p.product_type,
  pc.id as composition_id,
  pc.name as composition_name,
  pc.slug as composition_slug,
  pc.product_id
FROM products p
LEFT JOIN product_composition pc ON pc.product_id = p.id OR pc.slug = p.slug
WHERE p.category IN ('cap', 'bucket_hat', 'hat')
ORDER BY p.category, p.name;

-- 9. 중복 slug 확인 (문제가 있는 경우)
SELECT 
  slug,
  COUNT(*) as count,
  array_agg(id ORDER BY id) as product_ids,
  array_agg(name ORDER BY id) as product_names
FROM products
WHERE slug IS NOT NULL 
  AND slug != ''
  AND category IN ('cap', 'bucket_hat', 'hat')
GROUP BY slug
HAVING COUNT(*) > 1
ORDER BY slug;

-- 10. 중복 SKU 확인 (문제가 있는 경우)
SELECT 
  sku,
  COUNT(*) as count,
  array_agg(id ORDER BY id) as product_ids,
  array_agg(name ORDER BY id) as product_names
FROM products
WHERE sku IS NOT NULL 
  AND sku != ''
  AND category IN ('cap', 'bucket_hat', 'hat')
GROUP BY sku
HAVING COUNT(*) > 1
ORDER BY sku;

-- 11. slug나 SKU가 여전히 없는 제품 확인
SELECT 
  p.id,
  p.name,
  p.sku,
  p.slug,
  p.category,
  p.product_type
FROM products p
WHERE p.category IN ('cap', 'bucket_hat', 'hat')
  AND (p.slug IS NULL OR p.slug = '' OR p.sku IS NULL OR p.sku = '')
ORDER BY p.name;

