-- 마쓰구골프 블로그 데이터베이스 스키마

-- 블로그 게시물 테이블
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image VARCHAR(500),
  meta_title VARCHAR(255),
  meta_description TEXT,
  keywords TEXT[],
  category VARCHAR(100),
  tags TEXT[],
  author VARCHAR(100) DEFAULT '마쓰구골프',
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
);

-- 블로그 카테고리 테이블
CREATE TABLE IF NOT EXISTS blog_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 블로그 태그 테이블
CREATE TABLE IF NOT EXISTS blog_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 게시물-태그 연결 테이블 (다대다 관계)
CREATE TABLE IF NOT EXISTS blog_post_tags (
  post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX IF NOT EXISTS idx_blog_tags_slug ON blog_tags(slug);

-- 기본 카테고리 데이터 삽입
INSERT INTO blog_categories (name, slug, description) VALUES
('고반발 드라이버', 'high-rebound-driver', '고반발 드라이버 관련 게시물'),
('시니어 드라이버', 'senior-driver', '시니어 골퍼를 위한 드라이버 정보'),
('고객 후기', 'customer-review', '실제 고객 사용 후기'),
('이벤트', 'event', '특별 이벤트 및 혜택 정보'),
('골프 피팅', 'golf-fitting', '골프 피팅 서비스 관련'),
('기술 정보', 'tech-info', '골프 기술 및 장비 정보')
ON CONFLICT (slug) DO NOTHING;

-- 기본 태그 데이터 삽입
INSERT INTO blog_tags (name, slug) VALUES
('고반발 드라이버', 'high-rebound-driver'),
('시니어 드라이버', 'senior-driver'),
('골프 드라이버', 'golf-driver'),
('남성 드라이버', 'men-driver'),
('골프 피팅', 'golf-fitting'),
('비거리 향상', 'distance-improvement'),
('마쓰구골프', 'masgolf'),
('고객 후기', 'customer-review'),
('이벤트', 'event'),
('할인', 'discount'),
('특가', 'special-price'),
('프리미엄', 'premium'),
('맞춤 제작', 'custom-made'),
('전문 피팅', 'professional-fitting')
ON CONFLICT (slug) DO NOTHING;

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 뷰 생성 (자주 사용되는 쿼리 최적화)
CREATE OR REPLACE VIEW blog_posts_with_tags AS
SELECT 
    bp.*,
    array_agg(bt.name) as tag_names,
    array_agg(bt.slug) as tag_slugs
FROM blog_posts bp
LEFT JOIN blog_post_tags bpt ON bp.id = bpt.post_id
LEFT JOIN blog_tags bt ON bpt.tag_id = bt.id
WHERE bp.status = 'published'
GROUP BY bp.id;

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO blog_posts (
    title, 
    slug, 
    content, 
    excerpt, 
    featured_image, 
    meta_title, 
    meta_description, 
    keywords, 
    category, 
    tags, 
    published_at
) VALUES (
    '새해 특별 혜택! 프리미엄 골프 드라이버와 액세서리 단 30분께만 증정!',
    'special-benefit-premium-golf-driver-30-gift',
    '<h2>마쓰구골프 새해 특별 혜택</h2><p>체력 부담 없이 더 멀리 보내는 고반발 드라이버! 비거리 최대 30m 증가, 겨울 한정 특별 혜택으로 만나보세요.</p>',
    '마쓰구골프 고반발 드라이버로 비거리를 늘려보세요. 체력 부담 없이 더 멀리 보내는 고반발 드라이버!',
    '/images/blog/driver-winter-sale.jpg',
    '새해 특별 혜택! 프리미엄 골프 드라이버와 액세서리 단 30분께만 증정! | 마쓰구골프 고반발 드라이버 전문',
    '마쓰구골프 고반발 드라이버로 비거리를 늘려보세요. 체력 부담 없이 더 멀리 보내는 고반발 드라이버! 비거리 최대 30m 증가, 겨울 한정 특별 혜택으로 만나보세요. 전문 피팅과 맞춤 제작으로 골프 실력을 향상시키세요.',
    ARRAY['고반발 드라이버', '비거리 향상', '골프 드라이버', '남성 드라이버'],
    '이벤트',
    ARRAY['고반발 드라이버', '비거리 향상', '골프 드라이버', '남성 드라이버'],
    NOW()
) ON CONFLICT (slug) DO NOTHING;
