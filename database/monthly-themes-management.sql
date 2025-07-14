-- 📅 월별 테마 확인 및 관리

-- 1. 현재 월별 테마 개수 확인
SELECT 
    COUNT(*) as total_themes,
    MIN(year || '-' || LPAD(month::text, 2, '0')) as start_month,
    MAX(year || '-' || LPAD(month::text, 2, '0')) as end_month,
    COUNT(DISTINCT year) as years_covered
FROM monthly_themes;

-- 2. 월별 테마 상세 확인
SELECT 
    year,
    month,
    theme,
    focus_keywords,
    created_at
FROM monthly_themes
ORDER BY year, month;

-- 3. 2026년 7월부터 2027년 6월까지 추가 (2년차 데이터)
INSERT INTO monthly_themes (year, month, theme, focus_keywords, description) VALUES
    -- 2026년 하반기
    (2026, 7, '프리미엄 골프 여행', ARRAY['골프 투어', '해외 골프', '골프 리조트', 'VIP 골프'], '럭셔리 골프 여행 패키지와 프리미엄 골프장 소개'),
    (2026, 8, '골프 피트니스 월', ARRAY['골프 체력', '코어 운동', '유연성', '부상 예방'], '골프 실력 향상을 위한 체력 관리와 운동법'),
    (2026, 9, '스마트 골프 테크', ARRAY['골프 앱', 'GPS 거리측정기', '스윙 분석기', 'AI 코칭'], '최신 골프 기술과 스마트 장비 활용법'),
    (2026, 10, '골프 멘탈 강화', ARRAY['집중력', '압박 극복', '루틴', '심리 훈련'], '프로처럼 강한 멘탈 만들기'),
    (2026, 11, '윈터 골프 준비', ARRAY['겨울 골프', '보온 장비', '스윙 조정', '실내 연습'], '겨울철 골프를 위한 준비와 팁'),
    (2026, 12, '연말 골프 어워드', ARRAY['베스트 장비', '올해의 골퍼', '골프장 추천', '연말 이벤트'], '한 해를 마무리하는 특별 이벤트'),
    
    -- 2027년 상반기
    (2027, 1, '뉴이어 골프 챌린지', ARRAY['새해 목표', '100타 깨기', '싱글 도전', '월별 계획'], '2027년 골프 목표 설정과 달성 전략'),
    (2027, 2, '커플 골프 데이', ARRAY['커플 골프', '2인 게임', '골프 데이트', '함께하는 즐거움'], '연인/부부가 함께 즐기는 골프'),
    (2027, 3, '봄맞이 장비 점검', ARRAY['클럽 피팅', '그립 교체', '샤프트 선택', '신제품 리뷰'], '새 시즌을 위한 장비 관리와 업그레이드'),
    (2027, 4, '에코 골프 캠페인', ARRAY['친환경 골프', '전동 카트', '재활용 골프볼', '그린 골프장'], '지속가능한 골프 문화 만들기'),
    (2027, 5, '골프 & 비즈니스', ARRAY['비즈니스 골프', '네트워킹', '접대 골프', '매너와 에티켓'], '성공적인 비즈니스 골프 가이드'),
    (2027, 6, '상반기 결산 특집', ARRAY['상반기 베스트', '인기 상품', '고객 후기', '특별 할인'], '2027년 상반기 총정리와 하반기 전망')
ON CONFLICT (year, month) DO NOTHING;

-- 4. 캠페인과 월별 테마 연결 함수
CREATE OR REPLACE FUNCTION link_campaign_to_monthly_theme()
RETURNS TRIGGER AS $$
DECLARE
    theme_record RECORD;
BEGIN
    -- 캠페인 시작 월의 테마 찾기
    SELECT * INTO theme_record
    FROM monthly_themes
    WHERE year = EXTRACT(YEAR FROM NEW.start_date)
    AND month = EXTRACT(MONTH FROM NEW.start_date);
    
    -- 테마가 있으면 캠페인에 연결
    IF FOUND THEN
        NEW.monthly_theme_id = theme_record.id;
        
        -- 테마의 키워드를 캠페인 설명에 추가
        IF NEW.description IS NULL OR NEW.description = '' THEN
            NEW.description = theme_record.theme || ': ' || theme_record.description;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS auto_link_monthly_theme ON campaigns;
CREATE TRIGGER auto_link_monthly_theme
BEFORE INSERT OR UPDATE ON campaigns
FOR EACH ROW
EXECUTE FUNCTION link_campaign_to_monthly_theme();

-- 5. 월별 테마 관리 뷰
CREATE OR REPLACE VIEW monthly_theme_calendar AS
SELECT 
    mt.year,
    mt.month,
    mt.theme,
    mt.focus_keywords,
    COUNT(c.id) as campaign_count,
    STRING_AGG(c.name, ', ') as campaigns
FROM monthly_themes mt
LEFT JOIN campaigns c ON c.monthly_theme_id = mt.id
GROUP BY mt.id, mt.year, mt.month, mt.theme, mt.focus_keywords
ORDER BY mt.year, mt.month;

-- 6. 연간 테마 계획 뷰
CREATE OR REPLACE VIEW annual_theme_plan AS
WITH months AS (
    SELECT generate_series(1, 12) as month
)
SELECT 
    y.year,
    m.month,
    CASE m.month
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
    COALESCE(mt.theme, '(미설정)') as theme,
    mt.focus_keywords,
    CASE 
        WHEN mt.id IS NOT NULL THEN '✅'
        ELSE '❌'
    END as has_theme
FROM (SELECT DISTINCT year FROM monthly_themes) y
CROSS JOIN months m
LEFT JOIN monthly_themes mt ON y.year = mt.year AND m.month = mt.month
ORDER BY y.year, m.month;