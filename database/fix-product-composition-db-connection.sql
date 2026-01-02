-- 제품 합성 관리 DB 연결 수정
-- 1. 이미지 경로 수정 (hat-white-bucket → bucket-hat-muziik)
-- 2. product_id를 products 테이블과 slug 기반으로 매칭

-- 1. 현재 상태 확인
SELECT 
  pc.id,
  pc.name,
  pc.slug,
  pc.image_url,
  pc.product_id,
  pc.is_active,
  p.id as products_id,
  p.name as products_name,
  p.slug as products_slug
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id
WHERE pc.category = 'hat'
ORDER BY pc.display_order;

-- 2. 이미지 경로 수정 (hat-white-bucket → bucket-hat-muziik)
UPDATE product_composition
SET image_url = REPLACE(
  image_url,
  'originals/goods/hat-white-bucket/composition/',
  'originals/goods/bucket-hat-muziik/composition/'
),
updated_at = NOW()
WHERE image_url LIKE '%hat-white-bucket%';

-- 3. products 테이블에서 모자 제품 확인
SELECT 
  id,
  name,
  slug,
  category,
  product_type,
  is_active
FROM products
WHERE category IN ('cap', 'bucket_hat', 'hat')
  AND product_type = 'goods'
ORDER BY slug;

-- 4. product_composition의 product_id 업데이트 (slug 기반 매칭)
-- 먼저 slug 매핑 테이블 생성 (임시)
-- bucket-hat-muziik, golf-hat-muziik 등은 products 테이블에 있음
-- hat-white-bucket, hat-black-bucket 등은 product_composition에만 있음

-- 4-1. bucket-hat-muziik 관련 제품 매칭
UPDATE product_composition pc
SET product_id = p.id,
    updated_at = NOW()
FROM products p
WHERE p.slug = 'bucket-hat-muziik'
  AND pc.slug IN ('hat-white-bucket', 'hat-black-bucket')
  AND pc.product_id IS NULL;

-- 4-2. golf-hat-muziik 관련 제품 매칭
UPDATE product_composition pc
SET product_id = p.id,
    updated_at = NOW()
FROM products p
WHERE p.slug = 'golf-hat-muziik'
  AND pc.slug IN ('hat-white-golf')
  AND pc.product_id IS NULL;

-- 4-3. 다른 모자 제품들 매칭 (slug가 정확히 일치하는 경우)
UPDATE product_composition pc
SET product_id = p.id,
    updated_at = NOW()
FROM products p
WHERE pc.slug = p.slug
  AND pc.category = 'hat'
  AND pc.product_id IS NULL;

-- 5. 업데이트 후 확인
SELECT 
  pc.id,
  pc.name,
  pc.slug,
  pc.image_url,
  pc.product_id,
  pc.is_active,
  p.id as products_id,
  p.name as products_name,
  p.slug as products_slug
FROM product_composition pc
LEFT JOIN products p ON pc.product_id = p.id
WHERE pc.category = 'hat'
ORDER BY pc.display_order;

