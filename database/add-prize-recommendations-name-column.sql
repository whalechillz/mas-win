-- ==========================================
-- prize_recommendations 테이블에 이름 컬럼 추가
-- ==========================================

-- recommendation_name 컬럼 추가 (경품 추천 이름/제목)
ALTER TABLE prize_recommendations 
ADD COLUMN IF NOT EXISTS recommendation_name VARCHAR(255);

-- 인덱스 추가 (선택사항, 성능 향상)
CREATE INDEX IF NOT EXISTS idx_prize_recommendations_name 
ON prize_recommendations(recommendation_name);
