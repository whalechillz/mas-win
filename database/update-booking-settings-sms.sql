-- 예약 설정 테이블에 알림 설정 추가
-- 슬랙 알림, 스탭진 알림, 스탭진 전화번호 배열 추가

ALTER TABLE booking_settings
ADD COLUMN IF NOT EXISTS enable_slack_notification BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_staff_notification BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS staff_phone_numbers TEXT[] DEFAULT ARRAY['010-6669-9000', '010-5704-0013']::TEXT[];

-- 기존 설정 업데이트 (기본값 설정)
UPDATE booking_settings
SET 
  enable_slack_notification = COALESCE(enable_slack_notification, true),
  enable_staff_notification = COALESCE(enable_staff_notification, true),
  staff_phone_numbers = COALESCE(staff_phone_numbers, ARRAY['010-6669-9000', '010-5704-0013']::TEXT[])
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 설정이 없는 경우 기본 레코드 생성
INSERT INTO booking_settings (
  id,
  enable_slack_notification,
  enable_staff_notification,
  staff_phone_numbers
)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  true,
  true,
  ARRAY['010-6669-9000', '010-5704-0013']::TEXT[]
WHERE NOT EXISTS (
  SELECT 1 FROM booking_settings WHERE id = '00000000-0000-0000-0000-000000000001'
);

