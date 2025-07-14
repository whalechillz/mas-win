-- 소프트 삭제 방식으로 전환

-- 1. status에 'deleted' 옵션 추가 (이미 가능)
UPDATE content_ideas 
SET status = 'deleted'
WHERE title IN ('드그', '로', '골프 비거리');

-- 2. 삭제된 항목 확인
SELECT title, status FROM content_ideas 
WHERE status = 'deleted';

-- 3. UI에서 deleted 상태 제외하여 조회
SELECT * FROM content_ideas 
WHERE status != 'deleted'
ORDER BY created_at DESC;

-- 4. 나중에 완전 삭제가 필요하면
-- 먼저 참조 확인
SELECT np.*, ci.title 
FROM naver_publishing np
JOIN content_ideas ci ON np.content_idea_id = ci.id
WHERE ci.status = 'deleted';

-- 참조가 없는 deleted 항목만 삭제
DELETE FROM content_ideas 
WHERE status = 'deleted'
AND id NOT IN (
    SELECT DISTINCT content_idea_id 
    FROM naver_publishing 
    WHERE content_idea_id IS NOT NULL
);