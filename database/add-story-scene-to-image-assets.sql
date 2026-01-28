-- image_assets 테이블에 story_scene 컬럼 추가
-- 고객 스토리보드에서 이미지를 장면별로 분류하기 위한 컬럼

-- 1. story_scene 컬럼 추가 (고객 스토리 장면 번호: 1-7, null: 미할당)
ALTER TABLE image_assets
ADD COLUMN IF NOT EXISTS story_scene INTEGER;

-- 2. display_order 컬럼 추가 (같은 장면 내 이미지 표시 순서)
ALTER TABLE image_assets
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 3. 인덱스 추가 (고객별 장면별 이미지 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_image_assets_story_scene
ON image_assets(story_scene)
WHERE story_scene IS NOT NULL;

-- 4. ai_tags에 customer-{id} 태그가 있는 이미지의 장면별 인덱스 (선택)
-- 고객별 장면별 이미지 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_image_assets_customer_scene
ON image_assets USING GIN (ai_tags)
WHERE story_scene IS NOT NULL;

-- 5. 코멘트 추가
COMMENT ON COLUMN image_assets.story_scene IS '고객 스토리 장면 번호 (1-7: 행복한 주인공, 행복+불안, 문제 발생, 가이드 만남, 가이드 장소, 성공 회복, 여운 정적, null: 미할당)';
COMMENT ON COLUMN image_assets.display_order IS '같은 장면 내 이미지 표시 순서 (낮을수록 먼저 표시)';
