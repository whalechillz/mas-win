-- 고객 대표 이미지 설정 기능을 위한 스키마 수정
-- image_assets 테이블에 is_customer_representative 필드 추가

-- 1. image_assets 테이블에 대표 이미지 필드 추가
ALTER TABLE image_assets 
ADD COLUMN IF NOT EXISTS is_customer_representative BOOLEAN DEFAULT FALSE;

-- 2. 인덱스 추가 (고객별 대표 이미지 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_image_assets_is_customer_representative 
  ON image_assets(is_customer_representative);

-- 3. ai_tags에 customer-{id} 태그가 있는 이미지만 대상으로 하는 부분 인덱스
-- (대표 이미지 조회 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_image_assets_customer_representative_tags 
  ON image_assets USING GIN (ai_tags) 
  WHERE is_customer_representative = true;

-- 4. 코멘트 추가
COMMENT ON COLUMN image_assets.is_customer_representative IS '고객 목록 썸네일로 사용되는 대표 이미지 (고객당 하나만 true)';
