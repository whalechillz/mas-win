-- products 테이블 확장: 제품 페이지 개선을 위한 필드 추가
-- 시크리트웨폰 블랙 MUZIIK 제품 페이지 개선 계획서 기반

-- 이미지 타입별 관리 (신규)
ALTER TABLE products ADD COLUMN IF NOT EXISTS hero_images JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS hook_images JSONB DEFAULT '[]';

-- 이미지별 텍스트 콘텐츠 관리 (신규)
ALTER TABLE products ADD COLUMN IF NOT EXISTS hook_content JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS detail_content JSONB DEFAULT '[]';

-- 필드 설명 추가
COMMENT ON COLUMN products.hero_images IS '상단 슬라이더용 이미지 경로 배열 (hero/ 폴더)';
COMMENT ON COLUMN products.hook_images IS '후킹 이미지 경로 배열 (hook/ 폴더)';
COMMENT ON COLUMN products.hook_content IS '후킹 이미지별 제목/설명 (JSON 배열) - [{image, title, description}, ...]';
COMMENT ON COLUMN products.detail_content IS '상세 이미지별 제목/설명 (JSON 배열) - [{image, title, description}, ...]';

-- 인덱스 생성 (선택사항, 성능 향상)
CREATE INDEX IF NOT EXISTS idx_products_hero_images ON products USING GIN (hero_images);
CREATE INDEX IF NOT EXISTS idx_products_hook_images ON products USING GIN (hook_images);
CREATE INDEX IF NOT EXISTS idx_products_hook_content ON products USING GIN (hook_content);
CREATE INDEX IF NOT EXISTS idx_products_detail_content ON products USING GIN (detail_content);
