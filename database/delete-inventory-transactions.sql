-- ============================================
-- 삭제 전 확인 쿼리
-- ============================================
SELECT 
  it.id,
  it.tx_date,
  p.name as product_name,
  it.tx_type,
  it.quantity
FROM inventory_transactions it
JOIN products p ON it.product_id = p.id
WHERE it.tx_type = 'inbound'
  AND it.tx_date = '2026-01-02'
  AND (
    (p.name LIKE '%콜라보 골프모자 (블랙)%' AND it.quantity = 4) OR
    (p.name LIKE '%콜라보 골프모자 (베이지)%' AND it.quantity = 4) OR
    (p.name LIKE '%콜라보 골프모자 (네이비)%' AND it.quantity = 3) OR
    (p.name LIKE '%스타일리시 버킷햇(화이트)%' AND it.quantity = 2) OR
    (p.name LIKE '%스타일리시 버킷햇(블랙)%' AND it.quantity = 2)
  )
ORDER BY it.id DESC;

-- ============================================
-- 삭제 쿼리
-- ============================================
DELETE FROM inventory_transactions
WHERE id IN (
  SELECT it.id
  FROM inventory_transactions it
  JOIN products p ON it.product_id = p.id
  WHERE it.tx_type = 'inbound'
    AND it.tx_date = '2026-01-02'
    AND (
      (p.name LIKE '%콜라보 골프모자 (블랙)%' AND it.quantity = 4) OR
      (p.name LIKE '%콜라보 골프모자 (베이지)%' AND it.quantity = 4) OR
      (p.name LIKE '%콜라보 골프모자 (네이비)%' AND it.quantity = 3) OR
      (p.name LIKE '%스타일리시 버킷햇(화이트)%' AND it.quantity = 2) OR
      (p.name LIKE '%스타일리시 버킷햇(블랙)%' AND it.quantity = 2)
    )
);

-- ============================================
-- 삭제 후 확인
-- ============================================
SELECT 
  COUNT(*) as remaining_count
FROM inventory_transactions it
JOIN products p ON it.product_id = p.id
WHERE it.tx_type = 'inbound'
  AND it.tx_date = '2026-01-02'
  AND (
    (p.name LIKE '%콜라보 골프모자 (블랙)%' AND it.quantity = 4) OR
    (p.name LIKE '%콜라보 골프모자 (베이지)%' AND it.quantity = 4) OR
    (p.name LIKE '%콜라보 골프모자 (네이비)%' AND it.quantity = 3) OR
    (p.name LIKE '%스타일리시 버킷햇(화이트)%' AND it.quantity = 2) OR
    (p.name LIKE '%스타일리시 버킷햇(블랙)%' AND it.quantity = 2)
  );

