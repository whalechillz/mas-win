-- 콘텐츠 캘린더 테이블에 누락된 필드들 추가
-- 기존 cc_content_calendar 테이블에 필요한 필드들을 추가

-- 1. 타겟 오디언스 정보가 없는 경우 기본값 추가
UPDATE cc_content_calendar 
SET target_audience = '{"persona": "시니어 골퍼", "stage": "awareness"}'::jsonb
WHERE target_audience IS NULL OR target_audience = '{}';

-- 2. 전환 추적 정보 추가 (새 컬럼)
ALTER TABLE cc_content_calendar 
ADD COLUMN IF NOT EXISTS conversion_tracking JSONB DEFAULT '{"goal": "홈페이지 방문", "landingPage": "https://win.masgolf.co.kr", "utmParams": {"source": "blog", "medium": "organic"}}';

-- 3. 기존 데이터에 전환 추적 정보 업데이트
UPDATE cc_content_calendar 
SET conversion_tracking = CASE 
  WHEN target_audience->>'stage' = 'consideration' THEN '{"goal": "상담 예약", "landingPage": "https://win.masgolf.co.kr/booking", "utmParams": {"source": "blog", "medium": "organic"}}'::jsonb
  WHEN target_audience->>'stage' = 'decision' THEN '{"goal": "구매 전환", "landingPage": "https://win.masgolf.co.kr/products", "utmParams": {"source": "blog", "medium": "organic"}}'::jsonb
  ELSE '{"goal": "홈페이지 방문", "landingPage": "https://win.masgolf.co.kr", "utmParams": {"source": "blog", "medium": "organic"}}'::jsonb
END
WHERE conversion_tracking IS NULL;

-- 4. 발행 채널 정보가 없는 경우 기본값 추가
UPDATE cc_content_calendar 
SET published_channels = '["blog", "naver_blog"]'::jsonb
WHERE published_channels IS NULL OR published_channels = '[]';

-- 5. SEO 메타 정보가 없는 경우 기본값 추가
UPDATE cc_content_calendar 
SET seo_meta = '{"description": "", "keywords": ""}'::jsonb
WHERE seo_meta IS NULL OR seo_meta = '{}';

-- 6. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_conversion_tracking ON cc_content_calendar USING gin(conversion_tracking);

-- 7. 샘플 데이터가 있다면 더 구체적인 정보로 업데이트
UPDATE cc_content_calendar 
SET 
  target_audience = CASE 
    WHEN title LIKE '%고객%' OR title LIKE '%후기%' THEN '{"persona": "중상급 골퍼", "stage": "consideration"}'::jsonb
    WHEN title LIKE '%구매%' OR title LIKE '%주문%' THEN '{"persona": "구매 의향 고객", "stage": "decision"}'::jsonb
    WHEN title LIKE '%비거리%' OR title LIKE '%드라이버%' THEN '{"persona": "시니어 골퍼", "stage": "awareness"}'::jsonb
    ELSE '{"persona": "시니어 골퍼", "stage": "awareness"}'::jsonb
  END,
  conversion_tracking = CASE 
    WHEN title LIKE '%고객%' OR title LIKE '%후기%' THEN '{"goal": "상담 예약", "landingPage": "https://win.masgolf.co.kr/booking", "utmParams": {"source": "blog", "medium": "organic", "campaign": "고객 후기"}}'::jsonb
    WHEN title LIKE '%구매%' OR title LIKE '%주문%' THEN '{"goal": "구매 전환", "landingPage": "https://win.masgolf.co.kr/products", "utmParams": {"source": "blog", "medium": "organic", "campaign": "제품 소개"}}'::jsonb
    WHEN title LIKE '%비거리%' OR title LIKE '%드라이버%' THEN '{"goal": "홈페이지 방문", "landingPage": "https://win.masgolf.co.kr", "utmParams": {"source": "blog", "medium": "organic", "campaign": "골프 정보"}}'::jsonb
    ELSE '{"goal": "홈페이지 방문", "landingPage": "https://win.masgolf.co.kr", "utmParams": {"source": "blog", "medium": "organic"}}'::jsonb
  END,
  published_channels = CASE 
    WHEN title LIKE '%고객%' OR title LIKE '%후기%' THEN '["blog", "kakao", "sms"]'::jsonb
    ELSE '["blog", "naver_blog"]'::jsonb
  END
WHERE id IS NOT NULL;
