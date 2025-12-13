-- 로고 관리 시스템을 위한 데이터베이스 스키마 업데이트

-- 1. booking_settings 테이블에 MMS 로고 관련 필드 추가
ALTER TABLE booking_settings
ADD COLUMN IF NOT EXISTS mms_logo_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS mms_logo_color VARCHAR(7) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS mms_logo_size VARCHAR(10) DEFAULT 'medium';

-- 2. image_metadata 테이블에 로고 관련 필드 추가
ALTER TABLE image_metadata
ADD COLUMN IF NOT EXISTS is_logo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS logo_brand VARCHAR(50),
ADD COLUMN IF NOT EXISTS logo_type VARCHAR(20), -- 'full' | 'icon'
ADD COLUMN IF NOT EXISTS logo_color_variant VARCHAR(20); -- 'black' | 'white' | 'colored'

-- 3. 인덱스 생성 (로고 검색 성능 최적화)
CREATE INDEX IF NOT EXISTS idx_image_metadata_is_logo ON image_metadata(is_logo);
CREATE INDEX IF NOT EXISTS idx_image_metadata_logo_brand ON image_metadata(logo_brand);
CREATE INDEX IF NOT EXISTS idx_image_metadata_logo_type ON image_metadata(logo_type);

-- 4. 코멘트 추가
COMMENT ON COLUMN booking_settings.mms_logo_id IS 'MMS 발송 시 사용할 로고 이미지 ID (image_metadata.id 참조)';
COMMENT ON COLUMN booking_settings.mms_logo_color IS '로고 색상 (hex 코드, 예: #000000)';
COMMENT ON COLUMN booking_settings.mms_logo_size IS '로고 크기 (small: 400px, medium: 800px, large: 1200px)';
COMMENT ON COLUMN image_metadata.is_logo IS '로고 이미지 여부';
COMMENT ON COLUMN image_metadata.logo_brand IS '로고 브랜드명 (예: massgoo, mas9golf)';
COMMENT ON COLUMN image_metadata.logo_type IS '로고 타입 (full: 전체 로고, icon: 아이콘)';
COMMENT ON COLUMN image_metadata.logo_color_variant IS '로고 색상 변형 (black, white, colored)';

