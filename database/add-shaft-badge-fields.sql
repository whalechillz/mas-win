-- product_composition 테이블에 샤프트 및 배지 이미지 필드 추가

-- 샤프트 이미지 URL
ALTER TABLE product_composition ADD COLUMN IF NOT EXISTS shaft_image_url TEXT;
COMMENT ON COLUMN product_composition.shaft_image_url IS '샤프트 이미지 URL (originals/products/{slug}/composition/shaft.webp)';

-- 배지 이미지 URL
ALTER TABLE product_composition ADD COLUMN IF NOT EXISTS badge_image_url TEXT;
COMMENT ON COLUMN product_composition.badge_image_url IS '배지 이미지 URL (originals/products/{slug}/composition/badge.webp)';

-- 샤프트 로고 이미지 URL (선택)
ALTER TABLE product_composition ADD COLUMN IF NOT EXISTS shaft_logo_image_url TEXT;
COMMENT ON COLUMN product_composition.shaft_logo_image_url IS '샤프트 로고 이미지 URL (originals/products/{slug}/composition/shaft-logo.webp)';

-- 인덱스 추가 (선택)
CREATE INDEX IF NOT EXISTS idx_product_composition_shaft_image ON product_composition(shaft_image_url) WHERE shaft_image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_composition_badge_image ON product_composition(badge_image_url) WHERE badge_image_url IS NOT NULL;
