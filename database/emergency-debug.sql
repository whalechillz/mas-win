-- 긴급 디버깅 SQL
-- Supabase SQL Editor에서 실행

-- 1. 권한 상태 확인
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public' 
AND table_name = 'content_ideas'
ORDER BY grantee, privilege_type;

-- 2. RLS 상태 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'content_ideas';

-- 3. Service Role로 직접 테스트
-- Supabase Dashboard → Settings → API → Service Role Key 사용
-- REST API로 직접 테스트:
/*
curl -X POST 'https://yyytjudftrvpmcnppaymw.supabase.co/rest/v1/content_ideas' \
-H "apikey: YOUR_SERVICE_ROLE_KEY" \
-H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
-H "Content-Type: application/json" \
-d '{
  "title": "CURL 테스트",
  "content": "직접 API 테스트",
  "platform": "blog",
  "status": "idea",
  "assignee": "테스트",
  "scheduled_date": "2025-07-15",
  "tags": "test"
}'
*/