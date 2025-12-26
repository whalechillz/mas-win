-- inventory_transactions 테이블에 supplier_id 컬럼 추가
-- (테이블이 이미 존재하는 경우를 위한 마이그레이션 스크립트)

-- 1. supplier_id 컬럼이 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory_transactions' 
    AND column_name = 'supplier_id'
  ) THEN
    ALTER TABLE inventory_transactions 
    ADD COLUMN supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'supplier_id 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'supplier_id 컬럼이 이미 존재합니다.';
  END IF;
END $$;








