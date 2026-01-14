-- 이미지 삭제 개선: CASCADE 삭제 및 트리거 설정
-- Phase 4: 데이터베이스 구조 개선

-- ============================================
-- 영향도 분석
-- ============================================
-- 1. 현재 구조:
--    - image_assets: id (UUID), cdn_url, file_path, filename, original_filename
--    - image_metadata: id (SERIAL), image_url (UNIQUE) - file_name 컬럼 없음
--    - 두 테이블은 외래 키 관계가 없음 (URL 기반 연결)
--
-- 2. 영향받는 프로그램:
--    - pages/api/admin/image-asset-manager.js (삭제 로직)
--    - pages/api/admin/all-images.js (조회 로직)
--    - pages/api/admin/image-metadata.js (메타데이터 관리)
--    - pages/api/admin/generate-metadata-for-folder.js (메타데이터 생성)
--    - pages/api/admin/image-metadata-batch.js (배치 메타데이터)
--    - pages/api/kakao-content/calendar-save.js (이미지 사용 추적)
--    - pages/api/compose-product-image.js (AI 이미지 생성)
--
-- 3. 개선 방안:
--    A안: 외래 키 추가 (위험도 높음 - 기존 데이터 구조 변경)
--    B안: 트리거 사용 (위험도 낮음 - 기존 구조 유지)
--    C안: 애플리케이션 레벨 처리 (현재 방식 - 복잡하지만 안전)
--
-- ============================================
-- 권장 방안: B안 (트리거 사용)
-- ============================================
-- 장점:
-- - 기존 데이터 구조 변경 없음
-- - 외래 키 제약 없이 자동 삭제 가능
-- - 기존 프로그램 영향 최소화
-- 단점:
-- - 트리거 유지보수 필요
-- - URL 매칭 정확도에 의존

-- ============================================
-- 1. image_metadata에 image_assets_id 컬럼 추가 (선택사항)
-- ============================================
-- 이 컬럼을 추가하면 더 정확한 매칭이 가능하지만,
-- 기존 데이터 마이그레이션이 필요합니다.
-- 
-- ALTER TABLE image_metadata
-- ADD COLUMN IF NOT EXISTS image_assets_id UUID REFERENCES image_assets(id) ON DELETE CASCADE;
--
-- CREATE INDEX IF NOT EXISTS idx_image_metadata_assets_id 
-- ON image_metadata(image_assets_id);
--
-- -- 기존 데이터 마이그레이션 (cdn_url과 image_url 매칭)
-- UPDATE image_metadata im
-- SET image_assets_id = ia.id
-- FROM image_assets ia
-- WHERE im.image_url = ia.cdn_url
--   AND im.image_assets_id IS NULL;

-- ============================================
-- 2. 트리거 함수: image_assets 삭제 시 image_metadata 자동 삭제
-- ============================================
-- ✅ 수정 완료: file_name 컬럼 제거 (image_metadata 테이블에는 file_name 컬럼이 없음)
CREATE OR REPLACE FUNCTION delete_image_metadata_on_asset_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- OLD.cdn_url과 일치하는 image_metadata 삭제
  DELETE FROM image_metadata
  WHERE image_url = OLD.cdn_url;
  
  -- ✅ file_name 컬럼이 없으므로 image_url만 사용
  -- image_metadata 테이블은 image_url만 사용하여 삭제
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_delete_image_metadata_on_asset_delete ON image_assets;
CREATE TRIGGER trigger_delete_image_metadata_on_asset_delete
  AFTER DELETE ON image_assets
  FOR EACH ROW
  EXECUTE FUNCTION delete_image_metadata_on_asset_delete();

-- ============================================
-- 3. 트리거 함수: image_metadata 삭제 시 관련 데이터 정리 (선택사항)
-- ============================================
-- image_tag_relations는 이미 ON DELETE CASCADE로 설정되어 있음
-- (supabase-setup.sql 참조)

-- ============================================
-- 4. 검증 쿼리
-- ============================================
-- 트리거가 제대로 작동하는지 확인:
-- 
-- ✅ 수정 완료: original_filename 추가, file_name 제거
-- -- 테스트 이미지 생성
-- INSERT INTO image_assets (filename, original_filename, file_path, cdn_url, file_size, mime_type, format)
-- VALUES ('test-trigger.png', 'test-trigger.png', 'test/test-trigger.png', 'https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/test/test-trigger.png', 1000, 'image/png', 'png')
-- RETURNING id, cdn_url;
--
-- -- image_metadata에 삽입 (file_name 없이, image_url만 사용)
-- INSERT INTO image_metadata (image_url, title)
-- VALUES ('https://yyytjudftvpmcnppaymw.supabase.co/storage/v1/object/public/blog-images/test/test-trigger.png', 'Test Image');
--
-- -- 삭제 테스트 (트리거 작동 확인)
-- DELETE FROM image_assets WHERE filename = 'test-trigger.png';
--
-- -- image_metadata도 자동 삭제되었는지 확인
-- SELECT * FROM image_metadata WHERE image_url LIKE '%test-trigger%';
-- -- 결과가 없어야 함

-- ============================================
-- 5. 롤백 쿼리 (필요시)
-- ============================================
-- DROP TRIGGER IF EXISTS trigger_delete_image_metadata_on_asset_delete ON image_assets;
-- DROP FUNCTION IF EXISTS delete_image_metadata_on_asset_delete();

-- ============================================
-- 주의사항
-- ============================================
-- 1. 이 트리거는 image_assets 삭제 시에만 작동합니다.
-- 2. Storage에서 직접 삭제된 파일은 트리거가 작동하지 않으므로,
--    애플리케이션 레벨에서 image_metadata 삭제를 계속 처리해야 합니다.
-- 3. ✅ 수정 완료: image_metadata 테이블에는 file_name 컬럼이 없으므로 image_url만 사용합니다.
-- 4. 대량 삭제 시 성능에 영향을 줄 수 있으므로, 인덱스가 제대로 설정되어 있는지 확인하세요.
