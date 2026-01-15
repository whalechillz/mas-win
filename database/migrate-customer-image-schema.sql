-- 고객 이미지 관리 시스템 스키마 확장
-- image_metadata 테이블 확장

ALTER TABLE image_metadata 
ADD COLUMN IF NOT EXISTS story_scene INTEGER,           -- 1-7 (장면 번호)
ADD COLUMN IF NOT EXISTS image_type VARCHAR(50),        -- hero, swing-consultation 등
ADD COLUMN IF NOT EXISTS original_filename TEXT,       -- 원본 한글 파일명
ADD COLUMN IF NOT EXISTS english_filename TEXT,         -- 영문 파일명
ADD COLUMN IF NOT EXISTS customer_name_en VARCHAR(100), -- 영문 이름
ADD COLUMN IF NOT EXISTS customer_initials VARCHAR(10), -- 이니셜 (jjs)
ADD COLUMN IF NOT EXISTS image_quality VARCHAR(20) DEFAULT 'final', -- final, draft, temp
ADD COLUMN IF NOT EXISTS metadata JSONB;                -- 추가 메타데이터

-- customers 테이블 확장
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS name_en VARCHAR(100),         -- 영문 이름
ADD COLUMN IF NOT EXISTS initials VARCHAR(10),         -- 이니셜
ADD COLUMN IF NOT EXISTS folder_name VARCHAR(100);     -- 폴더명 (jang-jinsu-8189)

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_image_metadata_story_scene ON image_metadata(story_scene);
CREATE INDEX IF NOT EXISTS idx_image_metadata_image_type ON image_metadata(image_type);
CREATE INDEX IF NOT EXISTS idx_image_metadata_customer_initials ON image_metadata(customer_initials);
CREATE INDEX IF NOT EXISTS idx_customers_folder_name ON customers(folder_name);

-- 코멘트 추가
COMMENT ON COLUMN image_metadata.story_scene IS '스토리 장면 번호 (1: 행복한 주인공, 2: 행복+불안, 3: 문제 발생, 4: 가이드 만남, 5: 가이드 장소, 6: 성공 회복, 7: 여운 정적)';
COMMENT ON COLUMN image_metadata.image_type IS '이미지 타입 (hero, swing-consultation, measurement, art-wall, signature 등)';
COMMENT ON COLUMN image_metadata.image_quality IS '이미지 품질 상태 (final: 최종, draft: 초안, temp: 임시)';
