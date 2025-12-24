-- MAS 한정판 모자 제품들의 LIMITED 배지 제거
-- Supabase SQL Editor에서 실행하세요

UPDATE product_composition
SET badge = NULL,
    updated_at = NOW()
WHERE slug IN ('mas-limited-cap-gray', 'mas-limited-cap-black')
  AND badge = 'LIMITED';

