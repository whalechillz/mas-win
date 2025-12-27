-- products 테이블 확장: 드라이버 제품 및 이미지 타입별 관리 지원

-- 제품 타입 구분
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'goods';
COMMENT ON COLUMN products.product_type IS '제품 타입: goods(굿즈), driver(드라이버), component(부품)';

-- 드라이버 제품 필드
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_left VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_right VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_left_color VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_right_color VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS border_color VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

COMMENT ON COLUMN products.slug IS '제품 URL 슬러그 (예: gold2-sapphire)';
COMMENT ON COLUMN products.subtitle IS '제품 부제목 (예: MUZIIK 협업 제품)';
COMMENT ON COLUMN products.badge_left IS '왼쪽 배지 (예: NEW, BEST)';
COMMENT ON COLUMN products.badge_right IS '오른쪽 배지 (예: LIMITED)';
COMMENT ON COLUMN products.features IS '제품 특징 배열 (JSON)';
COMMENT ON COLUMN products.display_order IS '메인 페이지 표시 순서';

-- 이미지 관리 (타입별 분리)
ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS composition_images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

COMMENT ON COLUMN products.detail_images IS '상세페이지용 이미지 URL 배열 (originals/products/{slug}/detail/)';
COMMENT ON COLUMN products.composition_images IS '합성용 참조 이미지 URL 배열 (originals/products/{slug}/composition/)';
COMMENT ON COLUMN products.gallery_images IS 'AI 합성 결과 이미지 URL 배열 (originals/products/{slug}/gallery/)';

-- PG 연동 필드 (추후 확장)
ALTER TABLE products ADD COLUMN IF NOT EXISTS pg_product_id VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS pg_price_id VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS payment_enabled BOOLEAN DEFAULT false;

COMMENT ON COLUMN products.pg_product_id IS 'PG(결제 게이트웨이) 제품 ID';
COMMENT ON COLUMN products.pg_price_id IS 'PG 가격 ID';
COMMENT ON COLUMN products.payment_enabled IS '결제 활성화 여부';

-- 재고 관리 확장 (추후 확장)
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock_level INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS auto_reorder BOOLEAN DEFAULT false;

COMMENT ON COLUMN products.min_stock_level IS '최소 재고 레벨';
COMMENT ON COLUMN products.max_stock_level IS '최대 재고 레벨';
COMMENT ON COLUMN products.auto_reorder IS '자동 재주문 활성화 여부';

-- slug에 대한 유니크 인덱스 (NULL 허용)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;

-- 제품 타입별 인덱스
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);

