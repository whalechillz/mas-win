-- user_auth 테이블 생성
CREATE TABLE IF NOT EXISTS user_auth (
  id SERIAL PRIMARY KEY,
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  is_temp_password BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_user_auth_team_member_id ON user_auth(team_member_id);

-- 초기 비밀번호 설정 (bcrypt hash of '1234')
-- 실제로는 bcrypt를 사용해서 해시해야 함
-- $2a$10$xxxxxxxxxxx는 '1234'의 bcrypt 해시값