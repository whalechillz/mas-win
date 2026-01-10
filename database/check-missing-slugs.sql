-- 누락된 slug 확인 및 업데이트

-- 1. product_composition에서 기존 slug 확인
SELECT 
  id,
  name,
  slug as current_slug,
  CASE 
    WHEN slug = 'black-beryl' THEN 'secret-weapon-black-muziik'
    WHEN slug = 'black-weapon' THEN 'secret-weapon-black'
    WHEN slug = 'gold-weapon4' THEN 'secret-weapon-gold-4-1'
    WHEN slug = 'gold2' THEN 'secret-force-gold-2'
    WHEN slug = 'gold2-sapphire' THEN 'secret-force-gold-2-muziik'
    WHEN slug = 'pro3-muziik' THEN 'secret-force-pro-3-muziik'
    WHEN slug = 'pro3' THEN 'secret-force-pro-3'
    WHEN slug = 'v3' THEN 'secret-force-v3'
    ELSE slug
  END as expected_slug
FROM product_composition
WHERE slug IN ('black-beryl', 'black-weapon', 'gold-weapon4', 'gold2', 'gold2-sapphire', 'pro3-muziik', 'pro3', 'v3')
   OR slug IN ('secret-weapon-black-muziik', 'secret-weapon-black', 'secret-weapon-gold-4-1', 'secret-force-gold-2', 'secret-force-gold-2-muziik', 'secret-force-pro-3-muziik', 'secret-force-pro-3', 'secret-force-v3')
ORDER BY slug;

-- 2. 누락된 slug 수동 업데이트 (필요시)
-- gold-weapon4가 다른 이름으로 저장되어 있을 수 있음
UPDATE product_composition 
SET 
  slug = 'secret-weapon-gold-4-1',
  updated_at = NOW()
WHERE slug = 'gold-weapon4' 
   OR slug = 'secret-weapon-4-1'
   OR slug LIKE '%gold%weapon%4%'
   OR slug LIKE '%weapon%gold%4%';

-- gold2가 다른 이름으로 저장되어 있을 수 있음
UPDATE product_composition 
SET 
  slug = 'secret-force-gold-2',
  updated_at = NOW()
WHERE slug = 'gold2' 
   AND slug != 'gold2-sapphire';

-- 3. 최종 확인
SELECT 
  'product_composition' as table_name,
  slug,
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
GROUP BY slug
ORDER BY slug;
