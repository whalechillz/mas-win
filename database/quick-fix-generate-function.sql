-- 간단한 버전의 멀티채널 콘텐츠 생성 함수
CREATE OR REPLACE FUNCTION generate_monthly_content_selective(
    p_year INTEGER,
    p_month INTEGER,
    p_channels JSONB DEFAULT '{"blog": true, "kakao": true, "sms": true, "instagram": true, "youtube": true}'::jsonb
)
RETURNS JSON AS $$
DECLARE
    v_content_count INTEGER := 0;
BEGIN
    -- 블로그 콘텐츠 (3개)
    INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
    VALUES 
    ('7월 무더위 골프 극복법', '여름철 라운딩 팁을 소개합니다.', 'blog', 'idea', '제이', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-05'), '여름골프,팁'),
    ('신상품 드라이버 리뷰', '최신 드라이버를 상세히 리뷰합니다.', 'blog', 'idea', '제이', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-15'), '신상품,리뷰'),
    ('프로들의 여름 골프 스타일', '프로 골퍼들의 여름 패션을 소개합니다.', 'blog', 'idea', '제이', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-25'), '패션,여름');
    
    v_content_count := 3;
    
    -- 카카오톡 콘텐츠 (4개)
    INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
    VALUES 
    ('[마스골프] 7월 특가 시작!', '여름 골프용품 30% 할인', 'kakao', 'idea', '스테피', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01'), '특가,프로모션'),
    ('[마스골프] 쿨링 제품 입고', '무더위 필수템 입고 안내', 'kakao', 'idea', '스테피', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-08'), '신상품,여름'),
    ('[마스골프] 주말 이벤트', '선착순 100명 경품 이벤트', 'kakao', 'idea', '나과장', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-15'), '이벤트,주말'),
    ('[마스골프] 월말 세일', '7월 마지막 기회!', 'kakao', 'idea', '나과장', 
     DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-28'), '세일,마감');
    
    v_content_count := v_content_count + 4;
    
    RETURN json_build_object(
        'success', true,
        'message', p_year || '년 ' || p_month || '월 콘텐츠 ' || v_content_count || '개가 생성되었습니다.',
        'content_count', v_content_count
    );
END;
$$ LANGUAGE plpgsql;
