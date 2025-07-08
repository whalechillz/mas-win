-- 기존 영어 데이터를 한글로 변환하는 SQL 쿼리

-- 1. bookings 테이블의 priority 필드 한글로 변환
UPDATE bookings
SET priority = CASE 
    WHEN priority = 'distance' THEN '비거리'
    WHEN priority = 'direction' THEN '방향성'
    WHEN priority = 'comfort' THEN '편안함'
    ELSE priority
END
WHERE priority IN ('distance', 'direction', 'comfort');

-- 2. bookings 테이블의 swing_style 필드 한글로 변환
UPDATE bookings
SET swing_style = CASE 
    WHEN swing_style = 'stability' THEN '안정형'
    WHEN swing_style = 'power' THEN '파워형'
    WHEN swing_style = 'hybrid' THEN '복합형'
    ELSE swing_style
END
WHERE swing_style IN ('stability', 'power', 'hybrid');

-- 3. contacts 테이블의 priority 필드 한글로 변환
UPDATE contacts
SET priority = CASE 
    WHEN priority = 'distance' THEN '비거리'
    WHEN priority = 'direction' THEN '방향성'
    WHEN priority = 'comfort' THEN '편안함'
    ELSE priority
END
WHERE priority IN ('distance', 'direction', 'comfort');

-- 4. contacts 테이블의 swing_style 필드 한글로 변환
UPDATE contacts
SET swing_style = CASE 
    WHEN swing_style = 'stability' THEN '안정형'
    WHEN swing_style = 'power' THEN '파워형'
    WHEN swing_style = 'hybrid' THEN '복합형'
    ELSE swing_style
END
WHERE swing_style IN ('stability', 'power', 'hybrid');

-- 변환 결과 확인
SELECT 'bookings' as table_name, swing_style, priority, count(*) 
FROM bookings 
GROUP BY swing_style, priority

UNION ALL

SELECT 'contacts' as table_name, swing_style, priority, count(*) 
FROM contacts 
GROUP BY swing_style, priority;
