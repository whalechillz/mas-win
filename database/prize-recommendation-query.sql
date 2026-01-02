-- ============================================
-- 경품 추천 고객 선정 쿼리
-- ============================================
-- 목적: 설문 고객 중 구매 확률이 높은 고객 20명 추천
--   - 구매 고객 중 바이럴/재구매 고객 10명 (2년 이상)
--   - 비구매 고객 중 매장과 가까운 고객 10명

-- 매장 정보
-- 주소: 경기도 수원시 영통구 법조로149번길 200
-- 좌표: 위도 37.2808, 경도 127.0498

-- ============================================
-- 1. 구매 고객 중 바이럴/재구매 고객 추천 (2년 이상, 10명)
-- ============================================
WITH purchased_customers AS (
  SELECT DISTINCT
    s.id as survey_id,
    s.name,
    s.phone,
    s.address,
    s.selected_model,
    s.important_factors,
    s.additional_feedback,
    s.created_at as survey_created_at,
    c.id as customer_id,
    c.first_inquiry_date,
    c.last_contact_date,
    c.visit_count,
    -- 선물 받은 횟수
    (SELECT COUNT(*) 
     FROM customer_gifts cg 
     WHERE cg.customer_id = c.id 
       AND cg.delivery_status = 'sent') as gift_count,
    -- 예약 횟수
    (SELECT COUNT(*) 
     FROM bookings b 
     WHERE b.customer_id = c.id 
       OR (b.phone = c.phone AND b.phone IS NOT NULL)) as booking_count,
    -- 설문 응답 품질 점수
    (
      COALESCE(array_length(s.important_factors, 1), 0) + 
      CASE WHEN s.additional_feedback IS NOT NULL AND s.additional_feedback != '' THEN 1 ELSE 0 END
    ) as survey_quality_score,
    -- 최근 활동일 (일수)
    EXTRACT(EPOCH FROM (NOW() - GREATEST(
      COALESCE(c.last_contact_date, c.first_inquiry_date),
      COALESCE(s.created_at::date, '1970-01-01'::date)
    ))) / 86400 as days_since_last_activity
  FROM surveys s
  JOIN customers c ON c.phone = s.phone
  WHERE 
    -- 2년 이상 된 고객
    (c.first_inquiry_date IS NOT NULL AND c.first_inquiry_date <= NOW() - INTERVAL '2 years')
    OR (s.created_at IS NOT NULL AND s.created_at <= NOW() - INTERVAL '2 years')
    -- 구매 고객 (예약 기록이 있거나 방문 횟수가 0보다 큰 경우)
    AND (
      EXISTS (
        SELECT 1 FROM bookings b 
        WHERE (b.customer_id = c.id OR b.phone = c.phone) 
          AND b.phone IS NOT NULL
      )
      OR c.visit_count > 0
    )
)
SELECT 
  '구매 고객' as customer_type,
  survey_id,
  name,
  phone,
  address,
  selected_model,
  important_factors,
  survey_quality_score,
  gift_count,
  visit_count,
  booking_count,
  days_since_last_activity,
  -- 점수 계산
  (
    (gift_count * 3) + 
    (visit_count * 2) + 
    (booking_count * 2) +
    (survey_quality_score * 1) +
    CASE 
      WHEN days_since_last_activity <= 30 THEN 10
      WHEN days_since_last_activity <= 90 THEN 5
      WHEN days_since_last_activity <= 180 THEN 2
      ELSE 0
    END
  ) as total_score,
  first_inquiry_date,
  last_contact_date
FROM purchased_customers
ORDER BY total_score DESC, days_since_last_activity ASC
LIMIT 10;

-- ============================================
-- 2. 비구매 고객 중 거리 기반 고객 추천 (10명)
-- ============================================
WITH non_purchased_customers AS (
  SELECT DISTINCT
    s.id as survey_id,
    s.name,
    s.phone,
    s.address,
    s.selected_model,
    s.important_factors,
    s.additional_feedback,
    s.created_at as survey_created_at,
    c.id as customer_id,
    c.first_inquiry_date,
    -- 설문 응답 품질 점수
    (
      COALESCE(array_length(s.important_factors, 1), 0) + 
      CASE WHEN s.additional_feedback IS NOT NULL AND s.additional_feedback != '' THEN 1 ELSE 0 END
    ) as survey_quality_score,
    -- 최근 설문 제출일 (일수)
    EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 86400 as days_since_survey
  FROM surveys s
  LEFT JOIN customers c ON c.phone = s.phone
  WHERE 
    -- 비구매 고객 (예약 기록이 없고 방문 횟수가 0이거나 없는 경우)
    (
      NOT EXISTS (
        SELECT 1 FROM bookings b 
        WHERE (b.customer_id = c.id OR b.phone = s.phone) 
          AND b.phone IS NOT NULL
      )
      AND (c.visit_count IS NULL OR c.visit_count = 0)
    )
    -- 주소가 있는 경우만
    AND s.address IS NOT NULL 
    AND s.address != ''
)
SELECT 
  '비구매 고객' as customer_type,
  survey_id,
  name,
  phone,
  address,
  selected_model,
  important_factors,
  survey_quality_score,
  days_since_survey,
  -- 거리는 API에서 계산 (여기서는 NULL로 표시)
  NULL::numeric as distance_km,
  -- 점수 계산 (거리는 API에서 계산 후 업데이트)
  (
    (survey_quality_score * 2) +
    CASE 
      WHEN days_since_survey <= 30 THEN 10
      WHEN days_since_survey <= 90 THEN 5
      WHEN days_since_survey <= 180 THEN 2
      ELSE 0
    END
  ) as base_score,
  first_inquiry_date,
  survey_created_at
FROM non_purchased_customers
ORDER BY base_score DESC, days_since_survey ASC
LIMIT 20; -- 거리 계산 후 상위 10명 선정

-- ============================================
-- 3. 전체 고객 점수 계산 (98명)
-- ============================================
WITH all_customers AS (
  SELECT DISTINCT
    s.id as survey_id,
    s.name,
    s.phone,
    s.address,
    s.selected_model,
    s.important_factors,
    s.additional_feedback,
    s.created_at as survey_created_at,
    c.id as customer_id,
    c.first_inquiry_date,
    c.last_contact_date,
    c.visit_count,
    -- 선물 받은 횟수
    (SELECT COUNT(*) 
     FROM customer_gifts cg 
     WHERE cg.customer_id = c.id 
       AND cg.delivery_status = 'sent') as gift_count,
    -- 예약 횟수
    (SELECT COUNT(*) 
     FROM bookings b 
     WHERE b.customer_id = c.id 
       OR (b.phone = c.phone AND b.phone IS NOT NULL)) as booking_count,
    -- 구매 여부
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM bookings b 
        WHERE (b.customer_id = c.id OR b.phone = c.phone) 
          AND b.phone IS NOT NULL
      ) OR c.visit_count > 0 THEN true
      ELSE false
    END as is_purchased,
    -- 설문 응답 품질 점수
    (
      COALESCE(array_length(s.important_factors, 1), 0) + 
      CASE WHEN s.additional_feedback IS NOT NULL AND s.additional_feedback != '' THEN 1 ELSE 0 END
    ) as survey_quality_score,
    -- 최근 활동일 (일수)
    EXTRACT(EPOCH FROM (NOW() - GREATEST(
      COALESCE(c.last_contact_date, c.first_inquiry_date),
      COALESCE(s.created_at::date, '1970-01-01'::date)
    ))) / 86400 as days_since_last_activity,
    -- 2년 이상 여부
    CASE 
      WHEN (c.first_inquiry_date IS NOT NULL AND c.first_inquiry_date <= NOW() - INTERVAL '2 years')
        OR (s.created_at IS NOT NULL AND s.created_at <= NOW() - INTERVAL '2 years')
      THEN true
      ELSE false
    END as is_over_2_years
  FROM surveys s
  LEFT JOIN customers c ON c.phone = s.phone
)
SELECT 
  survey_id,
  name,
  phone,
  address,
  selected_model,
  important_factors,
  is_purchased,
  is_over_2_years,
  gift_count,
  visit_count,
  booking_count,
  survey_quality_score,
  days_since_last_activity,
  -- 점수 계산 (구매 고객과 비구매 고객 구분)
  CASE 
    WHEN is_purchased AND is_over_2_years THEN
      -- 구매 고객 점수
      (
        (gift_count * 3) + 
        (visit_count * 2) + 
        (booking_count * 2) +
        (survey_quality_score * 1) +
        CASE 
          WHEN days_since_last_activity <= 30 THEN 10
          WHEN days_since_last_activity <= 90 THEN 5
          WHEN days_since_last_activity <= 180 THEN 2
          ELSE 0
        END
      )
    ELSE
      -- 비구매 고객 기본 점수 (거리는 API에서 계산 후 추가)
      (
        (survey_quality_score * 2) +
        CASE 
          WHEN days_since_last_activity <= 30 THEN 10
          WHEN days_since_last_activity <= 90 THEN 5
          WHEN days_since_last_activity <= 180 THEN 2
          ELSE 0
        END
      )
  END as total_score,
  first_inquiry_date,
  last_contact_date
FROM all_customers
ORDER BY total_score DESC, days_since_last_activity ASC;

