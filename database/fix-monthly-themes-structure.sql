-- 🔧 monthly_themes 테이블 구조 수정 (필수 - 먼저 실행!)

-- 1. 누락된 컬럼들 추가
ALTER TABLE monthly_themes 
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS promotion_detail TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS promotion_details TEXT,
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(200),
ADD COLUMN IF NOT EXISTS focus_keywords TEXT[];

-- 2. 기존 데이터 업데이트 (있는 경우)
UPDATE monthly_themes 
SET description = theme 
WHERE description IS NULL;

-- 3. 테이블 구조 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'monthly_themes'
ORDER BY ordinal_position;

-- 4. 이제 통합 캠페인 SQL을 다시 실행할 수 있습니다