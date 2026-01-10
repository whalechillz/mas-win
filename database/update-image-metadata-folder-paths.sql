-- image_metadata 테이블의 구식 폴더명을 새 폴더명으로 업데이트
-- 갤러리 관리 페이지의 폴더 트리가 올바르게 표시되도록 함

-- ============================================
-- 1단계: folder_path 업데이트
-- ============================================
UPDATE image_metadata 
SET 
  folder_path = CASE 
    WHEN folder_path LIKE '%originals/products/black-beryl%' 
      THEN replace(folder_path, 'originals/products/black-beryl', 'originals/products/secret-weapon-black-muziik')
    WHEN folder_path LIKE '%originals/products/black-weapon%' 
      THEN replace(folder_path, 'originals/products/black-weapon', 'originals/products/secret-weapon-black')
    WHEN folder_path LIKE '%originals/products/gold-weapon4%' 
      THEN replace(folder_path, 'originals/products/gold-weapon4', 'originals/products/secret-weapon-gold-4-1')
    WHEN folder_path LIKE '%originals/products/gold2%' 
      THEN replace(folder_path, 'originals/products/gold2', 'originals/products/secret-force-gold-2')
    WHEN folder_path LIKE '%originals/products/gold2-sapphire%' 
      THEN replace(folder_path, 'originals/products/gold2-sapphire', 'originals/products/secret-force-gold-2-muziik')
    WHEN folder_path LIKE '%originals/products/pro3-muziik%' 
      THEN replace(folder_path, 'originals/products/pro3-muziik', 'originals/products/secret-force-pro-3-muziik')
    WHEN folder_path LIKE '%originals/products/pro3%' 
      THEN replace(folder_path, 'originals/products/pro3', 'originals/products/secret-force-pro-3')
    WHEN folder_path LIKE '%originals/products/v3%' 
      THEN replace(folder_path, 'originals/products/v3', 'originals/products/secret-force-v3')
    ELSE folder_path
  END,
  updated_at = NOW()
WHERE folder_path LIKE '%originals/products/black-beryl%'
   OR folder_path LIKE '%originals/products/black-weapon%'
   OR folder_path LIKE '%originals/products/gold-weapon4%'
   OR folder_path LIKE '%originals/products/gold2%'
   OR folder_path LIKE '%originals/products/gold2-sapphire%'
   OR folder_path LIKE '%originals/products/pro3-muziik%'
   OR folder_path LIKE '%originals/products/pro3%'
   OR folder_path LIKE '%originals/products/v3%';

-- ============================================
-- 2단계: image_url 업데이트
-- ============================================
UPDATE image_metadata 
SET 
  image_url = CASE 
    WHEN image_url LIKE '%originals/products/black-beryl%' 
      THEN replace(image_url, 'originals/products/black-beryl', 'originals/products/secret-weapon-black-muziik')
    WHEN image_url LIKE '%originals/products/black-weapon%' 
      THEN replace(image_url, 'originals/products/black-weapon', 'originals/products/secret-weapon-black')
    WHEN image_url LIKE '%originals/products/gold-weapon4%' 
      THEN replace(image_url, 'originals/products/gold-weapon4', 'originals/products/secret-weapon-gold-4-1')
    WHEN image_url LIKE '%originals/products/gold2%' 
      THEN replace(image_url, 'originals/products/gold2', 'originals/products/secret-force-gold-2')
    WHEN image_url LIKE '%originals/products/gold2-sapphire%' 
      THEN replace(image_url, 'originals/products/gold2-sapphire', 'originals/products/secret-force-gold-2-muziik')
    WHEN image_url LIKE '%originals/products/pro3-muziik%' 
      THEN replace(image_url, 'originals/products/pro3-muziik', 'originals/products/secret-force-pro-3-muziik')
    WHEN image_url LIKE '%originals/products/pro3%' 
      THEN replace(image_url, 'originals/products/pro3', 'originals/products/secret-force-pro-3')
    WHEN image_url LIKE '%originals/products/v3%' 
      THEN replace(image_url, 'originals/products/v3', 'originals/products/secret-force-v3')
    ELSE image_url
  END,
  updated_at = NOW()
WHERE image_url LIKE '%originals/products/black-beryl%'
   OR image_url LIKE '%originals/products/black-weapon%'
   OR image_url LIKE '%originals/products/gold-weapon4%'
   OR image_url LIKE '%originals/products/gold2%'
   OR image_url LIKE '%originals/products/gold2-sapphire%'
   OR image_url LIKE '%originals/products/pro3-muziik%'
   OR image_url LIKE '%originals/products/pro3%'
   OR image_url LIKE '%originals/products/v3%';

-- ============================================
-- 3단계: 업데이트 결과 확인
-- ============================================
SELECT 
  'folder_path 업데이트 확인' as step,
  COUNT(*) as count
FROM image_metadata
WHERE folder_path LIKE '%originals/products/black-beryl%'
   OR folder_path LIKE '%originals/products/black-weapon%'
   OR folder_path LIKE '%originals/products/gold-weapon4%'
   OR folder_path LIKE '%originals/products/gold2%'
   OR folder_path LIKE '%originals/products/gold2-sapphire%'
   OR folder_path LIKE '%originals/products/pro3-muziik%'
   OR folder_path LIKE '%originals/products/pro3%'
   OR folder_path LIKE '%originals/products/v3%';

SELECT 
  'image_url 업데이트 확인' as step,
  COUNT(*) as count
FROM image_metadata
WHERE image_url LIKE '%originals/products/black-beryl%'
   OR image_url LIKE '%originals/products/black-weapon%'
   OR image_url LIKE '%originals/products/gold-weapon4%'
   OR image_url LIKE '%originals/products/gold2%'
   OR image_url LIKE '%originals/products/gold2-sapphire%'
   OR image_url LIKE '%originals/products/pro3-muziik%'
   OR image_url LIKE '%originals/products/pro3%'
   OR image_url LIKE '%originals/products/v3%';

-- 새 폴더명 확인
SELECT 
  '새 폴더명 확인' as step,
  folder_path,
  COUNT(*) as count
FROM image_metadata
WHERE folder_path LIKE '%originals/products/secret-%'
GROUP BY folder_path
ORDER BY folder_path
LIMIT 20;
