-- 1. 기존 content_ideas 테이블 구조 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'content_ideas'
ORDER BY ordinal_position;

-- 2. platform 컬럼이 없다면 추가
ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT 'blog';

-- 3. 기타 필요한 컬럼들 추가
ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS scheduled_date DATE;

ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS published_date DATE;

ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS tags TEXT;

ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS media_urls TEXT[];

ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;

ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0;

ALTER TABLE content_ideas 
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0;

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_ideas_platform ON content_ideas(platform);
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON content_ideas(status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_scheduled ON content_ideas(scheduled_date);

-- 5. 기존 데이터에 platform 값 설정 (없다면)
UPDATE content_ideas 
SET platform = 'blog' 
WHERE platform IS NULL;

-- 6. 테스트용 멀티채널 데이터 추가
INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date) 
VALUES 
('인스타그램 신제품 소개', '신제품 드라이버 인스타그램 릴스', 'instagram', 'idea', '스테피', '2025-07-15'),
('유튜브 골프 레슨', '초보자를 위한 드라이버 레슨', 'youtube', 'idea', '허상원', '2025-07-20'),
('카카오톡 이벤트 안내', '7월 특별 할인 이벤트', 'kakao', 'draft', '나과장', '2025-07-10')
ON CONFLICT DO NOTHING;