-- 스캔 서류 분류 시스템 1차: 데이터베이스 스키마

-- 1. image_assets 테이블 확장
ALTER TABLE image_assets 
ADD COLUMN IF NOT EXISTS is_scanned_document BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_image_assets_is_scanned_document 
  ON image_assets(is_scanned_document);
CREATE INDEX IF NOT EXISTS idx_image_assets_document_type 
  ON image_assets(document_type);

-- 2. scanned_documents 테이블 생성 (기본 구조만, OCR 필드는 2차에서 추가)
CREATE TABLE IF NOT EXISTS scanned_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
  image_asset_id UUID REFERENCES image_assets(id) ON DELETE CASCADE,
  
  -- 문서 정보
  document_type VARCHAR(50) NOT NULL, -- 'order_spec', 'survey', 'consent', 'other'
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_url TEXT,
  
  -- OCR 관련 필드는 2차에서 추가
  -- ocr_text TEXT,
  -- ocr_json JSONB,
  -- ocr_confidence DECIMAL(5,2),
  -- ocr_status VARCHAR(20) DEFAULT 'pending',
  
  -- 메타데이터
  visit_date DATE,
  detected_at TIMESTAMP DEFAULT NOW(), -- 분류된 시각
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_scanned_documents_customer_id 
  ON scanned_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_document_type 
  ON scanned_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_visit_date 
  ON scanned_documents(visit_date);
CREATE INDEX IF NOT EXISTS idx_scanned_documents_image_asset_id 
  ON scanned_documents(image_asset_id);

-- 코멘트 추가
COMMENT ON TABLE scanned_documents IS '스캔 서류 기본 정보 (OCR 필드는 2차에서 추가)';
COMMENT ON COLUMN scanned_documents.document_type IS '문서 타입: order_spec(주문사양서), survey(설문조사), consent(동의서), other(기타)';
COMMENT ON COLUMN scanned_documents.detected_at IS '문서로 분류된 시각';
