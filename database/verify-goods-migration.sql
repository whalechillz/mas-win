-- 굿즈 마이그레이션 검증 쿼리
-- 모든 필드가 새 경로(originals/goods/)로 업데이트되었는지 확인

-- 0. 전체 마이그레이션 상태 요약 (먼저 실행)
SELECT 
  '📊 전체 마이그레이션 상태' as summary,
  (SELECT COUNT(*) FROM product_composition WHERE category IN ('goods', 'hat', 'accessory')) as total_goods_products,
  (SELECT COUNT(*) FROM product_composition 
   WHERE category IN ('goods', 'hat', 'accessory') 
   AND (image_url LIKE '%originals/goods/%' 
        OR reference_images::text LIKE '%originals/goods/%' 
        OR color_variants::text LIKE '%originals/goods/%')) as products_with_new_path,
  (SELECT COUNT(*) FROM product_composition 
   WHERE category IN ('goods', 'hat', 'accessory') 
   AND (image_url LIKE '%originals/products/goods/%' 
        OR reference_images::text LIKE '%originals/products/goods/%' 
        OR color_variants::text LIKE '%originals/products/goods/%')) as products_with_old_path;

-- 1. product_composition 테이블 검증
SELECT 
  'product_composition 검증' as check_type,
  COUNT(*) as total_goods_count,
  COUNT(CASE WHEN image_url LIKE '%originals/goods/%' THEN 1 END) as image_url_updated,
  COUNT(CASE WHEN reference_images::text LIKE '%originals/goods/%' THEN 1 END) as reference_images_updated,
  COUNT(CASE WHEN color_variants::text LIKE '%originals/goods/%' THEN 1 END) as color_variants_updated,
  COUNT(CASE WHEN image_url LIKE '%originals/products/goods/%' THEN 1 END) as image_url_old_path,
  COUNT(CASE WHEN reference_images::text LIKE '%originals/products/goods/%' THEN 1 END) as reference_images_old_path,
  COUNT(CASE WHEN color_variants::text LIKE '%originals/products/goods/%' THEN 1 END) as color_variants_old_path
FROM product_composition
WHERE category IN ('goods', 'hat', 'accessory');

-- 2. 상세 데이터 확인 (샘플)
SELECT 
  id,
  slug,
  category,
  CASE 
    WHEN image_url LIKE '%originals/goods/%' THEN '✅ 새 경로'
    WHEN image_url LIKE '%originals/products/goods/%' THEN '❌ 구 경로'
    ELSE '⚠️ 기타'
  END as image_url_status,
  CASE 
    WHEN reference_images::text LIKE '%originals/goods/%' THEN '✅ 새 경로'
    WHEN reference_images::text LIKE '%originals/products/goods/%' THEN '❌ 구 경로'
    WHEN reference_images IS NULL OR reference_images = '[]'::jsonb THEN '⚪ 없음'
    ELSE '⚠️ 기타'
  END as reference_images_status,
  CASE 
    WHEN color_variants::text LIKE '%originals/goods/%' THEN '✅ 새 경로'
    WHEN color_variants::text LIKE '%originals/products/goods/%' THEN '❌ 구 경로'
    WHEN color_variants IS NULL OR color_variants = '{}'::jsonb THEN '⚪ 없음'
    ELSE '⚠️ 기타'
  END as color_variants_status
FROM product_composition
WHERE category IN ('goods', 'hat', 'accessory')
ORDER BY id
LIMIT 10;

-- 3. image_metadata 테이블 검증
SELECT 
  'image_metadata 검증' as check_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN folder_path LIKE 'originals/goods/%' THEN 1 END) as folder_path_updated,
  COUNT(CASE WHEN original_path LIKE '%originals/goods/%' THEN 1 END) as original_path_updated,
  COUNT(CASE WHEN folder_path LIKE 'originals/products/goods/%' THEN 1 END) as folder_path_old_path,
  COUNT(CASE WHEN original_path LIKE '%originals/products/goods/%' THEN 1 END) as original_path_old_path
FROM image_metadata
WHERE folder_path LIKE '%goods%' OR original_path LIKE '%goods%';

