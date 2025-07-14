-- 통합 블로그 관리를 위한 실용적인 DB 구조

-- 1. 글감 풀 (모든 아이디어의 시작점)
CREATE TABLE content_ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 기본 정보
    title VARCHAR(255) NOT NULL,
    topic TEXT NOT NULL,
    target_keywords TEXT[], -- SEO 키워드
    
    -- 콘텐츠 상태
    status VARCHAR(50) DEFAULT 'idea', -- idea, writing, review, ready
    priority INTEGER DEFAULT 5, -- 1-10
    
    -- 작성자 정보
    created_by VARCHAR(100),
    assigned_to VARCHAR(100),
    
    -- 콘텐츠 본문 (마크다운 형식)
    content_markdown TEXT,
    
    -- 플랫폼별 발행 계획
    for_naver BOOLEAN DEFAULT false,
    for_website BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 네이버 발행 관리 (수동 프로세스 추적)
CREATE TABLE naver_publishing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_idea_id UUID REFERENCES content_ideas(id),
    
    -- 계정별 발행 상태
    mas9golf_status VARCHAR(50), -- planned, published, skipped
    mas9golf_url TEXT,
    mas9golf_published_at TIMESTAMP,
    
    massgoogolf_status VARCHAR(50),
    massgoogolf_url TEXT,
    massgoogolf_published_at TIMESTAMP,
    
    massgoogolfkorea_status VARCHAR(50),
    massgoogolfkorea_url TEXT,
    massgoogolfkorea_published_at TIMESTAMP,
    
    -- 네이버 최적화 콘텐츠
    naver_title VARCHAR(255), -- 감성적 제목
    naver_content TEXT, -- 네이버 스타일 본문
    naver_tags TEXT[], -- 네이버 태그
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 자사몰 발행 관리 (자동화)
CREATE TABLE website_publishing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_idea_id UUID REFERENCES content_ideas(id),
    
    -- SEO 최적화
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT[],
    canonical_url TEXT,
    
    -- 발행 정보
    slug VARCHAR(255) UNIQUE,
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, published
    
    -- 자동화 설정
    auto_publish BOOLEAN DEFAULT true,
    auto_generate_meta BOOLEAN DEFAULT true,
    auto_internal_links BOOLEAN DEFAULT true,
    
    -- 성과 추적 (자동)
    page_views INTEGER DEFAULT 0,
    avg_time_on_page FLOAT,
    bounce_rate FLOAT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. 통합 뷰 (한눈에 보는 발행 현황)
CREATE VIEW content_publishing_status AS
SELECT 
    ci.id,
    ci.title,
    ci.status as content_status,
    ci.created_at,
    
    -- 네이버 발행 현황
    CASE 
        WHEN np.id IS NOT NULL THEN 
            CASE 
                WHEN np.mas9golf_status = 'published' 
                 AND np.massgoogolf_status = 'published' 
                 AND np.massgoogolfkorea_status = 'published' 
                THEN '완료'
                WHEN np.mas9golf_status = 'published' 
                  OR np.massgoogolf_status = 'published' 
                  OR np.massgoogolfkorea_status = 'published' 
                THEN '진행중'
                ELSE '대기'
            END
        ELSE '미계획'
    END as naver_status,
    
    -- 자사몰 발행 현황
    COALESCE(wp.status, '미계획') as website_status,
    wp.scheduled_at,
    wp.published_at
    
FROM content_ideas ci
LEFT JOIN naver_publishing np ON ci.id = np.content_idea_id
LEFT JOIN website_publishing wp ON ci.id = wp.content_idea_id
ORDER BY ci.created_at DESC;

-- 5. 실용적인 함수들

-- 네이버 발행 체크리스트 생성
CREATE OR REPLACE FUNCTION create_naver_checklist(p_content_id UUID)
RETURNS TABLE (
    task TEXT,
    status BOOLEAN,
    details TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        '제목 최적화' as task,
        (np.naver_title IS NOT NULL) as status,
        '15-30자, 감성적 표현 포함' as details
    FROM content_ideas ci
    LEFT JOIN naver_publishing np ON ci.id = np.content_idea_id
    WHERE ci.id = p_content_id
    
    UNION ALL
    
    SELECT 
        '이미지 준비',
        false,
        '3-5장, 고화질, 텍스트 오버레이'
        
    UNION ALL
    
    SELECT 
        '태그 설정',
        (np.naver_tags IS NOT NULL AND array_length(np.naver_tags, 1) >= 5),
        '5-10개 권장'
    FROM content_ideas ci
    LEFT JOIN naver_publishing np ON ci.id = np.content_idea_id
    WHERE ci.id = p_content_id;
END;
$$ LANGUAGE plpgsql;

-- 자사몰 자동 발행 트리거
CREATE OR REPLACE FUNCTION auto_publish_website_content()
RETURNS void AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT * FROM website_publishing 
        WHERE status = 'scheduled' 
        AND scheduled_at <= NOW()
        AND auto_publish = true
    LOOP
        -- 여기서 실제 발행 로직 실행
        -- 1. SEO 메타 생성
        -- 2. 이미지 최적화
        -- 3. 내부 링크 생성
        -- 4. 발행
        
        UPDATE website_publishing 
        SET status = 'published', 
            published_at = NOW()
        WHERE id = rec.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
