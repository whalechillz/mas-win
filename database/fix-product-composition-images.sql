-- 제품 합성 테이블의 잘못된 이미지 URL 수정
-- 버킷햇 블랙과 골프모자 베이지 이미지 경로 수정

-- 현재 상태 확인
SELECT 
  id,
  name,
  image_url,
  CASE 
    WHEN name LIKE '%버킷햇%블랙%' THEN '버킷햇 블랙'
    WHEN name LIKE '%골프모자%베이지%' THEN '골프모자 베이지'
    ELSE '기타'
  END as check_type
FROM product_composition
WHERE composition_target = 'head'
  AND (name LIKE '%버킷햇%블랙%' OR name LIKE '%골프모자%베이지%')
ORDER BY display_order;

-- 1. 버킷햇 블랙 수정 (정확한 이름으로 매칭)
UPDATE product_composition
SET image_url = '/main/products/goods/black-bucket-hat.webp'
WHERE composition_target = 'head'
  AND (name LIKE '%버킷햇%블랙%' OR name LIKE '%버킷햇 (블랙)%')
  AND image_url != '/main/products/goods/black-bucket-hat.webp';

-- 2. 골프모자 베이지 수정 (정확한 이름으로 매칭)
UPDATE product_composition
SET image_url = '/main/products/goods/beige-golf-cap.webp'
WHERE composition_target = 'head'
  AND (name LIKE '%골프모자%베이지%' OR name LIKE '%골프모자 (베이지)%')
  AND image_url != '/main/products/goods/beige-golf-cap.webp';

-- 3. 모든 IMG_ 패턴을 정규화된 파일명으로 교체 (안전하게)
UPDATE product_composition
SET image_url = CASE
  WHEN name LIKE '%버킷햇%화이트%' OR name LIKE '%버킷햇 (화이트)%' THEN '/main/products/goods/white-bucket-hat.webp'
  WHEN name LIKE '%버킷햇%블랙%' OR name LIKE '%버킷햇 (블랙)%' THEN '/main/products/goods/black-bucket-hat.webp'
  WHEN name LIKE '%골프모자%화이트%' OR name LIKE '%골프모자 (화이트)%' THEN '/main/products/goods/white-golf-cap.webp'
  WHEN name LIKE '%골프모자%베이지%' OR name LIKE '%골프모자 (베이지)%' THEN '/main/products/goods/beige-golf-cap.webp'
  WHEN name LIKE '%골프모자%네이비%' OR name LIKE '%골프모자 (네이비)%' THEN '/main/products/goods/navy-golf-cap.webp'
  WHEN name LIKE '%골프모자%블랙%' OR name LIKE '%골프모자 (블랙)%' THEN '/main/products/goods/black-golf-cap.webp'
  ELSE image_url
END
WHERE composition_target = 'head'
  AND image_url LIKE '%IMG_%';

-- 최종 확인
SELECT 
  id,
  name,
  image_url,
  CASE 
    WHEN image_url LIKE '%IMG_%' THEN '⚠️ 아직 IMG_ 패턴 남아있음'
    WHEN image_url LIKE '%.webp' AND image_url LIKE '/main/products/goods/%' THEN '✅ 정규화됨'
    ELSE '❌ 확인 필요'
  END as status
FROM product_composition
WHERE composition_target = 'head'
ORDER BY display_order;

