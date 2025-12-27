-- 마이그레이션 확인 쿼리
-- admin_users 테이블의 현재 구조 확인

-- 1. 모든 컬럼 확인
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'admin_users'
ORDER BY ordinal_position;

-- 2. 인덱스 확인
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'admin_users';

-- 3. 트리거 확인
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'admin_users';

-- 4. 새로 추가된 컬럼 데이터 확인
SELECT 
  id,
  name,
  phone,
  role,
  is_active,
  last_login,
  created_at,
  updated_at
FROM admin_users
LIMIT 5;

