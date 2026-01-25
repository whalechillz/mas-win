-- products 테이블에 성능 데이터 이미지 필드 추가
-- 실제 성능 데이터 섹션에 사용할 이미지 배열

ALTER TABLE products ADD COLUMN IF NOT EXISTS performance_images JSONB DEFAULT '[]';

COMMENT ON COLUMN products.performance_images IS '실제 성능 데이터 섹션에 사용할 이미지 URL 배열 (originals/products/{slug}/gallery/)';

-- 인덱스는 필요시 추가 (현재는 배열 필드이므로 인덱스 불필요)
