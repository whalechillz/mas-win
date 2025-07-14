-- 멀티채널 콘텐츠 자동 생성 함수 (간단한 템플릿 기반)
CREATE OR REPLACE FUNCTION generate_monthly_content(
    p_year INTEGER,
    p_month INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_theme_record RECORD;
    v_content_count INTEGER := 0;
    v_result JSON;
BEGIN
    -- 해당 월의 테마 가져오기
    SELECT * INTO v_theme_record
    FROM monthly_themes
    WHERE year = p_year AND month = p_month;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', '해당 월의 테마가 설정되지 않았습니다.'
        );
    END IF;
    
    -- 기존 콘텐츠 삭제 옵션 (중복 방지)
    DELETE FROM content_ideas
    WHERE scheduled_date >= DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01')
    AND scheduled_date < DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01') + INTERVAL '1 month';
    
    -- 블로그 콘텐츠 생성 (3개)
    INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
    VALUES 
    (v_theme_record.theme || ' - 이달의 추천 상품', 
     '이번 달 테마에 맞는 베스트 상품을 소개합니다.', 
     'blog', 'idea', '제이', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-05'),
     v_theme_record.theme || ',추천상품,베스트'),
     
    (v_theme_record.theme || ' - 프로 팁 공개', 
     '프로들이 알려주는 꿀팁을 공개합니다.', 
     'blog', 'idea', '제이', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-15'),
     v_theme_record.theme || ',프로팁,레슨'),
     
    (v_theme_record.theme || ' - 고객 후기 모음', 
     '이번 달 고객님들의 생생한 후기입니다.', 
     'blog', 'idea', '제이', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-25'),
     v_theme_record.theme || ',고객후기,리뷰');
    
    v_content_count := v_content_count + 3;
    
    -- 카카오톡 콘텐츠 생성 (4개)
    INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
    VALUES 
    ('[마스골프] ' || v_theme_record.theme || ' 시작!', 
     v_theme_record.promotion_details, 
     'kakao', 'idea', '스테피', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01'),
     v_theme_record.theme || ',프로모션시작'),
     
    ('[마스골프] 이번 주 특가 상품', 
     '주간 특가 상품 안내', 
     'kakao', 'idea', '스테피', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-08'),
     v_theme_record.theme || ',주간특가'),
     
    ('[마스골프] 중간 점검 이벤트', 
     '참여하고 선물 받아가세요!', 
     'kakao', 'idea', '나과장', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-15'),
     v_theme_record.theme || ',이벤트'),
     
    ('[마스골프] 마지막 기회!', 
     '이번 달 프로모션 마감 임박', 
     'kakao', 'idea', '나과장', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-28'),
     v_theme_record.theme || ',마감임박');
    
    v_content_count := v_content_count + 4;
    
    -- SMS 콘텐츠 생성 (2개)
    INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
    VALUES 
    ('[마스골프] ' || SUBSTRING(v_theme_record.theme, 1, 10) || '..', 
     '쿠폰번호: ' || UPPER(LEFT(REPLACE(v_theme_record.theme, ' ', ''), 6)) || p_month::TEXT, 
     'sms', 'idea', '허상원', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01'),
     v_theme_record.theme || ',쿠폰'),
     
    ('[마스골프] 놓치지 마세요!', 
     '특가 마감 D-3', 
     'sms', 'idea', '허상원', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-26'),
     v_theme_record.theme || ',마감알림');
    
    v_content_count := v_content_count + 2;
    
    -- 인스타그램 콘텐츠 생성 (3개)
    INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
    VALUES 
    (v_theme_record.theme || ' 시작! 🎉', 
     '이번 달 특별 이벤트를 소개합니다', 
     'instagram', 'idea', '스테피', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-02'),
     v_theme_record.theme || ',이벤트시작,인스타'),
     
    ('고객 후기 이벤트 📸', 
     '후기 남기고 선물 받아가세요', 
     'instagram', 'idea', '스테피', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-10'),
     v_theme_record.theme || ',후기이벤트,인스타'),
     
    (v_theme_record.theme || ' BEST ITEM', 
     '이번 달 가장 인기있는 상품', 
     'instagram', 'idea', '제이', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-20'),
     v_theme_record.theme || ',베스트상품,인스타');
    
    v_content_count := v_content_count + 3;
    
    -- 유튜브 콘텐츠 생성 (1개)
    INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
    VALUES 
    (v_theme_record.theme || ' - 전문가가 알려주는 꿀팁', 
     '10분 안에 마스터하는 골프 팁', 
     'youtube', 'idea', '허상원', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-15'),
     v_theme_record.theme || ',유튜브,전문가팁');
    
    v_content_count := v_content_count + 1;
    
    -- 결과 반환
    v_result := json_build_object(
        'success', true,
        'message', p_year || '년 ' || p_month || '월 멀티채널 콘텐츠 ' || v_content_count || '개가 생성되었습니다.',
        'theme', v_theme_record.theme,
        'content_count', v_content_count
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 함수 테스트
-- SELECT generate_monthly_content(2025, 12);
