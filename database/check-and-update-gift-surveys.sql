-- 선물 지급 완료된 8명의 고객 및 설문 체크 확인 및 업데이트

-- ============================================
-- 1. 선물 지급 완료된 고객 목록 확인 (8명)
-- ============================================
SELECT 
  '선물 지급 완료 고객' as check_type,
  c.name as customer_name,
  c.phone,
  cg.delivery_date,
  cg.delivery_status,
  p.name as product_name,
  cg.survey_id,
  CASE 
    WHEN cg.survey_id IS NOT NULL THEN '✅ 설문 연결됨'
    ELSE '❌ 설문 연결 안됨'
  END as survey_status
FROM customer_gifts cg
JOIN customers c ON cg.customer_id = c.id
LEFT JOIN products p ON cg.product_id = p.id
WHERE cg.delivery_status = 'sent'
  AND cg.delivery_date >= '2025-12-18'
ORDER BY cg.delivery_date DESC;

-- ============================================
-- 2. 선물 지급 완료된 고객의 설문 체크 상태 확인
-- ============================================
SELECT 
  '설문 체크 상태' as check_type,
  s.name,
  s.phone,
  s.gift_delivered,
  cg.delivery_date,
  cg.delivery_status,
  p.name as product_name,
  CASE 
    WHEN s.gift_delivered = true THEN '✅ 체크됨'
    ELSE '❌ 체크 안됨'
  END as check_status
FROM surveys s
JOIN customer_gifts cg ON cg.survey_id = s.id
LEFT JOIN products p ON cg.product_id = p.id
WHERE cg.delivery_status = 'sent'
  AND cg.delivery_date >= '2025-12-18'
ORDER BY cg.delivery_date DESC;

-- ============================================
-- 3. 선물 지급은 되었지만 설문에 연결되지 않은 경우 확인
-- ============================================
SELECT 
  '설문 미연결' as check_type,
  c.name,
  c.phone,
  cg.delivery_date,
  p.name as product_name,
  '설문에 연결되지 않은 선물 지급' as issue
FROM customer_gifts cg
JOIN customers c ON cg.customer_id = c.id
LEFT JOIN products p ON cg.product_id = p.id
WHERE cg.delivery_status = 'sent'
  AND cg.delivery_date >= '2025-12-18'
  AND cg.survey_id IS NULL
ORDER BY cg.delivery_date DESC;

-- ============================================
-- 4. 선물 지급은 되었지만 설문에 gift_delivered가 체크되지 않은 경우 확인
-- ============================================
SELECT 
  '설문 미체크' as check_type,
  s.name,
  s.phone,
  s.gift_delivered,
  cg.delivery_date,
  p.name as product_name,
  '설문에 gift_delivered가 false이거나 NULL' as issue
FROM surveys s
JOIN customer_gifts cg ON cg.survey_id = s.id
LEFT JOIN products p ON cg.product_id = p.id
WHERE cg.delivery_status = 'sent'
  AND cg.delivery_date >= '2025-12-18'
  AND (s.gift_delivered = false OR s.gift_delivered IS NULL)
ORDER BY cg.delivery_date DESC;

-- ============================================
-- 5. 업데이트: 설문에 gift_delivered 체크 (선물 지급 완료된 설문)
-- ============================================
UPDATE surveys s
SET gift_delivered = true
WHERE EXISTS (
  SELECT 1
  FROM customer_gifts cg
  WHERE cg.survey_id = s.id
    AND cg.delivery_status = 'sent'
    AND cg.delivery_date >= '2025-12-18'
)
AND (s.gift_delivered = false OR s.gift_delivered IS NULL);

-- ============================================
-- 6. 업데이트: 선물 지급 기록에 설문 연결 (전화번호로 매칭)
-- ============================================
-- 주의: 이 쿼리는 전화번호가 정확히 일치하는 경우만 연결합니다
UPDATE customer_gifts cg
SET survey_id = s.id
FROM customers c, surveys s
WHERE cg.customer_id = c.id
  AND cg.delivery_status = 'sent'
  AND cg.delivery_date >= '2025-12-18'
  AND cg.survey_id IS NULL
  AND s.phone = c.phone
  AND NOT EXISTS (
    SELECT 1 
    FROM customer_gifts cg2 
    WHERE cg2.survey_id = s.id 
    AND cg2.id != cg.id
  );

-- ============================================
-- 7. 업데이트 후 확인
-- ============================================
SELECT 
  '업데이트 후 상태' as check_type,
  COUNT(DISTINCT cg.id) FILTER (WHERE cg.delivery_status = 'sent' AND cg.delivery_date >= '2025-12-18') as total_gifts,
  COUNT(DISTINCT cg.id) FILTER (WHERE cg.delivery_status = 'sent' AND cg.delivery_date >= '2025-12-18' AND cg.survey_id IS NOT NULL) as gifts_with_survey,
  COUNT(DISTINCT s.id) FILTER (WHERE s.gift_delivered = true) as surveys_checked,
  COUNT(DISTINCT cg.id) FILTER (WHERE cg.delivery_status = 'sent' AND cg.delivery_date >= '2025-12-18' AND cg.survey_id IS NULL) as gifts_without_survey,
  COUNT(DISTINCT s.id) FILTER (WHERE s.gift_delivered = false OR s.gift_delivered IS NULL) as surveys_not_checked
FROM customer_gifts cg
LEFT JOIN surveys s ON s.id = cg.survey_id
WHERE cg.delivery_status = 'sent'
  AND cg.delivery_date >= '2025-12-18';

-- ============================================
-- 8. 최종 확인: 선물 지급 완료된 8명의 설문 체크 상태
-- ============================================
SELECT 
  c.name as customer_name,
  c.phone,
  cg.delivery_date,
  p.name as product_name,
  s.id as survey_id,
  s.name as survey_name,
  s.gift_delivered,
  CASE 
    WHEN s.gift_delivered = true THEN '✅ 완료'
    WHEN s.id IS NOT NULL THEN '⚠️ 설문은 있지만 체크 안됨'
    ELSE '❌ 설문 없음'
  END as status
FROM customer_gifts cg
JOIN customers c ON cg.customer_id = c.id
LEFT JOIN products p ON cg.product_id = p.id
LEFT JOIN surveys s ON s.id = cg.survey_id OR s.phone = c.phone
WHERE cg.delivery_status = 'sent'
  AND cg.delivery_date >= '2025-12-18'
ORDER BY cg.delivery_date DESC;

