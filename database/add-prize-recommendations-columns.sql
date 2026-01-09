-- ==========================================
-- prize_recommendations 테이블에 누락된 컬럼 추가
-- ==========================================

-- days_since_last_purchase 컬럼 추가 (구매 후 경과 일수)
ALTER TABLE prize_recommendations 
ADD COLUMN IF NOT EXISTS days_since_last_purchase INTEGER;

-- recent_survey_date 컬럼 추가 (최근 설문일)
ALTER TABLE prize_recommendations 
ADD COLUMN IF NOT EXISTS recent_survey_date DATE;

-- 인덱스 추가 (선택사항, 성능 향상)
CREATE INDEX IF NOT EXISTS idx_prize_recommendations_days_since_last_purchase 
ON prize_recommendations(days_since_last_purchase);

CREATE INDEX IF NOT EXISTS idx_prize_recommendations_recent_survey_date 
ON prize_recommendations(recent_survey_date);

