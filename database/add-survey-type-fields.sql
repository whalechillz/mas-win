-- 설문 타입 및 카테고리 필드 추가
-- Supabase SQL Editor에서 실행

-- surveys 테이블에 필드 추가
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS survey_type VARCHAR(50) DEFAULT 'product_survey';
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS survey_category VARCHAR(50) DEFAULT 'muziik-2025';
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_surveys_survey_type ON surveys(survey_type);
CREATE INDEX IF NOT EXISTS idx_surveys_survey_category ON surveys(survey_category);
CREATE INDEX IF NOT EXISTS idx_surveys_is_active ON surveys(is_active);

-- 기존 데이터 업데이트 (기본값 설정)
UPDATE surveys 
SET 
  survey_type = COALESCE(survey_type, 'product_survey'),
  survey_category = COALESCE(survey_category, 'muziik-2025'),
  is_active = COALESCE(is_active, true)
WHERE survey_type IS NULL OR survey_category IS NULL OR is_active IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN surveys.survey_type IS '설문 타입: product_survey, event_survey, feedback_survey 등';
COMMENT ON COLUMN surveys.survey_category IS '설문 카테고리: muziik-2025, summer-2025 등';
COMMENT ON COLUMN surveys.is_active IS '활성 설문 여부: true인 설문만 경품 추천에 포함';

