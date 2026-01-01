-- 카카오 채널 관련 테이블 생성 확인 쿼리
-- Supabase SQL Editor에서 실행하세요

-- 1. kakao_friend_mappings 테이블 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'kakao_friend_mappings'
ORDER BY ordinal_position;

-- 2. kakao_recipient_groups 테이블 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'kakao_recipient_groups'
ORDER BY ordinal_position;

-- 3. 인덱스 확인
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('kakao_friend_mappings', 'kakao_recipient_groups')
ORDER BY tablename, indexname;

-- 4. 테이블 존재 여부 확인
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('kakao_friend_mappings', 'kakao_recipient_groups')
ORDER BY table_name;

-- 5. 테이블 행 수 확인 (데이터가 있는 경우)
SELECT 
  'kakao_friend_mappings' as table_name,
  COUNT(*) as row_count
FROM kakao_friend_mappings
UNION ALL
SELECT 
  'kakao_recipient_groups' as table_name,
  COUNT(*) as row_count
FROM kakao_recipient_groups;

