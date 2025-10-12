-- 블로그 포스트 테이블에 누락된 필드들 추가
-- 콘텐츠 캘린더에서 필요한 필드들을 blog_posts 테이블에 추가

-- 1. 타겟 오디언스 정보 추가
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '{"persona": "시니어 골퍼", "stage": "awareness"}';

-- 2. 전환 추적 정보 추가
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS conversion_tracking JSONB DEFAULT '{"goal": "홈페이지 방문", "landingPage": "https://win.masgolf.co.kr", "utmParams": {"source": "blog", "medium": "organic"}}';

-- 3. 발행 채널 정보 추가
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS published_channels TEXT[] DEFAULT ARRAY['blog'];

-- 4. SEO 메타 정보 추가 (이미 있는 경우 무시)
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS seo_meta JSONB DEFAULT '{"description": "", "keywords": ""}';

-- 5. 콘텐츠 타입 명시적 추가
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'blog';

-- 6. 기존 데이터 업데이트
UPDATE blog_posts 
SET 
  target_audience = '{"persona": "시니어 골퍼", "stage": "awareness"}'::jsonb,
  conversion_tracking = '{"goal": "홈페이지 방문", "landingPage": "https://win.masgolf.co.kr", "utmParams": {"source": "blog", "medium": "organic"}}'::jsonb,
  published_channels = ARRAY['blog', 'naver_blog'],
  seo_meta = ('{"description": "' || COALESCE(meta_description, '') || '", "keywords": "' || COALESCE(meta_keywords, '') || '"}')::jsonb,
  content_type = 'blog'
WHERE target_audience IS NULL;

-- 7. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_blog_posts_target_audience ON blog_posts USING gin(target_audience);
CREATE INDEX IF NOT EXISTS idx_blog_posts_conversion_tracking ON blog_posts USING gin(conversion_tracking);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_channels ON blog_posts USING gin(published_channels);
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_type ON blog_posts(content_type);

-- 8. 기존 블로그 포스트에 샘플 데이터 업데이트 (실제 데이터가 있는 경우)
UPDATE blog_posts 
SET 
  target_audience = CASE 
    WHEN title LIKE '%고객%' OR title LIKE '%후기%' THEN '{"persona": "중상급 골퍼", "stage": "consideration"}'::jsonb
    WHEN title LIKE '%구매%' OR title LIKE '%주문%' THEN '{"persona": "구매 의향 고객", "stage": "decision"}'::jsonb
    ELSE '{"persona": "시니어 골퍼", "stage": "awareness"}'::jsonb
  END,
  conversion_tracking = CASE 
    WHEN title LIKE '%고객%' OR title LIKE '%후기%' THEN '{"goal": "상담 예약", "landingPage": "https://win.masgolf.co.kr/booking", "utmParams": {"source": "blog", "medium": "organic", "campaign": "고객 후기"}}'::jsonb
    WHEN title LIKE '%구매%' OR title LIKE '%주문%' THEN '{"goal": "구매 전환", "landingPage": "https://win.masgolf.co.kr/products", "utmParams": {"source": "blog", "medium": "organic", "campaign": "제품 소개"}}'::jsonb
    ELSE '{"goal": "홈페이지 방문", "landingPage": "https://win.masgolf.co.kr", "utmParams": {"source": "blog", "medium": "organic", "campaign": "골프 정보"}}'::jsonb
  END,
  published_channels = CASE 
    WHEN title LIKE '%고객%' OR title LIKE '%후기%' THEN ARRAY['blog', 'kakao', 'sms']
    ELSE ARRAY['blog', 'naver_blog']
  END
WHERE id IS NOT NULL;
