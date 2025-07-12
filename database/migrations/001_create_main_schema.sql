-- 메인 사이트용 스키마 생성
CREATE SCHEMA IF NOT EXISTS main;

-- 제품 테이블
CREATE TABLE IF NOT EXISTS main.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    price INTEGER,
    description TEXT,
    features JSONB,
    images JSONB,
    specifications JSONB,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 문의 테이블
CREATE TABLE IF NOT EXISTS main.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    product_id UUID REFERENCES main.products(id),
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 뉴스/공지사항 테이블
CREATE TABLE IF NOT EXISTS main.news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    thumbnail VARCHAR(500),
    category VARCHAR(50),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- RLS 정책 설정
ALTER TABLE main.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE main.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE main.news ENABLE ROW LEVEL SECURITY;

-- 제품 읽기 권한 (모두)
CREATE POLICY "Products are viewable by everyone" 
ON main.products FOR SELECT 
USING (is_active = true);

-- 문의 작성 권한 (모두)
CREATE POLICY "Anyone can create inquiries" 
ON main.inquiries FOR INSERT 
WITH CHECK (true);

-- 뉴스 읽기 권한 (발행된 것만)
CREATE POLICY "Published news are viewable by everyone" 
ON main.news FOR SELECT 
USING (is_published = true);

-- 인덱스 생성
CREATE INDEX idx_products_slug ON main.products(slug);
CREATE INDEX idx_products_category ON main.products(category);
CREATE INDEX idx_news_slug ON main.news(slug);
CREATE INDEX idx_news_published ON main.news(is_published, published_at);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION main.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON main.products
FOR EACH ROW EXECUTE FUNCTION main.update_updated_at();

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON main.inquiries
FOR EACH ROW EXECUTE FUNCTION main.update_updated_at();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON main.news
FOR EACH ROW EXECUTE FUNCTION main.update_updated_at();

-- 샘플 데이터 (선택사항)
INSERT INTO main.products (name, slug, category, price, description, features) VALUES
('MASGOLF Driver X1', 'driver-x1', 'driver', 890000, 
 '최첨단 기술이 적용된 프리미엄 드라이버', 
 '["460cc 티타늄 헤드", "조절 가능한 웨이트", "프리미엄 샤프트"]'::jsonb),
('MASGOLF Iron Set Pro', 'iron-set-pro', 'iron', 1290000,
 '정밀한 컨트롤을 위한 프로 아이언 세트',
 '["단조 공법", "프로그레시브 오프셋", "투어 검증"]'::jsonb);
