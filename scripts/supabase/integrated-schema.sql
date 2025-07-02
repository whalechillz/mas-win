-- MASLABS 통합 데이터베이스 스키마
-- 캠페인, 블로그, 홈페이지 통합 관리

-- ==========================================
-- 1. 사용자 관리
-- ==========================================
CREATE TABLE users_profile (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user', -- admin, editor, user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. 캠페인 관리
-- ==========================================
-- 캠페인 마스터 테이블
CREATE TABLE campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users_profile(id)
);

-- 시타 예약 테이블 (기존)
CREATE TABLE bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    club VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending'
);

-- 문의 테이블 (기존)
CREATE TABLE contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    call_times TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contacted BOOLEAN DEFAULT FALSE,
    contacted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- 퀴즈 결과 저장
CREATE TABLE quiz_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id),
    style VARCHAR(50),
    priority VARCHAR(50),
    current_distance INTEGER,
    recommended_product VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- ==========================================
-- 3. 블로그 관리
-- ==========================================
-- 블로그 포스트
CREATE TABLE blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    featured_image TEXT,
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
    published_at TIMESTAMP WITH TIME ZONE,
    author_id UUID REFERENCES users_profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 블로그 카테고리
CREATE TABLE blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 블로그-카테고리 관계
CREATE TABLE blog_post_categories (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);

-- 블로그 태그
CREATE TABLE blog_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL
);

-- 블로그-태그 관계
CREATE TABLE blog_post_tags (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- ==========================================
-- 4. 홈페이지 컨텐츠 관리
-- ==========================================
-- 페이지 관리
CREATE TABLE pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content JSONB, -- 구조화된 컨텐츠
    meta_title VARCHAR(200),
    meta_description TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users_profile(id)
);

-- 메뉴 관리
CREATE TABLE menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(50), -- header, footer, sidebar
    items JSONB, -- 메뉴 구조
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 배너/슬라이더 관리
CREATE TABLE banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position VARCHAR(50), -- home-hero, sidebar, popup
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 5. 제품 관리
-- ==========================================
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    specifications JSONB,
    price DECIMAL(10,2),
    images JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 6. 미디어 관리
-- ==========================================
CREATE TABLE media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(50), -- image, video, document
    size INTEGER,
    metadata JSONB,
    uploaded_by UUID REFERENCES users_profile(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 7. 설정 관리
-- ==========================================
CREATE TABLE settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users_profile(id)
);

-- ==========================================
-- RLS (Row Level Security) 정책
-- ==========================================
-- 모든 테이블에 RLS 활성화
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (예약, 문의는 누구나 생성 가능)
CREATE POLICY "Public can insert bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert contacts" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can insert quiz results" ON quiz_results FOR INSERT WITH CHECK (true);

-- 인증된 사용자만 읽기
CREATE POLICY "Authenticated users can view all" ON bookings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON contacts FOR SELECT USING (auth.role() = 'authenticated');

-- 블로그는 공개 읽기, 관리자만 쓰기
CREATE POLICY "Public can read published posts" ON blog_posts 
    FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage posts" ON blog_posts 
    FOR ALL USING (auth.uid() IN (SELECT id FROM users_profile WHERE role = 'admin'));

-- ==========================================
-- 인덱스 생성
-- ==========================================
CREATE INDEX idx_campaigns_slug ON campaigns(slug);
CREATE INDEX idx_campaigns_active ON campaigns(is_active);
CREATE INDEX idx_bookings_campaign ON bookings(campaign_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_contacts_campaign ON contacts(campaign_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_products_slug ON products(slug);

-- ==========================================
-- 초기 데이터
-- ==========================================
-- 기본 카테고리
INSERT INTO blog_categories (name, slug, description) VALUES
('뉴스', 'news', 'MAS Golf 새로운 소식'),
('기술', 'technology', '골프 기술 및 제품 정보'),
('이벤트', 'events', '이벤트 및 프로모션');

-- 기본 설정
INSERT INTO settings (key, value, description) VALUES
('site_name', '"MAS Golf"', '사이트 이름'),
('contact_email', '"info@masgolf.com"', '연락처 이메일'),
('contact_phone', '"080-028-8888"', '연락처 전화번호');

-- 7월 캠페인 등록
INSERT INTO campaigns (name, slug, start_date, end_date) VALUES
('7월 썸머 스페셜', '2025-07-summer', '2025-07-01', '2025-07-31');