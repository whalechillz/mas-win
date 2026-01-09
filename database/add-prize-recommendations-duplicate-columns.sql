-- ==========================================
-- prize_recommendations 테이블에 중복 관리 컬럼 추가
-- ==========================================

-- is_duplicate 컬럼 추가 (중복 설문 여부)
ALTER TABLE prize_recommendations 
ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN DEFAULT false;

-- is_primary 컬럼 추가 (최신 설문 여부)
ALTER TABLE prize_recommendations 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true;

-- duplicate_count 컬럼 추가 (중복 횟수)
ALTER TABLE prize_recommendations 
ADD COLUMN IF NOT EXISTS duplicate_count INTEGER DEFAULT 1;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_prize_recommendations_is_primary 
ON prize_recommendations(is_primary);

CREATE INDEX IF NOT EXISTS idx_prize_recommendations_is_duplicate 
ON prize_recommendations(is_duplicate);

