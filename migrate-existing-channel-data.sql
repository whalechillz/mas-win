-- 네이버 블로그와 카카오 채널 데이터 마이그레이션

-- 1. channel_naver_blog 테이블의 기존 데이터에 calendar_id 연결
UPDATE channel_naver_blog
SET calendar_id = cc.id
FROM cc_content_calendar cc
WHERE channel_naver_blog.id::text = cc.naver_blog_id::text 
AND channel_naver_blog.calendar_id IS NULL;

-- 2. channel_kakao 테이블의 기존 데이터에 calendar_id 연결
UPDATE channel_kakao
SET calendar_id = cc.id
FROM cc_content_calendar cc
WHERE channel_kakao.id::text = cc.kakao_id::text 
AND channel_kakao.calendar_id IS NULL;

-- 3. 결과 확인
SELECT 'channel_naver_blog' as table_name, id, title, calendar_id FROM channel_naver_blog WHERE calendar_id IS NOT NULL
UNION ALL
SELECT 'channel_kakao' as table_name, id, COALESCE(title, 'No title') as title, calendar_id FROM channel_kakao WHERE calendar_id IS NOT NULL
UNION ALL
SELECT 'channel_sms' as table_name, id, message_text as title, calendar_id FROM channel_sms WHERE calendar_id IS NOT NULL;
