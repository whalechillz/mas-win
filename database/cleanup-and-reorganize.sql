-- 🧹 중복 테이블 정리 및 통합 시스템 구축

-- =====================================
-- STEP 1: 백업 (안전을 위해)
-- =====================================

-- 기존 데이터 백업
CREATE TABLE IF NOT EXISTS _backup_monthly_themes AS SELECT * FROM monthly_themes;
CREATE TABLE IF NOT EXISTS _backup_marketing_campaigns AS SELECT * FROM marketing_campaigns;

-- =====================================
-- STEP 2: 중복 뷰 삭제
-- =====================================

-- 뷰들 삭제 (뷰는 실제 데이터가 없으므로 안전)
DROP VIEW IF EXISTS annual_marketing_calendar CASCADE;
DROP VIEW IF EXISTS annual_theme_plan CASCADE;
DROP VIEW IF EXISTS monthly_marketing_plan CASCADE;
DROP VIEW IF EXISTS monthly_theme_calendar CASCADE;
DROP VIEW IF EXISTS integrated_campaign_dashboard CASCADE;

-- =====================================
-- STEP 3: 핵심 테이블 재구성
-- =====================================

-- 3-1. monthly_themes 테이블 초기화 및 재구성
TRUNCATE TABLE monthly_themes CASCADE;

-- 3-2. 엑셀 데이터 기반으로 정확한 데이터 입력
INSERT INTO monthly_themes (year, month, theme, objective, promotion_detail, target_audience, focus_keywords) VALUES
-- 2025년
(2025, 7, '여름 성수기 쿨링 캠페인', 
 '뜨거운 여름, 완벽한 스윙을 위한 준비', 
 '상담/방문 고객 전체 쿨링 패키지(스포츠 타월, 팔토시) 증정 + 구매 고객 고급 위스키 증정',
 '고소득층 및 4060세대',
 ARRAY['여름 골프', '쿨링', '스포츠 타월', '팔토시', '위스키']),

(2025, 8, '여름 휴가 시즌', 
 '휴가철, 골프 휴양지 필수품', 
 '00만원 이상 구매 시 골프 여행 상품권 00만원 증정 + 방수파우치 증정',
 '휴가철 골프 여행객',
 ARRAY['휴가', '골프 여행', '방수파우치', '여행 상품권']),

(2025, 9, '가을 시즌 준비', 
 '가을 라운드, 스타일리시하게 / 골프 성수기 전 점검 OR 교체', 
 '00만원 이상 구매 시 골프 의류 상품권 00만원 증정 + 마쓰구 로고 볼캡 증정',
 '가을 골프 시즌 고객',
 ARRAY['가을 골프', '스타일', '골프 의류', '볼캡']),

(2025, 10, '가을 골프 성수기', 
 '가을 골프, 마쓰구로 완성', 
 '적정 할인 00% 제공 + 골프 장갑 증정',
 '고소득층',
 ARRAY['가을 성수기', '마쓰구', '골프 장갑', '할인']),

(2025, 11, '블랙 프라이데이 세일', 
 '블랙 프라이데이, 마쓰골프 특별 세일', 
 '연중 최대 할인 00% 제공',
 '전체 고객',
 ARRAY['블랙프라이데이', '연말 세일', '최대 할인']),

(2025, 12, '연말 고객 감사', 
 '연말, 마쓰구와 함께한 골프의 추억', 
 '00만원 이상 구매 시 마쓰구 굿즈(악세서리) 증정',
 '충성 고객',
 ARRAY['연말', '고객 감사', '마쓰구 굿즈', '악세서리']),

-- 2026년
(2026, 1, '새해 다짐과 골프 시작', 
 '2026년, 새해 첫 스윙을 마쓰구와', 
 '00만원 이상 구매 시 골프공, 볼마커, 비거리 측정기 증정 + 신년 럭키 드로우 추첨 이벤트(1등: 골프백)',
 '신규 고객',
 ARRAY['새해', '첫 스윙', '골프공', '럭키 드로우']),

(2026, 2, '설날 선물 캠페인', 
 '설날, 골프 선물로 마음을 전하세요', 
 '설 선물 패키지 00% 할인 + 명절 전용 선물 포장',
 '설 선물 구매 고객',
 ARRAY['설날', '명절 선물', '선물 패키지', '선물 포장']),

(2026, 3, '봄 맞이 준비', 
 '봄 골프 시즌, 마쓰구로 준비 완료', 
 '적정 할인 00% 제공 + 골프 장갑 증정',
 '시즌 준비 고객',
 ARRAY['봄 골프', '시즌 준비', '장비 교체', '골프 장갑']),

(2026, 4, '골프 시즌 본격 개막', 
 '본격 골프 시즌, 마쓰구와 함께', 
 '00만원 이상 구매 시 골프 의류 상품권 00만원 증정 + 마쓰구 로고 볼캡 증정',
 '신규 및 기존 고객',
 ARRAY['골프 시즌', '개막', '골프 의류', '볼캡']),

(2026, 5, '가정의 달 선물 캠페인', 
 '가족과 함께하는 골프 선물', 
 '00만원 이상 구매 시 골프 XXXX 증정 + 고급 골프 우산 증정',
 '가족 단위 고객',
 ARRAY['가정의 달', '가족', '골프 선물', '골프 우산']),

(2026, 6, '초여름 준비', 
 '여름 골프를 위한 필수 준비', 
 '00만원 이상 구매 시 고급 스포츠 선글라스 증정',
 '여름 준비 고객',
 ARRAY['초여름', '여름 준비', '선글라스'])
ON CONFLICT (year, month) DO UPDATE SET
  theme = EXCLUDED.theme,
  objective = EXCLUDED.objective,
  promotion_detail = EXCLUDED.promotion_detail,
  target_audience = EXCLUDED.target_audience,
  focus_keywords = EXCLUDED.focus_keywords;

-- =====================================
-- STEP 4: 심플한 캠페인 시스템 구축
-- =====================================

-- 4-1. 캠페인 테이블 재구성
TRUNCATE TABLE marketing_campaigns CASCADE;

-- 4-2. 캠페인 타입 정의
CREATE TYPE campaign_channel_type AS ENUM ('kakao', 'sms', 'blog', 'multichannel');

-- 4-3. 월별 기본 캠페인 생성 함수
CREATE OR REPLACE FUNCTION create_monthly_campaigns(p_year INTEGER, p_month INTEGER)
RETURNS void AS $$
DECLARE
    v_theme RECORD;
    v_date DATE;
BEGIN
    -- 해당 월의 테마 가져오기
    SELECT * INTO v_theme 
    FROM monthly_themes 
    WHERE year = p_year AND month = p_month;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '테마가 없습니다: %년 %월', p_year, p_month;
    END IF;
    
    v_date := DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01');
    
    -- 카카오톡 캠페인 (월 2회: 1일, 15일)
    INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status)
    VALUES 
    (v_date, p_month, p_year, 'kakao', v_theme.theme, 
     v_theme.objective || ' - ' || v_theme.promotion_detail, 1200, '제이', 'planned'),
    (v_date + 14, p_month, p_year, 'kakao', v_theme.theme, 
     v_theme.promotion_detail, 1200, '제이', 'planned');
    
    -- 문자 캠페인 (월 2회: 2일, 16일)
    INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status)
    VALUES 
    (v_date + 1, p_month, p_year, 'sms', v_theme.theme, 
     '고객님을 위한 ' || p_month || '월 특별 혜택! ' || v_theme.promotion_detail, 1200, '제이', 'planned'),
    (v_date + 15, p_month, p_year, 'sms', v_theme.theme, 
     v_theme.promotion_detail, 1200, '제이', 'planned');
    
    -- 블로그 캠페인 (주 1회 대표)
    INSERT INTO marketing_campaigns (date, month, year, channel, topic, content, target_count, assignee, status)
    VALUES 
    (v_date + 6, p_month, p_year, 'blog', v_theme.theme, 
     '블로그 콘텐츠: ' || v_theme.objective, 0, '스테피', 'planned');
    
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- STEP 5: 2025년 7월 캠페인 생성
-- =====================================

-- 7월 캠페인 생성
SELECT create_monthly_campaigns(2025, 7);

-- 멀티채널 콘텐츠도 생성
SELECT generate_monthly_content(2025, 7);

-- =====================================
-- STEP 6: 통합 뷰 재생성 (단순화)
-- =====================================

-- 월별 캠페인 현황 뷰
CREATE OR REPLACE VIEW monthly_campaign_overview AS
SELECT 
    mt.year,
    mt.month,
    mt.theme,
    mt.objective,
    mt.promotion_detail,
    mt.target_audience,
    COUNT(DISTINCT mc.id) as campaign_count,
    COUNT(DISTINCT CASE WHEN mc.channel = 'kakao' THEN mc.id END) as kakao_campaigns,
    COUNT(DISTINCT CASE WHEN mc.channel = 'sms' THEN mc.id END) as sms_campaigns,
    COUNT(DISTINCT CASE WHEN mc.channel = 'blog' THEN mc.id END) as blog_campaigns,
    COUNT(DISTINCT ci.id) as content_count
FROM monthly_themes mt
LEFT JOIN marketing_campaigns mc ON mc.year = mt.year AND mc.month = mt.month
LEFT JOIN content_ideas ci ON ci.topic = mt.theme 
    AND EXTRACT(YEAR FROM ci.scheduled_date) = mt.year 
    AND EXTRACT(MONTH FROM ci.scheduled_date) = mt.month
GROUP BY mt.year, mt.month, mt.theme, mt.objective, mt.promotion_detail, mt.target_audience
ORDER BY mt.year, mt.month;

-- 연간 계획 뷰
CREATE VIEW annual_plan_view AS
SELECT 
    year,
    COUNT(DISTINCT month) as total_months,
    STRING_AGG(
        month || '월: ' || theme, 
        E'\n' ORDER BY month
    ) as yearly_themes
FROM monthly_themes
GROUP BY year
ORDER BY year;

-- =====================================
-- STEP 7: 확인
-- =====================================

-- 월별 캠페인 현황 확인
SELECT * FROM monthly_campaign_overview WHERE year = 2025;

-- 7월 상세 확인
SELECT 
    '=== 2025년 7월 현황 ===' as title
UNION ALL
SELECT 
    '테마: ' || theme FROM monthly_themes WHERE year = 2025 AND month = 7
UNION ALL
SELECT 
    '캠페인 수: ' || COUNT(*)::TEXT FROM marketing_campaigns WHERE year = 2025 AND month = 7
UNION ALL
SELECT 
    '콘텐츠 수: ' || COUNT(*)::TEXT FROM content_ideas 
    WHERE EXTRACT(YEAR FROM scheduled_date) = 2025 
    AND EXTRACT(MONTH FROM scheduled_date) = 7;