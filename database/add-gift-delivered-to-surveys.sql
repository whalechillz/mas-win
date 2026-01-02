-- surveys 테이블에 선물 지급 완료 필드 추가
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS gift_delivered BOOLEAN DEFAULT false;

-- 코멘트 추가
COMMENT ON COLUMN surveys.gift_delivered IS '선물 지급 완료 여부 (당첨이 아닌 일반 선물 지급)';

