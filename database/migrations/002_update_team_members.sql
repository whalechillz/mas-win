-- team_members 테이블 role 업데이트 및 추가 멤버 삽입

-- 1. 기존 멤버 role 업데이트
UPDATE team_members 
SET role = 'admin' 
WHERE email = 'taksoo.kim@gmail.com';

UPDATE team_members 
SET role = 'staff' 
WHERE email IN ('mas9golf2@gmail.com', 'mas9golf3@gmail.com');

-- 2. 누락된 멤버 추가
INSERT INTO team_members (name, email, role) 
VALUES 
    ('나부장', 'singsingstour@gmail.com', 'staff'),
    ('허상원', 'mas9golf@gmail.com', 'staff')
ON CONFLICT (email) DO NOTHING;

-- 3. 현재 team_members 확인
SELECT * FROM team_members ORDER BY created_at;