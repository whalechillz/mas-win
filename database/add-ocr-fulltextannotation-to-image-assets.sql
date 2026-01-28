-- image_assets 테이블에 OCR fullTextAnnotation 저장 컬럼 추가
-- 문서 재구성 기능을 위한 구조 정보 저장

-- ocr_fulltextannotation 컬럼 추가 (JSONB 타입으로 구조 정보 저장)
ALTER TABLE image_assets 
ADD COLUMN IF NOT EXISTS ocr_fulltextannotation JSONB;

-- 인덱스 추가 (JSONB 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_image_assets_ocr_fulltextannotation 
  ON image_assets USING gin(ocr_fulltextannotation);

-- 코멘트 추가
COMMENT ON COLUMN image_assets.ocr_fulltextannotation IS 'Google Vision API의 fullTextAnnotation 구조 정보 (문서 재구성용)';
