-- contacts 테이블에 퀴즈 결과 필드 추가
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS swing_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_distance VARCHAR(50);

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_contacts_swing_style ON contacts(swing_style);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);
