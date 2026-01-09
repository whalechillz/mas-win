-- channel_sms 테이블에 message_category, message_subcategory 컬럼 추가

ALTER TABLE channel_sms 
ADD COLUMN IF NOT EXISTS message_category VARCHAR(50);

ALTER TABLE channel_sms 
ADD COLUMN IF NOT EXISTS message_subcategory VARCHAR(50);

-- 인덱스 추가 (카테고리별 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_channel_sms_message_category 
ON channel_sms(message_category) 
WHERE message_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_channel_sms_message_subcategory 
ON channel_sms(message_subcategory) 
WHERE message_subcategory IS NOT NULL;

-- 기존 데이터 업데이트 (booking 관련 메시지는 note 필드에서 판단)
-- 예약 관련 메시지는 note에 '예약' 또는 'booking'이 포함되어 있을 가능성이 높음
-- 하지만 정확한 판단이 어려우므로 NULL로 두고, 향후 새로 발송되는 메시지부터 카테고리 지정
