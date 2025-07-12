-- team_members 테이블 (이미지 1 참고)
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'admin', 'staff'
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 인증 정보
CREATE TABLE user_auth (
  id SERIAL PRIMARY KEY,
  team_member_id INTEGER REFERENCES team_members(id),
  password_hash VARCHAR(255) NOT NULL,
  is_temp_password BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 권한 관리
CREATE TABLE user_permissions (
  id SERIAL PRIMARY KEY,
  team_member_id INTEGER REFERENCES team_members(id),
  permission VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 초기 데이터
INSERT INTO team_members (name, email, role) VALUES
('관리자', 'taksoo.kim@gmail.com', 'admin'),
('제이', 'mas9golf2@gmail.com', 'staff'),
('스테피', 'mas9golf3@gmail.com', 'staff'),
('나부장', 'singsingstour@gmail.com', 'staff'),
('허상원', 'mas9golf@gmail.com', 'staff');
