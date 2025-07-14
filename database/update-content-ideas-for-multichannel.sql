-- MultiChannelManager가 필요한 컬럼 추가

-- 1. platform 컬럼 추가
ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'blog';

-- 2. content 컬럼 추가 (topic이 이미 있으므로 content로 매핑 가능)
ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS content TEXT;

-- 3. scheduled_date 컬럼 추가
ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- 4. tags 컬럼 추가 (target_keywords를 사용할 수도 있음)
ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS tags TEXT;

-- 5. assignee 컬럼이 assigned_to로 되어있으므로 OK

-- 6. 기존 데이터의 platform 값 설정
UPDATE content_ideas 
SET platform = CASE 
    WHEN for_naver = true THEN 'naver'
    WHEN for_website = true THEN 'blog'
    ELSE 'blog'
END
WHERE platform IS NULL;

-- 7. content 필드에 topic 내용 복사 (필요시)
UPDATE content_ideas 
SET content = topic 
WHERE content IS NULL AND topic IS NOT NULL;

-- 8. 테스트 데이터 추가
INSERT INTO content_ideas (
    title, 
    topic,
    content, 
    platform, 
    status, 
    assigned_to, 
    scheduled_date,
    priority
) VALUES 
('7월 인스타그램 콘텐츠', '신제품 드라이버 소개', '새로운 드라이버의 특징을 인스타그램 릴스로 소개', 'instagram', 'idea', '스테피', '2025-07-15', 3),
('유튜브 골프 레슨 영상', '비거리 늘리는 법', '초보자를 위한 드라이버 비거리 향상 팁', 'youtube', 'idea', '허상원', '2025-07-20', 2),
('카카오톡 채널 이벤트', '7월 프로모션', '여름 특별 할인 이벤트 안내', 'kakao', 'draft', '나과장', '2025-07-10', 1),
('틱톡 챌린지', '골프 스윙 챌린지', '#마스골프스윙챌린지 진행', 'tiktok', 'idea', '제이', '2025-07-25', 2);