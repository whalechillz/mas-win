-- 네이버 블로그 관리를 위한 초간단 구조

-- 1. 글감 마스터 테이블 (원본)
CREATE TABLE IF NOT EXISTS naver_content_master (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,          -- 기본 제목
    topic VARCHAR(500),                   -- 주제/글감
    keywords TEXT[],                      -- 키워드
    base_content TEXT,                    -- 기본 내용 (필요시)
    created_date DATE DEFAULT CURRENT_DATE,
    created_by VARCHAR(50)                -- 담당자
);

-- 2. 실제 발행 테이블 (각 계정별 발행 기록)
CREATE TABLE IF NOT EXISTS naver_posts (
    id SERIAL PRIMARY KEY,
    master_id INTEGER REFERENCES naver_content_master(id),
    
    -- 계정 정보
    account VARCHAR(50) NOT NULL,         -- mas9golf, massgoogolf, massgoogolfkorea  
    
    -- 발행 정보
    title VARCHAR(500) NOT NULL,          -- 실제 발행 제목 (변형됨)
    publish_date TIMESTAMP,               -- 실제 발행 시간
    naver_url TEXT,                      -- 네이버 URL
    
    -- 조회수
    view_count INTEGER DEFAULT 0,
    last_check TIMESTAMP,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'planned', -- planned, published
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 인덱스
CREATE INDEX idx_naver_posts_account ON naver_posts(account);
CREATE INDEX idx_naver_posts_master ON naver_posts(master_id);
CREATE INDEX idx_naver_posts_date ON naver_posts(publish_date);

-- 4. 실용적인 뷰 - 이번 주 발행 계획
CREATE OR REPLACE VIEW weekly_publish_plan AS
SELECT 
    cm.id,
    cm.title as base_title,
    cm.topic,
    -- 각 계정별 발행 상태
    MAX(CASE WHEN np.account = 'mas9golf' THEN np.status END) as mas9golf_status,
    MAX(CASE WHEN np.account = 'mas9golf' THEN np.publish_date END) as mas9golf_date,
    MAX(CASE WHEN np.account = 'mas9golf' THEN np.view_count END) as mas9golf_views,
    
    MAX(CASE WHEN np.account = 'massgoogolf' THEN np.status END) as massgoogolf_status,
    MAX(CASE WHEN np.account = 'massgoogolf' THEN np.publish_date END) as massgoogolf_date,
    MAX(CASE WHEN np.account = 'massgoogolf' THEN np.view_count END) as massgoogolf_views,
    
    MAX(CASE WHEN np.account = 'massgoogolfkorea' THEN np.status END) as massgoogolfkorea_status,
    MAX(CASE WHEN np.account = 'massgoogolfkorea' THEN np.publish_date END) as massgoogolfkorea_date,
    MAX(CASE WHEN np.account = 'massgoogolfkorea' THEN np.view_count END) as massgoogolfkorea_views
FROM naver_content_master cm
LEFT JOIN naver_posts np ON cm.id = np.master_id
GROUP BY cm.id, cm.title, cm.topic
ORDER BY cm.created_date DESC;
