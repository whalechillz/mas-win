-- 현재 데이터를 허브 중심으로 변환 (안전한 방법)

-- 1단계: 데이터 백업 (안전장치)
CREATE TABLE IF NOT EXISTS cc_content_calendar_backup AS 
SELECT * FROM cc_content_calendar;

-- 2단계: 불필요한 컬럼만 제거
ALTER TABLE cc_content_calendar DROP COLUMN IF EXISTS content_type;

-- 3단계: 채널별 연결 ID 컬럼 추가
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS sms_id uuid;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS naver_blog_id uuid;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS kakao_id uuid;

-- 4단계: 채널별 상태 JSONB 컬럼 추가
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS channel_status jsonb DEFAULT '{}';

-- 5단계: 허브 메타데이터 컬럼 추가
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS is_hub_content boolean DEFAULT true;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS hub_priority integer DEFAULT 1;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS auto_derive_channels jsonb DEFAULT '["blog", "sms", "naver_blog", "kakao"]';

-- 6단계: 채널별 상태 초기화 (기존 blog_post_id 연결 유지)
UPDATE cc_content_calendar 
SET channel_status = jsonb_build_object(
  'blog', jsonb_build_object(
    'status', '연결됨',
    'post_id', blog_post_id,
    'created_at', created_at::text
  ),
  'sms', jsonb_build_object(
    'status', '미발행',
    'post_id', null,
    'created_at', null
  ),
  'naver_blog', jsonb_build_object(
    'status', '미발행',
    'post_id', null,
    'created_at', null
  ),
  'kakao', jsonb_build_object(
    'status', '미발행',
    'post_id', null,
    'created_at', null
  )
);

-- 7단계: 결과 확인
SELECT 
  id,
  title,
  blog_post_id,
  channel_status->'blog'->>'status' as blog_status,
  channel_status->'sms'->>'status' as sms_status,
  channel_status->'naver_blog'->>'status' as naver_status,
  channel_status->'kakao'->>'status' as kakao_status
FROM cc_content_calendar 
LIMIT 5;
