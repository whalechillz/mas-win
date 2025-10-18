-- 콘텐츠 캘린더 완전 새로 시작 (깔끔한 방법)

-- 1단계: 기존 테이블 완전 삭제 (CASCADE로 의존성 모두 제거)
DROP TABLE IF EXISTS cc_content_calendar CASCADE;

-- 2단계: 새로운 허브 중심 테이블 생성
CREATE TABLE cc_content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar NOT NULL,
  summary text,
  content_body text,
  content_date date NOT NULL,
  
  -- 채널별 연결 ID
  blog_post_id integer,
  sms_id uuid,
  naver_blog_id uuid,
  kakao_id uuid,
  
  -- 채널별 상태 (JSONB)
  channel_status jsonb DEFAULT '{
    "blog": {"status": "미연결", "post_id": null, "created_at": null},
    "sms": {"status": "미발행", "post_id": null, "created_at": null},
    "naver_blog": {"status": "미발행", "post_id": null, "created_at": null},
    "kakao": {"status": "미발행", "post_id": null, "created_at": null}
  }'::jsonb,
  
  -- 허브 메타데이터
  is_hub_content boolean DEFAULT true,
  hub_priority integer DEFAULT 1,
  auto_derive_channels jsonb DEFAULT '["blog", "sms", "naver_blog", "kakao"]',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3단계: 인덱스 생성
CREATE INDEX idx_content_date ON cc_content_calendar(content_date);
CREATE INDEX idx_blog_post_id ON cc_content_calendar(blog_post_id);
CREATE INDEX idx_is_hub_content ON cc_content_calendar(is_hub_content);

-- 4단계: RLS (Row Level Security) 설정
ALTER TABLE cc_content_calendar ENABLE ROW LEVEL SECURITY;

-- 5단계: 정책 생성 (모든 사용자 접근 허용)
CREATE POLICY "Allow all operations on cc_content_calendar" ON cc_content_calendar
FOR ALL USING (true);

-- 6단계: 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cc_content_calendar' 
ORDER BY ordinal_position;
