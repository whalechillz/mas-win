-- image_assets 테이블에 is_liked 컬럼 추가
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- 
-- 문제: metadata -> image_assets 테이블 마이그레이션 중 is_liked 컬럼이 누락됨
-- 해결: image_assets 테이블에 is_liked 컬럼 추가

-- 1. is_liked 컬럼 추가
ALTER TABLE image_assets
ADD COLUMN IF NOT EXISTS is_liked BOOLEAN DEFAULT FALSE;

-- 2. 인덱스 추가 (좋아요 필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_image_assets_is_liked 
ON image_assets(is_liked) 
WHERE is_liked = TRUE;

-- 3. 코멘트 추가
COMMENT ON COLUMN image_assets.is_liked IS '이미지 좋아요 상태 (true: 좋아요, false: 좋아요 안 함)';

-- 4. 기존 image_metadata 테이블의 is_liked 데이터가 있다면 마이그레이션 (선택사항)
-- 주의: image_metadata와 image_assets의 URL 매칭이 필요합니다
-- image_metadata.image_url = image_assets.cdn_url로 매칭

-- 마이그레이션 스크립트 (image_metadata에 is_liked 데이터가 있는 경우에만 실행)
-- UPDATE image_assets ia
-- SET is_liked = im.is_liked
-- FROM image_metadata im
-- WHERE ia.cdn_url = im.image_url
--   AND im.is_liked IS NOT NULL
--   AND im.is_liked = TRUE;
