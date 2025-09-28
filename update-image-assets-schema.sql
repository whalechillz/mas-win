-- image_assets 테이블에 다양한 크기 이미지 URL 컬럼 추가
ALTER TABLE public.image_assets 
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS medium_url TEXT,
ADD COLUMN IF NOT EXISTS webp_url TEXT,
ADD COLUMN IF NOT EXISTS webp_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_size INTEGER,
ADD COLUMN IF NOT EXISTS medium_size INTEGER,
ADD COLUMN IF NOT EXISTS webp_size INTEGER,
ADD COLUMN IF NOT EXISTS webp_thumbnail_size INTEGER;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_image_assets_thumbnail_url ON public.image_assets(thumbnail_url);
CREATE INDEX IF NOT EXISTS idx_image_assets_medium_url ON public.image_assets(medium_url);
CREATE INDEX IF NOT EXISTS idx_image_assets_webp_url ON public.image_assets(webp_url);

-- 코멘트 추가
COMMENT ON COLUMN public.image_assets.thumbnail_url IS '썸네일 이미지 URL (300x300)';
COMMENT ON COLUMN public.image_assets.medium_url IS '중간 크기 이미지 URL (800x600)';
COMMENT ON COLUMN public.image_assets.webp_url IS 'WebP 원본 이미지 URL';
COMMENT ON COLUMN public.image_assets.webp_thumbnail_url IS 'WebP 썸네일 이미지 URL (300x300)';
COMMENT ON COLUMN public.image_assets.thumbnail_size IS '썸네일 이미지 파일 크기 (bytes)';
COMMENT ON COLUMN public.image_assets.medium_size IS '중간 크기 이미지 파일 크기 (bytes)';
COMMENT ON COLUMN public.image_assets.webp_size IS 'WebP 원본 이미지 파일 크기 (bytes)';
COMMENT ON COLUMN public.image_assets.webp_thumbnail_size IS 'WebP 썸네일 이미지 파일 크기 (bytes)';
