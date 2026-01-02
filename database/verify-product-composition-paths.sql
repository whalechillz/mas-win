-- 제품 합성 이미지 경로 검증 쿼리
-- 마이그레이션 후 남아있는 문제 확인

-- 1. 아직 /main/products/ 경로가 남아있는지 확인
SELECT 
  id,
  name,
  category,
  image_url,
  updated_at
FROM product_composition
WHERE image_url LIKE '/main/products/%'
   OR image_url LIKE '%/main/products/%'
   OR reference_images::text LIKE '%/main/products/%'
   OR color_variants::text LIKE '%/main/products/%'
ORDER BY updated_at DESC;

-- 2. 잘못된 경로 형식 확인 (빈 문자열, '-', 너무 짧은 경로)
SELECT 
  id,
  name,
  category,
  image_url,
  updated_at
FROM product_composition
WHERE image_url IS NULL
   OR image_url = ''
   OR image_url = '-'
   OR LENGTH(TRIM(image_url)) < 3
ORDER BY updated_at DESC;

-- 3. 새 형식 경로 사용 현황 확인
SELECT 
  category,
  COUNT(*) as total_count,
  COUNT(CASE WHEN image_url LIKE '%originals/products/%' OR image_url LIKE '%originals/goods/%' THEN 1 END) as new_format_count,
  COUNT(CASE WHEN image_url LIKE '/main/products/%' THEN 1 END) as old_format_count,
  COUNT(CASE WHEN image_url IS NULL OR image_url = '' OR image_url = '-' THEN 1 END) as invalid_count
FROM product_composition
GROUP BY category
ORDER BY category;

-- 4. 각 카테고리별 상세 현황
SELECT 
  category,
  composition_target,
  COUNT(*) as count,
  STRING_AGG(DISTINCT 
    CASE 
      WHEN image_url LIKE '%originals/products/%' OR image_url LIKE '%originals/goods/%' THEN '✅ 새 형식'
      WHEN image_url LIKE '/main/products/%' THEN '⚠️ 구 형식'
      WHEN image_url IS NULL OR image_url = '' OR image_url = '-' THEN '❌ 잘못됨'
      ELSE '❓ 기타'
    END, 
    ', '
  ) as status_list
FROM product_composition
GROUP BY category, composition_target
ORDER BY category, composition_target;

