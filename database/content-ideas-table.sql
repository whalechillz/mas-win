-- 멀티채널 관리를 위한 content_ideas 테이블 생성

CREATE TABLE IF NOT EXISTS content_ideas (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    platform VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'idea',
    assignee VARCHAR(100),
    scheduled_date DATE,
    published_date DATE,
    tags TEXT,
    media_urls TEXT[],
    
    -- 성과 지표
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    
    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_content_ideas_platform ON content_ideas(platform);
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON content_ideas(status);
CREATE INDEX IF NOT EXISTS idx_content_ideas_scheduled ON content_ideas(scheduled_date);

-- 샘플 데이터 추가
INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags) VALUES
('7월 신제품 드라이버 소개', '새로운 드라이버의 특징과 장점을 소개합니다', 'blog', 'published', '제이', '2025-07-01', '신제품,드라이버,골프클럽'),
('여름 골프 필수템 5가지', '무더운 여름철 골프 라운딩 필수 아이템', 'instagram', 'scheduled', '스테피', '2025-07-15', '여름골프,필수템,팁'),
('드라이버 비거리 늘리는 꿀팁', '초보자도 쉽게 따라할 수 있는 비거리 향상 팁', 'youtube', 'idea', '허상원', '2025-07-20', '드라이버,비거리,레슨'),
('7월 프로모션 안내', '여름 특별 할인 이벤트 안내', 'kakao', 'draft', '나과장', '2025-07-10', '프로모션,할인,이벤트');