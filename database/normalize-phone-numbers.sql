-- ============================================
-- 전화번호 정규화 마이그레이션
-- ============================================
-- 목적: surveys와 customers 테이블의 전화번호를 정규화된 형식(하이픈 없음)으로 통일
-- 예: 010-1234-5678 → 01012345678

-- ============================================
-- 1. 마이그레이션 전 상태 확인
-- ============================================
SELECT 
  '마이그레이션 전 상태' as check_type,
  COUNT(*) as total_surveys,
  COUNT(*) FILTER (WHERE phone ~ '[^0-9]') as surveys_with_formatting,
  COUNT(*) FILTER (WHERE phone !~ '[^0-9]') as surveys_normalized
FROM surveys;

SELECT 
  '마이그레이션 전 상태' as check_type,
  COUNT(*) as total_customers,
  COUNT(*) FILTER (WHERE phone ~ '[^0-9]') as customers_with_formatting,
  COUNT(*) FILTER (WHERE phone !~ '[^0-9]') as customers_normalized
FROM customers;

-- ============================================
-- 2. surveys 테이블 전화번호 정규화
-- ============================================
-- 하이픈, 공백, 기타 문자 제거 (숫자만 남김)
UPDATE surveys
SET phone = REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
WHERE phone ~ '[^0-9]';

-- 82로 시작하는 전화번호를 0으로 시작하도록 변경
UPDATE surveys
SET phone = '0' || SUBSTRING(phone FROM 3)
WHERE phone LIKE '82%' AND LENGTH(phone) >= 2;

-- ============================================
-- 3. customers 테이블 전화번호 정규화
-- ============================================
-- 하이픈, 공백, 기타 문자 제거 (숫자만 남김)
UPDATE customers
SET phone = REGEXP_REPLACE(phone, '[^0-9]', '', 'g')
WHERE phone ~ '[^0-9]';

-- 82로 시작하는 전화번호를 0으로 시작하도록 변경
UPDATE customers
SET phone = '0' || SUBSTRING(phone FROM 3)
WHERE phone LIKE '82%' AND LENGTH(phone) >= 2;

-- ============================================
-- 4. 마이그레이션 후 상태 확인
-- ============================================
SELECT 
  '마이그레이션 후 상태' as check_type,
  COUNT(*) as total_surveys,
  COUNT(*) FILTER (WHERE phone ~ '[^0-9]') as surveys_with_formatting,
  COUNT(*) FILTER (WHERE phone !~ '[^0-9]') as surveys_normalized,
  COUNT(*) FILTER (WHERE phone IS NULL OR phone = '') as surveys_empty
FROM surveys;

SELECT 
  '마이그레이션 후 상태' as check_type,
  COUNT(*) as total_customers,
  COUNT(*) FILTER (WHERE phone ~ '[^0-9]') as customers_with_formatting,
  COUNT(*) FILTER (WHERE phone !~ '[^0-9]') as customers_normalized,
  COUNT(*) FILTER (WHERE phone IS NULL OR phone = '') as customers_empty
FROM customers;

-- ============================================
-- 5. 샘플 데이터 확인
-- ============================================
SELECT 
  '샘플 데이터' as check_type,
  id,
  name,
  phone,
  LENGTH(phone) as phone_length,
  CASE 
    WHEN phone ~ '[^0-9]' THEN '❌ 포맷팅됨'
    ELSE '✅ 정규화됨'
  END as status
FROM surveys
ORDER BY updated_at DESC
LIMIT 10;

SELECT 
  '샘플 데이터' as check_type,
  id,
  name,
  phone,
  LENGTH(phone) as phone_length,
  CASE 
    WHEN phone ~ '[^0-9]' THEN '❌ 포맷팅됨'
    ELSE '✅ 정규화됨'
  END as status
FROM customers
ORDER BY updated_at DESC
LIMIT 10;

