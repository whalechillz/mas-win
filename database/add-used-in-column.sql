-- image_metadata 테이블에 used_in 컬럼 추가
ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS used_in JSONB DEFAULT '[]';

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_image_metadata_used_in ON image_metadata USING GIN(used_in);

-- 컬럼 설명 추가
COMMENT ON COLUMN image_metadata.used_in IS '이미지 사용 위치 정보 배열 (type, title, url, date, account 등)';
