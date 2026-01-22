-- customer_address_cache 테이블에 province 컬럼 추가
-- 도 단위 정보를 저장하여 지역별 메시지 커스텀에 활용

ALTER TABLE customer_address_cache 
ADD COLUMN IF NOT EXISTS province VARCHAR(20);

-- 인덱스 추가 (지역별 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_customer_address_cache_province 
ON customer_address_cache(province);

-- 주석 추가
COMMENT ON COLUMN customer_address_cache.province IS '도 단위 정보 (예: 충북, 경기, 경상, 전북 등). 지역별 메시지 커스텀에 활용';
