-- MD 참조 파일 테이블 생성
CREATE TABLE IF NOT EXISTS md_reference_files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER DEFAULT 0,
  content TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_md_files_filename ON md_reference_files(filename);
CREATE INDEX IF NOT EXISTS idx_md_files_uploaded_at ON md_reference_files(uploaded_at);

-- RLS (Row Level Security) 설정
ALTER TABLE md_reference_files ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능하도록 정책 설정 (개발용)
CREATE POLICY "Enable all operations for all users" ON md_reference_files
FOR ALL USING (true);

-- 업데이트 시간 자동 갱신을 위한 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_md_files_updated_at 
    BEFORE UPDATE ON md_reference_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
