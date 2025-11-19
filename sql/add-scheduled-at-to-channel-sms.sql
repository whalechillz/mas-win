-- channel_sms 테이블에 scheduled_at 컬럼 추가

ALTER TABLE channel_sms 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP;

-- 인덱스 추가 (예약 발송 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_channel_sms_scheduled_at 
ON channel_sms(scheduled_at) 
WHERE scheduled_at IS NOT NULL;

