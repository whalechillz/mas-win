#!/bin/bash

# Supabase에서 현재 스키마 덤프하기
# 1. Supabase Dashboard에서:
#    - Settings > Database > Connection string 복사
#    - pg_dump 사용

# 2. 또는 Supabase CLI 사용:
npx supabase db dump --schema public > database/schema.sql

# 3. 또는 SQL Editor에서 실행:
cat << 'EOF' > database/get-schema.sql
-- 테이블 구조 조회
SELECT 
    'CREATE TABLE ' || table_name || ' (' || 
    string_agg(
        column_name || ' ' || 
        data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')' 
            ELSE '' 
        END ||
        CASE 
            WHEN is_nullable = 'NO' 
            THEN ' NOT NULL' 
            ELSE '' 
        END ||
        CASE 
            WHEN column_default IS NOT NULL 
            THEN ' DEFAULT ' || column_default 
            ELSE '' 
        END,
        ', '
    ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
EOF
