-- 마이그레이션 결과 확인 쿼리

-- ============================================
-- 1. 김종철 선물 출고일 확인 (2025-12-21로 변경되었는지)
-- ============================================
SELECT 
  '김종철 선물 출고일 확인' as check_type,
  c.name as customer_name,
  cg.delivery_date,
  it.tx_date as outbound_date,
  p.name as product_name,
  CASE 
    WHEN cg.delivery_date = '2025-12-21' AND it.tx_date = '2025-12-21' THEN '✅ 완료'
    ELSE '❌ 미완료'
  END as status
FROM customer_gifts cg
JOIN customers c ON cg.customer_id = c.id
LEFT JOIN inventory_transactions it ON it.related_gift_id = cg.id AND it.tx_type = 'outbound'
LEFT JOIN products p ON cg.product_id = p.id
WHERE c.name = '김종철'
  AND cg.delivery_status = 'sent';

-- ============================================
-- 2. 입고일 업데이트 확인 (2025-12-10으로 변경되었는지)
-- ============================================
SELECT 
  '입고일 업데이트 확인' as check_type,
  p.name as product_name,
  it.tx_type,
  it.quantity,
  it.tx_date,
  CASE 
    WHEN it.tx_date = '2025-12-10' THEN '✅ 완료'
    ELSE '❌ 미완료'
  END as status
FROM inventory_transactions it
JOIN products p ON it.product_id = p.id
WHERE it.tx_type = 'inbound'
  AND (
    (p.name LIKE '%프리미엄 클러치백%' AND it.quantity IN (1, 2)) OR
    (p.name LIKE '%콜라보 티셔츠(화이트)%' AND it.quantity = 2) OR
    (p.name LIKE '%콜라보 골프모자 (화이트)%' AND it.quantity = 5) OR
    (p.name LIKE '%콜라보 골프모자 (블랙)%' AND it.quantity = 5) OR
    (p.name LIKE '%콜라보 골프모자 (베이지)%' AND it.quantity = 5) OR
    (p.name LIKE '%콜라보 골프모자 (네이비)%' AND it.quantity = 5) OR
    (p.name LIKE '%스타일리시 버킷햇(화이트)%' AND it.quantity = 5) OR
    (p.name LIKE '%스타일리시 버킷햇(블랙)%' AND it.quantity = 5)
  )
ORDER BY p.name, it.id DESC;

-- ============================================
-- 3. 선물 지급 완료된 고객 및 재고 차감 확인
-- ============================================
SELECT 
  '선물 지급 및 재고 차감 확인' as check_type,
  c.name as customer_name,
  cg.delivery_date,
  cg.delivery_status,
  p.name as product_name,
  it.id as transaction_id,
  it.tx_date as outbound_date,
  CASE 
    WHEN cg.delivery_status = 'sent' AND it.id IS NOT NULL THEN '✅ 완료'
    WHEN cg.delivery_status = 'sent' AND it.id IS NULL THEN '⚠️ 선물 지급은 있지만 재고 차감 없음'
    ELSE '❌ 미완료'
  END as status
FROM customer_gifts cg
JOIN customers c ON cg.customer_id = c.id
LEFT JOIN products p ON cg.product_id = p.id
LEFT JOIN inventory_transactions it ON it.related_gift_id = cg.id AND it.tx_type = 'outbound'
WHERE cg.delivery_status = 'sent'
  AND cg.delivery_date >= '2025-12-18'
ORDER BY cg.delivery_date DESC;

-- ============================================
-- 4. 설문에 선물 지급 완료 체크 확인
-- ============================================
SELECT 
  '설문 선물 지급 완료 체크 확인' as check_type,
  s.name,
  s.phone,
  s.gift_delivered,
  cg.delivery_date,
  p.name as product_name,
  CASE 
    WHEN s.gift_delivered = true THEN '✅ 완료'
    ELSE '❌ 미완료'
  END as status
FROM surveys s
JOIN customer_gifts cg ON cg.survey_id = s.id
LEFT JOIN products p ON cg.product_id = p.id
WHERE cg.delivery_status = 'sent'
  AND cg.delivery_date >= '2025-12-18'
ORDER BY cg.delivery_date DESC;

-- ============================================
-- 5. 전체 요약
-- ============================================
SELECT 
  '전체 요약' as check_type,
  COUNT(DISTINCT cg.id) FILTER (WHERE cg.delivery_status = 'sent' AND cg.delivery_date >= '2025-12-18') as total_gifts,
  COUNT(DISTINCT it.id) FILTER (WHERE it.tx_type = 'outbound' AND it.tx_date >= '2025-12-18') as total_outbound,
  COUNT(DISTINCT s.id) FILTER (WHERE s.gift_delivered = true) as total_surveys_checked,
  COUNT(DISTINCT it2.id) FILTER (WHERE it2.tx_type = 'inbound' AND it2.tx_date = '2025-12-10') as total_inbound_updated
FROM customer_gifts cg
LEFT JOIN inventory_transactions it ON it.related_gift_id = cg.id AND it.tx_type = 'outbound'
LEFT JOIN surveys s ON s.id = cg.survey_id
LEFT JOIN inventory_transactions it2 ON it2.tx_type = 'inbound';

