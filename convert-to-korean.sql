-- 기존 영어 데이터를 한글로 변환하는 SQL
-- 실행 전 백업을 권장합니다!

-- bookings 테이블의 priority(중요요소) 영어 -> 한글 변환
UPDATE bookings
SET priority = CASE
    WHEN priority = 'distance' THEN '비거리'
    WHEN priority = 'direction' THEN '방향성'
    WHEN priority = 'comfort' THEN '편안함'
    ELSE priority
END
WHERE priority IN ('distance', 'direction', 'comfort');

-- bookings 테이블의 swing_style(스윙타입) 영어 -> 한글 변환
UPDATE bookings
SET swing_style = CASE
    WHEN swing_style = 'stability' THEN '안정형'
    WHEN swing_style = 'power' THEN '파워형'
    WHEN swing_style = 'hybrid' THEN '복합형'
    ELSE swing_style
END
WHERE swing_style IN ('stability', 'power', 'hybrid');

-- contacts 테이블의 priority(중요요소) 영어 -> 한글 변환
UPDATE contacts
SET priority = CASE
    WHEN priority = 'distance' THEN '비거리'
    WHEN priority = 'direction' THEN '방향성'
    WHEN priority = 'comfort' THEN '편안함'
    ELSE priority
END
WHERE priority IN ('distance', 'direction', 'comfort');

-- contacts 테이블의 swing_style(스윙타입) 영어 -> 한글 변환
UPDATE contacts
SET swing_style = CASE
    WHEN swing_style = 'stability' THEN '안정형'
    WHEN swing_style = 'power' THEN '파워형'
    WHEN swing_style = 'hybrid' THEN '복합형'
    ELSE swing_style
END
WHERE swing_style IN ('stability', 'power', 'hybrid');

-- quiz_results 테이블도 변환 (있는 경우)
UPDATE quiz_results
SET priority = CASE
    WHEN priority = 'distance' THEN '비거리'
    WHEN priority = 'direction' THEN '방향성'
    WHEN priority = 'comfort' THEN '편안함'
    ELSE priority
END
WHERE priority IN ('distance', 'direction', 'comfort');

UPDATE quiz_results
SET style = CASE
    WHEN style = 'stability' THEN '안정형'
    WHEN style = 'power' THEN '파워형'
    WHEN style = 'hybrid' THEN '복합형'
    ELSE style
END
WHERE style IN ('stability', 'power', 'hybrid');

-- 변경된 데이터 확인
SELECT '=== Bookings 테이블 확인 ===' as title;
SELECT name, phone, swing_style, priority, current_distance, created_at
FROM bookings
WHERE swing_style IS NOT NULL OR priority IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

SELECT '=== Contacts 테이블 확인 ===' as title;
SELECT name, phone, swing_style, priority, current_distance, created_at
FROM contacts
WHERE swing_style IS NOT NULL OR priority IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
