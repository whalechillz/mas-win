-- Supabase SQL Editor에서 실행할 쿼리

-- 기존 데이터 삭제 (필요시)
-- DELETE FROM team_members;

-- 팀 멤버 데이터 삽입
INSERT INTO team_members (name, email, role, is_active) VALUES
('관리자', 'taksoo.kim@gmail.com', 'admin', true),
('제이', 'mas9golf2@gmail.com', 'staff', true),
('스테피', 'mas9golf3@gmail.com', 'staff', true),
('나부장', 'singsingstour@gmail.com', 'staff', true),
('허상원', 'mas9golf@gmail.com', 'staff', true);

-- 확인
SELECT * FROM team_members;