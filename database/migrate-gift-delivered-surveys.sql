-- 선물 지급 완료된 설문의 gift_delivered 필드를 true로 업데이트
-- customer_gifts에서 delivery_status = 'sent'이고 survey_id가 있는 설문들을 대상으로 함

-- 1. 업데이트 전 상태 확인
SELECT 
  '업데이트 전 상태' as status,
  COUNT(*) as total_surveys,
  COUNT(*) FILTER (WHERE gift_delivered = true) as gift_delivered_count,
  COUNT(*) FILTER (WHERE gift_delivered = false OR gift_delivered IS NULL) as not_delivered_count
FROM surveys;

-- 2. 업데이트 대상 확인 (실제로 업데이트될 설문 수)
SELECT 
  '업데이트 대상' as status,
  COUNT(DISTINCT s.id) as target_count
FROM surveys s
WHERE EXISTS (
  SELECT 1 
  FROM customer_gifts cg
  WHERE cg.survey_id = s.id
    AND cg.delivery_status = 'sent'
    AND cg.survey_id IS NOT NULL
);

-- 3. 실제 업데이트 실행
UPDATE surveys s
SET gift_delivered = true
WHERE EXISTS (
  SELECT 1 
  FROM customer_gifts cg
  WHERE cg.survey_id = s.id
    AND cg.delivery_status = 'sent'
    AND cg.survey_id IS NOT NULL
);

-- 4. 업데이트 후 상태 확인
SELECT 
  '업데이트 후 상태' as status,
  COUNT(*) as total_surveys,
  COUNT(*) FILTER (WHERE gift_delivered = true) as gift_delivered_count,
  COUNT(*) FILTER (WHERE gift_delivered = false OR gift_delivered IS NULL) as not_delivered_count
FROM surveys;

-- 5. 선물 지급 완료된 설문 상세 목록 확인
SELECT 
  s.id,
  s.name,
  s.phone,
  s.gift_delivered,
  cg.delivery_status,
  cg.delivery_date,
  p.name as product_name,
  cg.quantity
FROM surveys s
JOIN customer_gifts cg ON cg.survey_id = s.id
LEFT JOIN products p ON cg.product_id = p.id
WHERE cg.delivery_status = 'sent'
  AND cg.survey_id IS NOT NULL
ORDER BY cg.delivery_date DESC;

-- 6. customer_gifts 상태 확인 (디버깅용)
SELECT 
  'customer_gifts 상태' as status,
  delivery_status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE survey_id IS NOT NULL) as with_survey_id,
  COUNT(*) FILTER (WHERE survey_id IS NULL) as without_survey_id
FROM customer_gifts
GROUP BY delivery_status;

