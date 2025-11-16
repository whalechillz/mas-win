-- image_metadata 테이블에 is_liked 컬럼 추가
-- Supabase Dashboard > SQL Editor에서 실행하세요

ALTER TABLE image_metadata
ADD COLUMN IF NOT EXISTS is_liked BOOLEAN DEFAULT FALSE;

-- 인덱스 추가 (좋아요 필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_image_metadata_is_liked ON image_metadata(is_liked) WHERE is_liked = TRUE;

-- 코멘트 추가
COMMENT ON COLUMN image_metadata.is_liked IS '이미지 좋아요 상태 (true: 좋아요, false: 좋아요 안 함)';

