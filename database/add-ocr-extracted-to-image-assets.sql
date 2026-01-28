-- image_assets 테이블에 OCR 관련 컬럼 추가
-- OCR 기능을 위한 메타데이터 컬럼

-- 1. ocr_extracted 컬럼 추가 (OCR로 텍스트 추출되었는지 여부)
ALTER TABLE image_assets 
ADD COLUMN IF NOT EXISTS ocr_extracted BOOLEAN DEFAULT FALSE;

-- 2. ocr_text 컬럼 추가 (추출된 텍스트 저장)
ALTER TABLE image_assets 
ADD COLUMN IF NOT EXISTS ocr_text TEXT;

-- 3. ocr_confidence 컬럼 추가 (OCR 신뢰도 점수)
ALTER TABLE image_assets 
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(5,2);

-- 4. ocr_processed_at 컬럼 추가 (OCR 처리 시각)
ALTER TABLE image_assets 
ADD COLUMN IF NOT EXISTS ocr_processed_at TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가 (OCR로 추출된 이미지 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_image_assets_ocr_extracted 
  ON image_assets(ocr_extracted);

-- 코멘트 추가
COMMENT ON COLUMN image_assets.ocr_extracted IS 'OCR로 텍스트가 추출되었는지 여부';
COMMENT ON COLUMN image_assets.ocr_text IS 'OCR로 추출된 텍스트 내용';
COMMENT ON COLUMN image_assets.ocr_confidence IS 'OCR 처리 신뢰도 점수 (0.00 ~ 1.00)';
COMMENT ON COLUMN image_assets.ocr_processed_at IS 'OCR 처리 완료 시각';
