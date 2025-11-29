-- 서비스 타입별 예약 통계 확인
-- 실행 날짜: 2025-11-24

SELECT 
  service_type,
  COUNT(*) as 예약건수,
  COUNT(DISTINCT phone) as 고유고객수,
  MIN(date) as 최초예약일,
  MAX(date) as 최근예약일,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as 완료건수,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as 확정건수,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as 대기건수
FROM bookings
WHERE service_type IS NOT NULL
GROUP BY service_type
ORDER BY 예약건수 DESC;

-- 상세 분석: "마쓰구 드라이버" vs "KGFA 1급" 비교
SELECT 
  CASE 
    WHEN service_type LIKE '%마쓰구 드라이버%' OR service_type LIKE '%드라이버 시타%' THEN '마쓰구 드라이버 시타'
    WHEN service_type LIKE '%KGFA%' OR service_type LIKE '%1급%' THEN 'KGFA 1급 시타'
    ELSE '기타'
  END as 서비스카테고리,
  COUNT(*) as 예약건수,
  COUNT(DISTINCT phone) as 고유고객수,
  ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - created_at::timestamp)) / 86400), 1) as 평균경과일수
FROM bookings
WHERE service_type IS NOT NULL
GROUP BY 서비스카테고리
ORDER BY 예약건수 DESC;


