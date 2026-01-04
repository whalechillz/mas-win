-- 카테고리 통일: 모든 모자 관련 카테고리를 'cap'으로 통일
-- 드라이버는 제외 (product_type='driver'는 category를 'driver'로 유지)

-- 1. 현재 카테고리 분포 확인
SELECT 
  category,
  product_type,
  COUNT(*) as count
FROM products
GROUP BY category, product_type
ORDER BY category, product_type;

-- 2. 모자 관련 카테고리를 'cap'으로 통일
-- bucket_hat, hat, cap 등 모든 모자 카테고리를 'cap'으로 변경
UPDATE products
SET category = 'cap'
WHERE category IN ('bucket_hat', 'hat', 'cap', 'bucket-hat', 'bucket hat')
  AND (product_type IS NULL OR product_type != 'driver');

-- 3. 드라이버 제품은 category를 'driver'로 설정 (product_type='driver'인 경우)
UPDATE products
SET category = 'driver'
WHERE product_type = 'driver'
  AND (category IS NULL OR category != 'driver');

-- 4. product_composition 테이블도 동일하게 통일
-- hat, bucket_hat 등을 'cap'으로 변경 (드라이버는 'driver'로 유지)
UPDATE product_composition
SET category = 'cap'
WHERE category IN ('hat', 'bucket_hat', 'bucket-hat', 'bucket hat')
  AND category != 'driver';

-- 5. 드라이버는 'driver'로 유지
UPDATE product_composition
SET category = 'driver'
WHERE category = 'driver';

-- 6. 마이그레이션 결과 확인
SELECT 
  'products' as table_name,
  category,
  product_type,
  COUNT(*) as count
FROM products
GROUP BY category, product_type
ORDER BY category, product_type

UNION ALL

SELECT 
  'product_composition' as table_name,
  category::text,
  NULL as product_type,
  COUNT(*) as count
FROM product_composition
GROUP BY category
ORDER BY category;

-- 7. 카테고리 통일 후 검증
-- products 테이블
SELECT 
  id,
  name,
  sku,
  category,
  product_type
FROM products
WHERE category NOT IN ('cap', 'driver', 'component', 'weight_pack', 'accessory', 'apparel', 'ball', 'tshirt', 'clutch')
  OR (product_type = 'driver' AND category != 'driver')
ORDER BY category, name;

-- product_composition 테이블
SELECT 
  id,
  name,
  slug,
  category
FROM product_composition
WHERE category NOT IN ('cap', 'driver', 'accessory', 'apparel')
ORDER BY category, name;

