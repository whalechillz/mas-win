-- 빠른 해결: 컴포넌트가 기대하는 필드 추가

-- 1. assignee 컬럼 추가 (컴포넌트가 사용)
ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS assignee VARCHAR(100);

-- 2. 기존 assigned_to 데이터를 assignee로 복사
UPDATE content_ideas 
SET assignee = assigned_to 
WHERE assignee IS NULL AND assigned_to IS NOT NULL;

-- 3. tags 컬럼 추가 (TEXT 타입으로, target_keywords와는 별개)
ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS tags TEXT;

-- 4. RLS 비활성화 (권한 문제 해결)
ALTER TABLE content_ideas DISABLE ROW LEVEL SECURITY;

-- 5. 테스트 데이터 추가
INSERT INTO content_ideas (
    title, 
    topic,
    content, 
    platform, 
    status, 
    assignee,
    assigned_to,
    scheduled_date,
    tags,
    priority
) VALUES 
('7월 인스타그램 릴스', '신제품 소개', '새로운 드라이버 특징 소개', 'instagram', 'idea', '스테피', '스테피', '2025-07-15', '신제품,드라이버,인스타', 2),
('유튜브 골프 레슨', '비거리 향상', '초보자 드라이버 팁', 'youtube', 'writing', '허상원', '허상원', '2025-07-20', '레슨,드라이버,초보자', 1),
('카카오톡 이벤트', '7월 프로모션', '여름 특별 할인', 'kakao', 'ready', '나과장', '나과장', '2025-07-10', '이벤트,할인,프로모션', 1),
('틱톡 챌린지', '스윙 챌린지', '#마스골프챌린지', 'tiktok', 'idea', '제이', '제이', '2025-07-25', '챌린지,틱톡,바이럴', 3),
('자사 블로그', '골프 클럽 관리법', '여름철 클럽 관리 팁', 'blog', 'published', '제이', '제이', '2025-07-05', '팁,관리,블로그', 2)
ON CONFLICT DO NOTHING;