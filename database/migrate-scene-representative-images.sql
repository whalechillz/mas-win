-- ==========================================
-- 장면별 대표 이미지 초기 데이터 마이그레이션
-- ==========================================
-- 각 장면의 첫 번째 이미지(display_order 기준)를 대표 이미지로 설정

WITH ranked_images AS (
  SELECT 
    id,
    customer_id,
    story_scene,
    display_order,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY customer_id, story_scene 
      ORDER BY 
        COALESCE(display_order, 999999) ASC,  -- display_order가 null이면 뒤로
        created_at ASC
    ) as rn
  FROM image_metadata
  WHERE story_scene IS NOT NULL
    AND story_scene BETWEEN 1 AND 7
)
UPDATE image_metadata im
SET is_scene_representative = true
FROM ranked_images ri
WHERE im.id = ri.id 
  AND ri.rn = 1
  AND (im.is_scene_representative IS NULL OR im.is_scene_representative = false);

-- 마이그레이션 결과 확인
SELECT 
  story_scene,
  COUNT(*) as total_images,
  COUNT(*) FILTER (WHERE is_scene_representative = true) as representative_images
FROM image_metadata
WHERE story_scene IS NOT NULL
GROUP BY story_scene
ORDER BY story_scene;
