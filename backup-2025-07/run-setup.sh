#!/bin/bash

# 스크립트 실행 권한 부여 및 실행
echo "🚀 스크립트 실행 권한 부여..."
chmod +x scripts/*.sh
chmod +x setup-all.sh

echo "
📋 실행 가능한 작업:

1. 전체 설정 실행:
   ./setup-all.sh

2. 개별 작업:
   - 기본 구조 설정: ./scripts/setup-main-site.sh
   - 컴포넌트 생성: ./scripts/create-main-components.sh
   - 도메인 설정: ./scripts/setup-domains.sh
   - DB 스키마 준비: ./scripts/setup-supabase-schema.sh

3. Supabase SQL 실행:
   - database/migrations/001_create_main_schema.sql (메인 사이트)
   - database/team_members_schema.sql (팀 멤버 - 이미 있음)

현재 준비된 파일:
"
ls -la scripts/
echo "
migrations 파일:"
ls -la database/migrations/
