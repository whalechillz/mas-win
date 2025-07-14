-- monthly_themes 테이블 스키마 및 description 필드 확인

-- 1. 테이블 구조 확인
\d monthly_themes

-- 2. description 컬럼 존재 여부 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'monthly_themes'
  AND column_name = 'description';

-- 3. 만약 description 컬럼이 없다면 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'monthly_themes'
          AND column_name = 'description'
    ) THEN
        ALTER TABLE monthly_themes ADD COLUMN description TEXT;
        RAISE NOTICE 'description 컬럼이 추가되었습니다.';
    ELSE
        RAISE NOTICE 'description 컬럼이 이미 존재합니다.';
    END IF;
END $$;

-- 4. 현재 저장된 데이터 확인 (description 포함)
SELECT 
    year, 
    month, 
    theme, 
    description,
    objective,
    CASE 
        WHEN description IS NOT NULL AND description != '' THEN '✅ 있음'
        ELSE '❌ 없음'
    END as "슬로건 유무"
FROM monthly_themes
ORDER BY year DESC, month DESC
LIMIT 20;

-- 5. description이 비어있는 레코드 확인
SELECT COUNT(*) as "슬로건이 없는 테마 수"
FROM monthly_themes
WHERE description IS NULL OR description = '';
