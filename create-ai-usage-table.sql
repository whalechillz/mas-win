-- AI 사용량 로그 테이블 생성
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  source VARCHAR(100) NOT NULL,
  url TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_action ON ai_usage_logs(action);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_source ON ai_usage_logs(source);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_timestamp ON ai_usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

-- RLS (Row Level Security) 설정
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (관리자만 접근 가능)
CREATE POLICY "Enable all access for authenticated users" ON ai_usage_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- 테이블 코멘트
COMMENT ON TABLE ai_usage_logs IS 'AI 사용량 추적 로그';
COMMENT ON COLUMN ai_usage_logs.action IS 'AI 작업 유형 (content-extraction, image-generation 등)';
COMMENT ON COLUMN ai_usage_logs.source IS 'AI 사용 소스 (naver-blog-scraper, blog-generator 등)';
COMMENT ON COLUMN ai_usage_logs.url IS '처리된 URL';
COMMENT ON COLUMN ai_usage_logs.metadata IS '추가 메타데이터 (JSON 형태)';
COMMENT ON COLUMN ai_usage_logs.user_agent IS '사용자 에이전트';
