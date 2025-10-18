-- 허브 중심 콘텐츠 캘린더 마이그레이션

-- 1단계: 데이터 백업
CREATE TABLE IF NOT EXISTS cc_content_calendar_backup AS 
SELECT * FROM cc_content_calendar;

-- 2단계: 불필요한 컬럼 제거 (content_type만)
ALTER TABLE cc_content_calendar DROP COLUMN IF EXISTS content_type;

-- 3단계: 채널별 연결 ID 컬럼 추가 (없는 경우)
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS sms_id uuid;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS naver_blog_id uuid;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS kakao_id uuid;

-- 4단계: 채널별 상태 JSONB 컬럼 추가
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS channel_status jsonb DEFAULT '{}';

-- 5단계: 허브 메타데이터 컬럼 추가
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS is_hub_content boolean DEFAULT true;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS hub_priority integer DEFAULT 1;
ALTER TABLE cc_content_calendar ADD COLUMN IF NOT EXISTS auto_derive_channels jsonb DEFAULT '["blog", "sms", "naver_blog", "kakao"]';

-- 6단계: 채널별 상태 초기화
UPDATE cc_content_calendar 
SET channel_status = jsonb_build_object(
  'blog', jsonb_build_object(
    'status', CASE WHEN blog_post_id IS NOT NULL THEN '연결됨' ELSE '미연결' END,
    'post_id', blog_post_id,
    'created_at', CASE WHEN blog_post_id IS NOT NULL THEN created_at::text ELSE null END
  ),
  'sms', jsonb_build_object(
    'status', CASE WHEN sms_id IS NOT NULL THEN '연결됨' ELSE '미발행' END,
    'post_id', sms_id,
    'created_at', CASE WHEN sms_id IS NOT NULL THEN created_at::text ELSE null END
  ),
  'naver_blog', jsonb_build_object(
    'status', CASE WHEN naver_blog_id IS NOT NULL THEN '연결됨' ELSE '미발행' END,
    'post_id', naver_blog_id,
    'created_at', CASE WHEN naver_blog_id IS NOT NULL THEN created_at::text ELSE null END
  ),
  'kakao', jsonb_build_object(
    'status', CASE WHEN kakao_id IS NOT NULL THEN '연결됨' ELSE '미발행' END,
    'post_id', kakao_id,
    'created_at', CASE WHEN kakao_id IS NOT NULL THEN created_at::text ELSE null END
  )
);

-- 7단계: 최종 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cc_content_calendar' 
ORDER BY ordinal_position;

-- 8단계: 샘플 데이터 확인
SELECT 
  id,
  title,
  channel_status,
  blog_post_id,
  sms_id,
  naver_blog_id,
  kakao_id
FROM cc_content_calendar 
LIMIT 5;
