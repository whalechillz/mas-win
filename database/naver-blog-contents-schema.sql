-- 네이버 블로그 실제 관리를 위한 전용 테이블

-- 1. 네이버 블로그 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS naver_blog_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 계정 정보
    account VARCHAR(50) NOT NULL, -- mas9golf, massgoogolf, massgoogolfkorea
    author VARCHAR(10) NOT NULL,   -- J, S, 미, 조 등
    
    -- 포스트 정보
    publish_date DATE NOT NULL,
    title VARCHAR(500) NOT NULL,
    topic VARCHAR(500),           -- 글감/주제
    naver_url TEXT,              -- 네이버 블로그 URL
    
    -- 성과 추적
    view_count INTEGER DEFAULT 0,
    last_view_check TIMESTAMP,
    
    -- SEO 관련
    keywords TEXT[],             -- 키워드 배열
    
    -- 상태 관리
    status VARCHAR(50) DEFAULT 'published', -- draft, published
    
    -- 시스템 필드
    created_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX idx_naver_blog_account ON naver_blog_contents(account);
CREATE INDEX idx_naver_blog_publish_date ON naver_blog_contents(publish_date DESC);
CREATE INDEX idx_naver_blog_author ON naver_blog_contents(author);

-- 3. 기존 데이터 임포트 (샘플)
INSERT INTO naver_blog_contents (account, author, publish_date, title, topic, naver_url, view_count) VALUES
('mas9golf', 'J', '2025-05-30', '[사용자 리뷰] "드라이버는 진화한다" – 평택 중급 골퍼의 MASGOLF 골드2 시타 체험기', '박영구 후기', 'https://blog.naver.com/mas9golf/223883189153', 9),
('massgoogolf', 'S', '2025-05-30', '비거리 극대화 시니어 골퍼 고반발 드라이버 재구매 후기', '박영구 후기', 'https://blog.naver.com/massgoogolf/223883090973', 26),
('massgoogolfkorea', 'J', '2025-05-30', '[고객 스토리] MASGOLF 시타존에서 만난 평택 고객님의 특별한 드라이버 비교 체험기', '박영구 후기', 'https://blog.naver.com/massgoogolfkorea/223883142657', 3);

-- 4. 통계 뷰
CREATE OR REPLACE VIEW naver_blog_stats AS
SELECT 
    account,
    COUNT(*) as post_count,
    SUM(view_count) as total_views,
    AVG(view_count) as avg_views,
    MAX(publish_date) as last_post_date
FROM naver_blog_contents
GROUP BY account;

-- 5. 월별 통계 뷰
CREATE OR REPLACE VIEW naver_blog_monthly_stats AS
SELECT 
    DATE_TRUNC('month', publish_date) as month,
    account,
    author,
    COUNT(*) as post_count,
    SUM(view_count) as total_views
FROM naver_blog_contents
GROUP BY DATE_TRUNC('month', publish_date), account, author
ORDER BY month DESC, account;
