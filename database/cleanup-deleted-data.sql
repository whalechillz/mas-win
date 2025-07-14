-- 정기적으로 실행하는 DB 정리 스크립트
-- 30일 이상 된 삭제 데이터를 완전 삭제

-- 1. 삭제된 지 30일 이상 된 데이터 확인
SELECT id, title, updated_at 
FROM content_ideas 
WHERE status = 'deleted' 
AND updated_at < NOW() - INTERVAL '30 days';

-- 2. 참조 관계 확인
SELECT ci.id, ci.title, COUNT(np.id) as naver_refs
FROM content_ideas ci
LEFT JOIN naver_publishing np ON np.content_idea_id = ci.id
WHERE ci.status = 'deleted'
AND ci.updated_at < NOW() - INTERVAL '30 days'
GROUP BY ci.id, ci.title;

-- 3. 참조가 없는 삭제 데이터만 완전 삭제
DELETE FROM content_ideas 
WHERE status = 'deleted'
AND updated_at < NOW() - INTERVAL '30 days'
AND id NOT IN (
    SELECT DISTINCT content_idea_id 
    FROM naver_publishing 
    WHERE content_idea_id IS NOT NULL
);

-- 4. 또는 CASCADE로 관련 데이터까지 모두 삭제 (주의!)
-- DELETE FROM content_ideas 
-- WHERE status = 'deleted'
-- AND updated_at < NOW() - INTERVAL '30 days'
-- CASCADE;