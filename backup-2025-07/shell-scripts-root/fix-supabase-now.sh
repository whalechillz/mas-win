#!/bin/bash

echo "🚨 Supabase 연결 오류 긴급 해결"
echo "==============================="
echo ""
echo "현재 오류: TypeError: Failed to fetch"
echo "원인: Supabase 테이블이 없거나 RLS 정책 문제"
echo ""
echo "📌 즉시 해결 방법:"
echo ""
echo "=========================================="
echo "1단계: Supabase 대시보드 접속"
echo "=========================================="
echo "1. https://supabase.com/dashboard 접속"
echo "2. 프로젝트 선택: yyytjudftvpmcnppaymw"
echo ""
echo "=========================================="
echo "2단계: Table Editor 확인"
echo "=========================================="
echo "1. 왼쪽 메뉴에서 'Table Editor' 클릭"
echo "2. 다음 테이블이 있는지 확인:"
echo "   - page_views"
echo "   - campaign_metrics"
echo ""
echo "테이블이 없다면 -> 3단계로"
echo "테이블이 있다면 -> 4단계로"
echo ""
echo "=========================================="
echo "3단계: SQL Editor에서 테이블 생성 (테이블이 없는 경우)"
echo "=========================================="
echo "1. 왼쪽 메뉴에서 'SQL Editor' 클릭"
echo "2. 'New query' 버튼 클릭"
echo "3. 아래 SQL 전체를 복사해서 붙여넣기:"
echo ""
cat << 'SQL'
-- 테이블 삭제 (기존 테이블이 잘못된 경우)
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS campaign_metrics CASCADE;

-- 1. 테이블 새로 생성
CREATE TABLE page_views (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  referer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE campaign_metrics (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) UNIQUE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  phone_clicks INTEGER DEFAULT 0,
  form_submissions INTEGER DEFAULT 0,
  quiz_completions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS 비활성화 (테스트용)
ALTER TABLE page_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics DISABLE ROW LEVEL SECURITY;

-- 3. 테스트 데이터 추가
INSERT INTO campaign_metrics (campaign_id, views, phone_clicks, form_submissions)
VALUES ('2025-07', 100, 10, 5);

INSERT INTO page_views (campaign_id, page_url)
VALUES ('2025-07', '/test-page');

-- 4. 확인
SELECT 'Tables created successfully!' as status;
SELECT COUNT(*) as count FROM page_views;
SELECT COUNT(*) as count FROM campaign_metrics;
SQL
echo ""
echo "4. 'RUN' 버튼 클릭"
echo "5. 성공 메시지 확인"
echo ""
echo "=========================================="
echo "4단계: API Settings 확인 (테이블이 있는 경우)"
echo "=========================================="
echo "1. Settings > API 메뉴"
echo "2. 'anon public' 키 확인"
echo "3. .env.local 파일의 키와 일치하는지 확인"
echo ""
echo "=========================================="
echo "5단계: 브라우저에서 테스트"
echo "=========================================="
echo "1. 브라우저 캐시 삭제 (Cmd+Shift+R 또는 Ctrl+Shift+R)"
echo "2. http://localhost:3000/debug-tracking 새로고침"
echo "3. '테스트 조회수 추가' 버튼 클릭"
echo ""
echo "=========================================="
echo "그래도 안 되면: CORS 설정 확인"
echo "=========================================="
echo "Supabase Dashboard > Settings > API"
echo "CORS 설정에 다음 추가:"
echo "- http://localhost:3000"
echo "- https://win.masgolf.co.kr"
echo ""
echo "⚡ 빠른 테스트 방법:"
echo "브라우저 콘솔(F12)에서 실행:"
echo ""
echo "fetch('https://yyytjudftvpmcnppaymw.supabase.co/rest/v1/page_views?select=count', {"
echo "  headers: {"
echo "    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE'"
echo "  }"
echo "}).then(r => r.json()).then(console.log).catch(console.error)"