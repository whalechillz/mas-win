-- 멀티채널 콘텐츠 시스템을 위한 cc_content_calendar 테이블 스키마 업데이트
-- 단일 루트 + 다중 파생 구조 지원

-- 1. 멀티채널 관련 컬럼 추가
ALTER TABLE cc_content_calendar 
ADD COLUMN IF NOT EXISTS parent_content_id UUID,
ADD COLUMN IF NOT EXISTS target_audience_type VARCHAR(50) CHECK (target_audience_type IN ('existing_customer', 'new_customer')),
ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50) CHECK (channel_type IN ('blog', 'kakao', 'sms', 'naver_blog', 'naver_powerlink', 'naver_shopping', 'google_ads', 'instagram', 'facebook', 'twitter')),
ADD COLUMN IF NOT EXISTS is_root_content BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS derived_content_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS multichannel_status VARCHAR(20) DEFAULT 'pending' CHECK (multichannel_status IN ('pending', 'generating', 'completed', 'failed'));

-- 2. 네이버 블로그 멀티 계정 지원
ALTER TABLE cc_content_calendar 
ADD COLUMN IF NOT EXISTS naver_blog_account VARCHAR(50) CHECK (naver_blog_account IN ('account1', 'account2', 'account3')),
ADD COLUMN IF NOT EXISTS naver_blog_account_name VARCHAR(100);

-- 3. 이미지 관련 컬럼 추가
ALTER TABLE cc_content_calendar 
ADD COLUMN IF NOT EXISTS generated_images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS image_generation_status VARCHAR(20) DEFAULT 'pending' CHECK (image_generation_status IN ('pending', 'generating', 'completed', 'failed'));

-- 4. 랜딩페이지 전략 관련 컬럼
ALTER TABLE cc_content_calendar 
ADD COLUMN IF NOT EXISTS landing_page_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS landing_page_strategy JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS utm_parameters JSONB DEFAULT '{}';

-- 5. 성과 추적 관련 컬럼
ALTER TABLE cc_content_calendar 
ADD COLUMN IF NOT EXISTS performance_metrics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS conversion_goals JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT TRUE;

-- 6. 기존 데이터 업데이트
-- 루트 콘텐츠로 설정 (기존 데이터)
UPDATE cc_content_calendar 
SET 
  is_root_content = TRUE,
  target_audience_type = 'new_customer',
  channel_type = 'blog',
  multichannel_status = 'completed'
WHERE parent_content_id IS NULL;

-- 7. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_parent_id ON cc_content_calendar(parent_content_id);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_target_audience ON cc_content_calendar(target_audience_type);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_channel_type ON cc_content_calendar(channel_type);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_is_root ON cc_content_calendar(is_root_content);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_multichannel_status ON cc_content_calendar(multichannel_status);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_naver_account ON cc_content_calendar(naver_blog_account);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_generated_images ON cc_content_calendar USING gin(generated_images);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_landing_strategy ON cc_content_calendar USING gin(landing_page_strategy);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_utm_params ON cc_content_calendar USING gin(utm_parameters);
CREATE INDEX IF NOT EXISTS idx_cc_content_calendar_performance ON cc_content_calendar USING gin(performance_metrics);

-- 8. 외래키 제약조건 (자기 참조)
ALTER TABLE cc_content_calendar 
ADD CONSTRAINT fk_cc_content_calendar_parent 
FOREIGN KEY (parent_content_id) REFERENCES cc_content_calendar(id) ON DELETE CASCADE;

-- 9. 트리 구조 관리를 위한 함수
CREATE OR REPLACE FUNCTION update_derived_content_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 부모 콘텐츠의 파생 콘텐츠 수 업데이트
  IF NEW.parent_content_id IS NOT NULL THEN
    UPDATE cc_content_calendar 
    SET derived_content_count = (
      SELECT COUNT(*) 
      FROM cc_content_calendar 
      WHERE parent_content_id = NEW.parent_content_id
    )
    WHERE id = NEW.parent_content_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_derived_count ON cc_content_calendar;
CREATE TRIGGER trigger_update_derived_count
  AFTER INSERT OR UPDATE OR DELETE ON cc_content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_derived_content_count();

-- 11. 루트 콘텐츠 조회 함수
CREATE OR REPLACE FUNCTION get_root_content_with_derivatives(root_id UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  content_type VARCHAR(20),
  target_audience_type VARCHAR(50),
  channel_type VARCHAR(50),
  status VARCHAR(20),
  is_root BOOLEAN,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE content_tree AS (
    -- 루트 콘텐츠
    SELECT 
      c.id,
      c.title,
      c.content_type,
      c.target_audience_type,
      c.channel_type,
      c.status,
      c.is_root_content,
      0 as level
    FROM cc_content_calendar c
    WHERE c.id = root_id
    
    UNION ALL
    
    -- 파생 콘텐츠들
    SELECT 
      c.id,
      c.title,
      c.content_type,
      c.target_audience_type,
      c.channel_type,
      c.status,
      c.is_root_content,
      ct.level + 1
    FROM cc_content_calendar c
    JOIN content_tree ct ON c.parent_content_id = ct.id
  )
  SELECT * FROM content_tree
  ORDER BY level, created_at;
END;
$$ LANGUAGE plpgsql;

-- 12. 멀티채널 콘텐츠 생성 함수
CREATE OR REPLACE FUNCTION create_multichannel_content(
  p_parent_id UUID,
  p_target_audience VARCHAR(50),
  p_channels TEXT[],
  p_title_template VARCHAR(500),
  p_content_template TEXT
)
RETURNS UUID[] AS $$
DECLARE
  created_ids UUID[] := '{}';
  channel_name TEXT;
  new_id UUID;
  channel_counter INTEGER := 1;
BEGIN
  -- 각 채널별로 파생 콘텐츠 생성
  FOREACH channel_name IN ARRAY p_channels
  LOOP
    INSERT INTO cc_content_calendar (
      parent_content_id,
      target_audience_type,
      channel_type,
      title,
      content_body,
      content_type,
      status,
      is_root_content,
      multichannel_status,
      created_at,
      updated_at
    ) VALUES (
      p_parent_id,
      p_target_audience,
      channel_name,
      p_title_template || ' (' || channel_name || ')',
      p_content_template,
      'multichannel',
      'draft',
      FALSE,
      'generating',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    ) RETURNING id INTO new_id;
    
    created_ids := array_append(created_ids, new_id);
    channel_counter := channel_counter + 1;
  END LOOP;
  
  -- 부모 콘텐츠의 멀티채널 상태 업데이트
  UPDATE cc_content_calendar 
  SET 
    multichannel_status = 'completed',
    derived_content_count = array_length(created_ids, 1),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_parent_id;
  
  RETURN created_ids;
END;
$$ LANGUAGE plpgsql;

-- 13. 성과 메트릭 업데이트 함수
CREATE OR REPLACE FUNCTION update_performance_metrics(
  p_content_id UUID,
  p_metric_name VARCHAR(100),
  p_metric_value NUMERIC,
  p_metric_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
  current_metrics JSONB;
BEGIN
  -- 기존 메트릭 가져오기
  SELECT performance_metrics INTO current_metrics
  FROM cc_content_calendar
  WHERE id = p_content_id;
  
  -- 메트릭이 없으면 빈 객체로 초기화
  IF current_metrics IS NULL THEN
    current_metrics := '{}';
  END IF;
  
  -- 새 메트릭 추가/업데이트
  current_metrics := current_metrics || jsonb_build_object(
    p_metric_name, jsonb_build_object(
      'value', p_metric_value,
      'date', p_metric_date,
      'updated_at', CURRENT_TIMESTAMP
    )
  );
  
  -- 업데이트
  UPDATE cc_content_calendar
  SET 
    performance_metrics = current_metrics,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_content_id;
END;
$$ LANGUAGE plpgsql;

-- 14. 샘플 데이터 삽입 (테스트용)
INSERT INTO cc_content_calendar (
  title,
  content_type,
  target_audience_type,
  channel_type,
  is_root_content,
  multichannel_status,
  content_date,
  status,
  year,
  month
) VALUES (
  '테스트 루트 콘텐츠',
  'blog',
  'new_customer',
  'blog',
  TRUE,
  'completed',
  CURRENT_DATE,
  'published',
  EXTRACT(YEAR FROM CURRENT_DATE),
  EXTRACT(MONTH FROM CURRENT_DATE)
) ON CONFLICT DO NOTHING;

-- 15. 뷰 생성 (멀티채널 콘텐츠 조회용)
CREATE OR REPLACE VIEW multichannel_content_view AS
SELECT 
  c.id,
  c.title,
  c.content_type,
  c.target_audience_type,
  c.channel_type,
  c.status,
  c.is_root_content,
  c.parent_content_id,
  c.derived_content_count,
  c.multichannel_status,
  c.naver_blog_account,
  c.naver_blog_account_name,
  c.generated_images,
  c.image_generation_status,
  c.landing_page_url,
  c.landing_page_strategy,
  c.utm_parameters,
  c.performance_metrics,
  c.conversion_goals,
  c.tracking_enabled,
  c.content_date,
  c.created_at,
  c.updated_at,
  -- 부모 콘텐츠 정보
  p.title as parent_title,
  p.content_type as parent_content_type,
  -- 파생 콘텐츠 수
  (SELECT COUNT(*) FROM cc_content_calendar WHERE parent_content_id = c.id) as actual_derived_count
FROM cc_content_calendar c
LEFT JOIN cc_content_calendar p ON c.parent_content_id = p.id;

-- 16. 권한 설정
GRANT SELECT, INSERT, UPDATE, DELETE ON cc_content_calendar TO authenticated;
GRANT SELECT ON multichannel_content_view TO authenticated;
GRANT EXECUTE ON FUNCTION get_root_content_with_derivatives(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_multichannel_content(UUID, VARCHAR, TEXT[], VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_performance_metrics(UUID, VARCHAR, NUMERIC, DATE) TO authenticated;

-- 완료 메시지
SELECT '멀티채널 콘텐츠 시스템 스키마 업데이트 완료!' as message;
