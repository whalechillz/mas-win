-- 고객 병합 기능을 위한 데이터베이스 스키마 확장
-- customers 테이블에 전화번호 이력 관리 컬럼 추가

-- 1. previous_phones 컬럼 추가 (이전 전화번호 배열)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS previous_phones TEXT[] DEFAULT '{}';

-- 2. is_merged 컬럼 추가 (병합된 고객 여부)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS is_merged BOOLEAN DEFAULT false;

-- 3. merged_to_customer_id 컬럼 추가 (병합 대상 고객 ID)
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS merged_to_customer_id INTEGER REFERENCES customers(id);

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_customers_is_merged ON customers(is_merged);
CREATE INDEX IF NOT EXISTS idx_customers_merged_to ON customers(merged_to_customer_id);

-- 5. 코멘트 추가
COMMENT ON COLUMN customers.previous_phones IS '이전 전화번호 목록 (배열)';
COMMENT ON COLUMN customers.is_merged IS '병합된 고객 여부';
COMMENT ON COLUMN customers.merged_to_customer_id IS '병합 대상 고객 ID (병합된 경우)';
