-- ==========================================
-- customer_consultations 테이블에 후기 관련 필드 추가
-- ==========================================

-- 후기 관련 필드 추가
ALTER TABLE customer_consultations
ADD COLUMN IF NOT EXISTS review_type VARCHAR(50), -- 'kakao', 'phone', 'visit', 'blog'
ADD COLUMN IF NOT EXISTS review_images INTEGER[], -- image_metadata.id 배열
ADD COLUMN IF NOT EXISTS review_rating INTEGER CHECK (review_rating BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS is_blog_ready BOOLEAN DEFAULT false, -- 블로그 생성 준비 여부
ADD COLUMN IF NOT EXISTS generated_blog_id INTEGER REFERENCES blog_posts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS generated_hub_id UUID REFERENCES cc_content_calendar(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_consultations_review_type ON customer_consultations(review_type);
CREATE INDEX IF NOT EXISTS idx_consultations_blog_ready ON customer_consultations(is_blog_ready) WHERE is_blog_ready = true;
CREATE INDEX IF NOT EXISTS idx_consultations_generated_blog ON customer_consultations(generated_blog_id) WHERE generated_blog_id IS NOT NULL;

-- 코멘트 추가
COMMENT ON COLUMN customer_consultations.review_type IS '후기 유형 (kakao: 카카오톡, phone: 전화, visit: 방문, blog: 블로그)';
COMMENT ON COLUMN customer_consultations.review_images IS '연결된 이미지 ID 배열 (image_metadata.id)';
COMMENT ON COLUMN customer_consultations.review_rating IS '후기 평점 (1-5)';
COMMENT ON COLUMN customer_consultations.is_blog_ready IS '블로그 생성 준비 여부';
COMMENT ON COLUMN customer_consultations.generated_blog_id IS '생성된 블로그 포스트 ID';
COMMENT ON COLUMN customer_consultations.generated_hub_id IS '생성된 허브 콘텐츠 ID';

-- 고객별 후기 타임라인 뷰 생성
CREATE OR REPLACE VIEW v_customer_review_timeline AS
SELECT 
  cc.id,
  cc.customer_id,
  c.name as customer_name,
  cc.consultation_date,
  cc.consultation_type,
  cc.review_type,
  cc.topic,
  cc.content,
  cc.review_rating,
  cc.review_images,
  cc.is_blog_ready,
  cc.generated_blog_id,
  cc.generated_hub_id,
  array_length(cc.review_images, 1) as image_count,
  cc.created_at,
  cc.updated_at
FROM customer_consultations cc
JOIN customers c ON cc.customer_id = c.id
WHERE cc.consultation_type IN ('phone', 'visit', 'review')
  AND (cc.review_type IS NOT NULL OR cc.topic ILIKE '%후기%')
ORDER BY cc.consultation_date DESC;
