-- suppliers (공급업체) 테이블 생성
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  order_method VARCHAR(100),
  contact TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- expenses (지출) 테이블 생성
CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  expense_date DATE NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- inventory_transactions (재고 입출고 이력) 테이블 생성
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL,
  tx_type VARCHAR(50) NOT NULL, -- 'inbound', 'outbound', 'scrap', 'return', 'adjustment'
  quantity INTEGER NOT NULL, -- 입고는 +, 출고는 -, 폐기는 -, 반품은 +, 조정은 +/- 가능
  tx_date DATE DEFAULT CURRENT_DATE,
  note TEXT,
  supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(tx_date);

-- 코멘트 추가
COMMENT ON TABLE suppliers IS '공급업체 관리 (마플, 은성인쇄, GSI coffee, TDG사업자몰, 원투스포츠, 쿠팡, 로젠택배, KT, SKT, LGU+ 등)';
COMMENT ON TABLE expenses IS '월별 지출 내역 (임대료, 전기/공과금, 통신비, 소모품/비품, 택배비, 접대/음료, 마케팅/광고, 기타)';
COMMENT ON TABLE inventory_transactions IS '재고 입출고 이력 (입고/출고/폐기/반품/조정)';

