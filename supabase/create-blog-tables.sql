-- Create blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog tags table
CREATE TABLE IF NOT EXISTS blog_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image VARCHAR(500),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category_id INTEGER REFERENCES blog_categories(id),
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  view_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE
);

-- Create blog_post_tags junction table
CREATE TABLE IF NOT EXISTS blog_post_tags (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES blog_posts(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES blog_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, tag_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post_id ON blog_post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);

-- Insert default categories
INSERT INTO blog_categories (name, slug, description) VALUES
('골프', 'golf', '골프 관련 일반 정보'),
('고반발 드라이버', 'high-rebound-driver', '고반발 드라이버 관련 정보'),
('시니어 드라이버', 'senior-driver', '시니어 골퍼를 위한 드라이버 정보'),
('고객 후기', 'customer-review', '고객 후기 및 성공 사례'),
('이벤트', 'event', '이벤트 및 프로모션 정보'),
('튜토리얼', 'tutorial', '골프 기술 및 장비 사용법'),
('고객스토리', 'customer-story', '고객의 실제 경험담')
ON CONFLICT (slug) DO NOTHING;

-- Insert default tags
INSERT INTO blog_tags (name, slug) VALUES
('고반발드라이버', 'high-rebound-driver'),
('골프드라이버', 'golf-driver'),
('MASGOLF', 'masgolf'),
('비거리', 'distance'),
('시니어골퍼', 'senior-golfer'),
('골프레슨', 'golf-lesson'),
('드라이버추천', 'driver-recommendation'),
('골프장비', 'golf-equipment'),
('고객후기', 'customer-review'),
('이벤트', 'event')
ON CONFLICT (slug) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can view published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public can view blog categories" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Public can view blog tags" ON blog_tags
  FOR SELECT USING (true);

CREATE POLICY "Public can view blog post tags" ON blog_post_tags
  FOR SELECT USING (true);

-- Create policies for admin access (you'll need to set up proper authentication)
-- For now, we'll allow all operations for authenticated users
-- You should replace this with proper admin role checking
CREATE POLICY "Admin can manage blog posts" ON blog_posts
  FOR ALL USING (true);

CREATE POLICY "Admin can manage blog categories" ON blog_categories
  FOR ALL USING (true);

CREATE POLICY "Admin can manage blog tags" ON blog_tags
  FOR ALL USING (true);

CREATE POLICY "Admin can manage blog post tags" ON blog_post_tags
  FOR ALL USING (true);
