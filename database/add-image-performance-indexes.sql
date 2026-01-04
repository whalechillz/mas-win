-- 이미지 성능 최적화를 위한 데이터베이스 인덱스 추가
-- Phase 3: 고급 최적화

-- image_metadata 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_image_metadata_url ON image_metadata(image_url);
CREATE INDEX IF NOT EXISTS idx_image_metadata_usage_count ON image_metadata(usage_count);
CREATE INDEX IF NOT EXISTS idx_image_metadata_upload_source ON image_metadata(upload_source);
CREATE INDEX IF NOT EXISTS idx_image_metadata_status ON image_metadata(status);
CREATE INDEX IF NOT EXISTS idx_image_metadata_created_at ON image_metadata(created_at DESC);

-- image_assets 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_image_assets_cdn_url ON image_assets(cdn_url);
CREATE INDEX IF NOT EXISTS idx_image_assets_file_path ON image_assets(file_path);
CREATE INDEX IF NOT EXISTS idx_image_assets_status ON image_assets(status);

-- 복합 인덱스 (자주 함께 조회되는 컬럼)
CREATE INDEX IF NOT EXISTS idx_image_metadata_url_status ON image_metadata(image_url, status);
CREATE INDEX IF NOT EXISTS idx_image_assets_cdn_status ON image_assets(cdn_url, status);

-- 검색 최적화를 위한 인덱스 (TSVECTOR가 있는 경우)
-- 주의: search_vector 컬럼이 존재하는 경우에만 실행
-- CREATE INDEX IF NOT EXISTS idx_image_metadata_search_vector ON image_metadata USING GIN(search_vector);

-- 사용 현황 조회 최적화
CREATE INDEX IF NOT EXISTS idx_image_metadata_usage_count_status ON image_metadata(usage_count, status);

-- 폴더 경로 기반 조회 최적화 (file_path가 있는 경우)
CREATE INDEX IF NOT EXISTS idx_image_assets_file_path_status ON image_assets(file_path, status);

