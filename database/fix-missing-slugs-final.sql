-- 누락된 slug 최종 수정
-- secret-weapon-4-1 → secret-weapon-gold-4-1
-- gold2 (gold2-sapphire가 아닌) → secret-force-gold-2

-- 1. product_composition에서 secret-weapon-4-1 확인 및 업데이트
UPDATE product_composition 
SET 
  slug = 'secret-weapon-gold-4-1',
  updated_at = NOW()
WHERE slug = 'secret-weapon-4-1'
   OR slug = 'gold-weapon4'
   OR (slug LIKE '%weapon%gold%4%' AND slug != 'secret-weapon-gold-4-1');

-- 2. product_composition에서 gold2 확인 및 업데이트 (gold2-sapphire 제외)
UPDATE product_composition 
SET 
  slug = 'secret-force-gold-2',
  updated_at = NOW()
WHERE slug = 'gold2'
   AND slug != 'gold2-sapphire'
   AND name NOT LIKE '%MUZIIK%'
   AND name NOT LIKE '%사파이어%';

-- 3. products 테이블도 동일하게 업데이트
UPDATE products 
SET 
  slug = 'secret-weapon-gold-4-1',
  updated_at = NOW()
WHERE slug = 'secret-weapon-4-1'
   OR slug = 'gold-weapon4';

UPDATE products 
SET 
  slug = 'secret-force-gold-2',
  updated_at = NOW()
WHERE slug = 'gold2'
   AND slug != 'gold2-sapphire'
   AND name NOT LIKE '%MUZIIK%'
   AND name NOT LIKE '%사파이어%';

-- 4. 최종 확인
SELECT 
  'product_composition' as table_name,
  slug,
  name,
  COUNT(*) as count
FROM product_composition
WHERE slug IN (
  'secret-weapon-black-muziik',
  'secret-weapon-black',
  'secret-weapon-gold-4-1',
  'secret-force-gold-2',
  'secret-force-gold-2-muziik',
  'secret-force-pro-3-muziik',
  'secret-force-pro-3',
  'secret-force-v3'
)
GROUP BY slug, name
ORDER BY slug;

SELECT 
  'products' as table_name,
  slug,
  name,
  COUNT(*) as count
FROM products
WHERE slug IN (
  'secret-weapon-black-muziik',
  'secret-weapon-black',
  'secret-weapon-gold-4-1',
  'secret-force-gold-2',
  'secret-force-gold-2-muziik',
  'secret-force-pro-3-muziik',
  'secret-force-pro-3',
  'secret-force-v3'
)
GROUP BY slug, name
ORDER BY slug;
