-- 솔라피 이미지 ID 캐싱을 위한 필드 추가

ALTER TABLE booking_settings
ADD COLUMN IF NOT EXISTS booking_logo_solapi_image_id VARCHAR(255);

COMMENT ON COLUMN booking_settings.booking_logo_solapi_image_id IS '예약 확정 메시지용 로고의 솔라피 이미지 ID (캐시용)';

