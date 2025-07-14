-- 📅 월별 마케팅 테마 상세 업데이트
-- 사용자 제공 내용 반영 (프로모션 포함)

-- 1. 기존 데이터 업데이트 (2025년 7월 ~ 2026년 6월)
UPDATE monthly_themes SET 
    theme = '여름 성수기 쿨링 캠페인',
    description = '뜨거운 여름, 완벽한 스윙을 위한 준비',
    focus_keywords = ARRAY['여름 골프', '쿨링', '스포츠 타월', '팔토시', '고급 위스키'],
    promotion_details = '상담/방문 고객 전체 쿨링 패키지(스포츠 타월, 팔 토시) 증정 + 구매 고객 고급 위스키 증정',
    target_audience = '고소득층 및 4060세대'
WHERE year = 2025 AND month = 7;

UPDATE monthly_themes SET 
    theme = '여름 휴가 시즌',
    description = '휴가철, 골프 휴양지 필수품',
    focus_keywords = ARRAY['휴가철', '골프 여행', '방수파우치', '여행 상품권'],
    promotion_details = 'XX만원 이상 구매 시 골프 여행 상품권 XX만원 증정 + 방수파우치 증정',
    target_audience = '휴가철 골프 여행객'
WHERE year = 2025 AND month = 8;

UPDATE monthly_themes SET 
    theme = '가을 시즌 준비',
    description = '가을 라운드, 스타일리시하게 / 골프 성수기 전 점검 OR 교체',
    focus_keywords = ARRAY['가을 골프', '스타일', '골프 의류', '볼캡'],
    promotion_details = 'XX만원 이상 구매 시 골프 의류 상품권 XX만원 증정 + 마쓰구 로고 볼캡 증정',
    target_audience = '가을 골프 시즌 고객'
WHERE year = 2025 AND month = 9;

UPDATE monthly_themes SET 
    theme = '가을 골프 성수기',
    description = '가을 골프, 마쓰구로 완성',
    focus_keywords = ARRAY['가을 성수기', '마쓰구', '골프 장갑', '할인'],
    promotion_details = '적정 할인 XX% 제공 + 골프 장갑 증정',
    target_audience = '고소득층'
WHERE year = 2025 AND month = 10;

UPDATE monthly_themes SET 
    theme = '블랙 프라이데이 세일',
    description = '블랙 프라이데이, 마쓰골프 특별 세일',
    focus_keywords = ARRAY['블랙프라이데이', '연말 세일', '최대 할인', '특가'],
    promotion_details = '연중 최대 할인 XX% 제공',
    target_audience = '전체 고객'
WHERE year = 2025 AND month = 11;

UPDATE monthly_themes SET 
    theme = '연말 고객 감사',
    description = '연말, 마쓰구와 함께한 골프의 추억',
    focus_keywords = ARRAY['연말', '고객 감사', '마쓰구 굿즈', '악세서리'],
    promotion_details = 'XX만원 이상 구매 시 마쓰구 굿즈(악세서리) 증정',
    target_audience = '충성 고객'
WHERE year = 2025 AND month = 12;

UPDATE monthly_themes SET 
    theme = '새해 다짐과 골프 시작',
    description = '2026년, 새해 첫 스윙을 마쓰구와',
    focus_keywords = ARRAY['새해', '첫 스윙', '골프공', '볼마커', '비거리 측정기', '럭키 드로우'],
    promotion_details = 'XX만원 이상 구매 시 골프공, 볼마커, 비거리 측정기 증정 + 신년 럭키 드로우 추첨 이벤트(1등: 골프백)',
    target_audience = '신규 고객'
WHERE year = 2026 AND month = 1;

UPDATE monthly_themes SET 
    theme = '설날 선물 캠페인',
    description = '설날, 골프 선물로 마음을 전하세요',
    focus_keywords = ARRAY['설날', '명절 선물', '선물 패키지', '선물 포장'],
    promotion_details = '설 선물 패키지 XX% 할인 + 명절 전용 선물 포장',
    target_audience = '설 선물 구매 고객'
WHERE year = 2026 AND month = 2;

UPDATE monthly_themes SET 
    theme = '봄 맞이 준비',
    description = '봄 골프 시즌, 마쓰구로 준비 완료',
    focus_keywords = ARRAY['봄 골프', '시즌 준비', '장비 교체', '골프 장갑'],
    promotion_details = '적정 할인 XX% 제공 + 골프 장갑 증정',
    target_audience = '시즌 준비 고객'
WHERE year = 2026 AND month = 3;

UPDATE monthly_themes SET 
    theme = '골프 시즌 본격 개막',
    description = '본격 골프 시즌, 마쓰구와 함께',
    focus_keywords = ARRAY['골프 시즌', '개막', '골프 의류', '마쓰구 볼캡'],
    promotion_details = 'XX만원 이상 구매 시 골프 의류 상품권 XX만원 증정 + 마쓰구 로고 볼캡 증정',
    target_audience = '신규 및 기존 고객'
WHERE year = 2026 AND month = 4;

UPDATE monthly_themes SET 
    theme = '가정의 달 선물 캠페인',
    description = '가족과 함께하는 골프 선물',
    focus_keywords = ARRAY['가정의 달', '가족', '골프 선물', '고급 우산'],
    promotion_details = 'XX만원 이상 구매 시 골프 XXXX 증정 + 고급 골프 우산 증정',
    target_audience = '가족 단위 고객'
WHERE year = 2026 AND month = 5;

UPDATE monthly_themes SET 
    theme = '초여름 준비',
    description = '여름 골프를 위한 필수 준비',
    focus_keywords = ARRAY['초여름', '여름 준비', '선글라스', '여름 골프'],
    promotion_details = 'XX만원 이상 구매 시 고급 스포츠 선글라스 증정',
    target_audience = '여름 골프 준비 고객'
WHERE year = 2026 AND month = 6;

-- 2. 프로모션 정보를 위한 컬럼 추가 (없는 경우)
ALTER TABLE monthly_themes ADD COLUMN IF NOT EXISTS promotion_details TEXT;
ALTER TABLE monthly_themes ADD COLUMN IF NOT EXISTS target_audience VARCHAR(200);

-- 3. 월별 테마와 프로모션 통합 뷰
CREATE OR REPLACE VIEW monthly_marketing_plan AS
SELECT 
    year,
    month,
    CASE month
        WHEN 1 THEN '1월'
        WHEN 2 THEN '2월'
        WHEN 3 THEN '3월'
        WHEN 4 THEN '4월'
        WHEN 5 THEN '5월'
        WHEN 6 THEN '6월'
        WHEN 7 THEN '7월'
        WHEN 8 THEN '8월'
        WHEN 9 THEN '9월'
        WHEN 10 THEN '10월'
        WHEN 11 THEN '11월'
        WHEN 12 THEN '12월'
    END as month_name,
    theme,
    description,
    target_audience,
    promotion_details,
    focus_keywords
FROM monthly_themes
ORDER BY year, month;

-- 4. 캠페인 자동 생성 함수 (월별 테마 기반)
CREATE OR REPLACE FUNCTION create_monthly_campaign(
    p_year INTEGER,
    p_month INTEGER
) RETURNS UUID AS $$
DECLARE
    v_theme_record RECORD;
    v_campaign_id UUID;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- 해당 월의 테마 찾기
    SELECT * INTO v_theme_record
    FROM monthly_themes
    WHERE year = p_year AND month = p_month;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '해당 년월의 테마가 없습니다: %년 %월', p_year, p_month;
    END IF;
    
    -- 날짜 계산
    v_start_date := DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01');
    v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- 캠페인 생성
    INSERT INTO campaigns (
        name,
        type,
        status,
        start_date,
        end_date,
        description,
        target_audience,
        monthly_theme_id,
        is_multichannel
    ) VALUES (
        p_year || '년 ' || p_month || '월 ' || v_theme_record.theme,
        'monthly_promotion',
        'planned',
        v_start_date,
        v_end_date,
        v_theme_record.description || ' - ' || COALESCE(v_theme_record.promotion_details, ''),
        COALESCE(v_theme_record.target_audience, '전체 고객'),
        v_theme_record.id,
        true
    ) RETURNING id INTO v_campaign_id;
    
    RETURN v_campaign_id;
END;
$$ LANGUAGE plpgsql;

-- 5. 연간 마케팅 캘린더 뷰 (프로모션 포함)
CREATE OR REPLACE VIEW annual_marketing_calendar AS
WITH quarters AS (
    SELECT 
        year,
        CASE 
            WHEN month IN (1,2,3) THEN 'Q1'
            WHEN month IN (4,5,6) THEN 'Q2'
            WHEN month IN (7,8,9) THEN 'Q3'
            WHEN month IN (10,11,12) THEN 'Q4'
        END as quarter,
        month,
        theme,
        target_audience,
        promotion_details
    FROM monthly_themes
)
SELECT 
    year,
    quarter,
    STRING_AGG(
        month || '월: ' || theme || 
        CASE 
            WHEN promotion_details IS NOT NULL 
            THEN ' (' || LEFT(promotion_details, 30) || '...)' 
            ELSE '' 
        END, 
        E'\n' ORDER BY month
    ) as quarterly_themes
FROM quarters
GROUP BY year, quarter
ORDER BY year, quarter;

-- 6. 테스트: 2025년 7월 캠페인 자동 생성
-- SELECT create_monthly_campaign(2025, 7);