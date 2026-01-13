-- product_composition 테이블에 component 카테고리 추가
-- 기존 체크 제약 조건: 'hat', 'driver', 'accessory', 'apparel'만 허용
-- 새로운 체크 제약 조건: 'hat', 'driver', 'accessory', 'apparel', 'component' 허용

-- 1. 기존 체크 제약 조건 확인
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'product_composition'::regclass
  AND contype = 'c'
  AND conname LIKE '%category%';

-- 2. 기존 체크 제약 조건 삭제
ALTER TABLE product_composition 
DROP CONSTRAINT IF EXISTS product_composition_category_check;

-- 3. 새로운 체크 제약 조건 추가 (component 포함)
ALTER TABLE product_composition
ADD CONSTRAINT product_composition_category_check 
CHECK (category IN ('hat', 'driver', 'accessory', 'apparel', 'component'));

-- 4. 확인
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'product_composition'::regclass
  AND contype = 'c'
  AND conname LIKE '%category%';
