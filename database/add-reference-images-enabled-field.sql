-- product_composition 테이블에 참조 이미지 활성화 필드 추가

-- 참조 이미지 활성화 상태 (JSONB)
-- 예시: {"image_url_1": true, "image_url_2": false}
ALTER TABLE product_composition ADD COLUMN IF NOT EXISTS reference_images_enabled JSONB DEFAULT '{}';
COMMENT ON COLUMN product_composition.reference_images_enabled IS '참조 이미지 활성화 상태 (JSONB 객체, 키: 이미지 URL, 값: boolean)';

-- 인덱스 추가 (선택사항, JSONB 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_product_composition_ref_images_enabled ON product_composition USING GIN (reference_images_enabled);
