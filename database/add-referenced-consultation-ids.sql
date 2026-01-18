-- ==========================================
-- customer_consultations 테이블에 참조 필드 추가
-- ==========================================

-- 참조한 기존 글 목록 ID 배열 필드 추가
ALTER TABLE customer_consultations
ADD COLUMN IF NOT EXISTS referenced_consultation_ids INTEGER[];

-- 코멘트 추가
COMMENT ON COLUMN customer_consultations.referenced_consultation_ids IS '참조한 기존 글 목록 ID 배열';
