-- 선택적 채널 콘텐츠 생성 함수
CREATE OR REPLACE FUNCTION generate_monthly_content_selective(
    p_year INTEGER,
    p_month INTEGER,
    p_channels JSONB DEFAULT '{"blog": true, "kakao": true, "sms": true, "instagram": true, "youtube": true}'::jsonb
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
    
    -- 기존 콘텐츠 삭제 (선택한 채널만)
    DELETE FROM content_ideas
    WHERE scheduled_date >= DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01')
    AND scheduled_date < DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01') + INTERVAL '1 month'
    AND platform = ANY(
        SELECT jsonb_object_keys(p_channels) 
        WHERE (p_channels->>jsonb_object_keys(p_channels))::boolean = true
    );
    
    -- 블로그 콘텐츠 생성 (선택된 경우만)
    IF (p_channels->>'blog')::boolean THEN
        INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
        VALUES 
        (v_theme_record.theme || ' - 이달의 추천 상품', 
         '이번 달 테마에 맞는 베스트 상품을 소개합니다.', 
         'blog', 'idea', '제이', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-05'),
         v_theme_record.theme || ',추천상품'),
         
        (v_theme_record.theme || ' - 전문가 팁', 
         '프로들이 알려주는 꿀팁입니다.', 
         'blog', 'idea', '제이', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-15'),
         v_theme_record.theme || ',팁'),
         
        (v_theme_record.theme || ' - 고객 후기', 
         '실제 고객님들의 생생한 후기입니다.', 
         'blog', 'idea', '제이', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-25'),
         v_theme_record.theme || ',후기');
        
        v_content_count := v_content_count + 3;
    END IF;
    
    -- 카카오톡 콘텐츠 생성 (선택된 경우만)
    IF (p_channels->>'kakao')::boolean THEN
        INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
        VALUES 
        ('[마스골프] ' || v_theme_record.theme || ' 시작!', 
         v_theme_record.promotion_details, 
         'kakao', 'idea', '스테피', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01'),
         v_theme_record.theme || ',프로모션'),
         
        ('[마스골프] 주간 특가', 
         '이번 주 특가 상품 안내', 
         'kakao', 'idea', '스테피', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-08'),
         v_theme_record.theme || ',특가'),
         
        ('[마스골프] 이벤트 안내', 
         '참여하고 선물 받아가세요!', 
         'kakao', 'idea', '나과장', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-15'),
         v_theme_record.theme || ',이벤트'),
         
        ('[마스골프] 마지막 기회!', 
         '이번 달 프로모션 마감 임박', 
         'kakao', 'idea', '나과장', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-28'),
         v_theme_record.theme || ',마감');
        
        v_content_count := v_content_count + 4;
    END IF;
    
    -- SMS 콘텐츠 생성 (선택된 경우만)
    IF (p_channels->>'sms')::boolean THEN
        INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
        VALUES 
        ('[마스골프] 할인코드', 
         '쿠폰: ' || UPPER(LEFT(REPLACE(v_theme_record.theme, ' ', ''), 4)) || p_month::TEXT, 
         'sms', 'idea', '허상원', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01'),
         v_theme_record.theme || ',쿠폰'),
         
        ('[마스골프] 마감 D-3', 
         '특가 마감 임박!', 
         'sms', 'idea', '허상원', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-26'),
         v_theme_record.theme || ',마감');
        
        v_content_count := v_content_count + 2;
    END IF;
    
    -- 인스타그램 콘텐츠 생성 (선택된 경우만)
    IF (p_channels->>'instagram')::boolean THEN
        INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
        VALUES 
        (v_theme_record.theme || ' 시작!', 
         '이번 달 특별 이벤트를 소개합니다', 
         'instagram', 'idea', '스테피', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-02'),
         v_theme_record.theme || ',이벤트'),
         
        ('고객 후기 이벤트', 
         '후기 남기고 선물 받아가세요', 
         'instagram', 'idea', '스테피', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-10'),
         v_theme_record.theme || ',후기'),
         
        (v_theme_record.theme || ' BEST', 
         '이번 달 인기 상품', 
         'instagram', 'idea', '제이', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-20'),
         v_theme_record.theme || ',베스트');
        
        v_content_count := v_content_count + 3;
    END IF;
    
    -- 유튜브 콘텐츠 생성 (선택된 경우만)
    IF (p_channels->>'youtube')::boolean THEN
        INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
        VALUES 
        (v_theme_record.theme || ' - 전문가 리뷰', 
         '10분 안에 마스터하는 팁', 
         'youtube', 'idea', '허상원', 
         DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-15'),
         v_theme_record.theme || ',리뷰');
        
        v_content_count := v_content_count + 1;
    END IF;
    
    -- 결과 반환
    v_result := json_build_object(
        'success', true,
        'message', p_year || '년 ' || p_month || '월 선택된 채널의 콘텐츠 ' || v_content_count || '개가 생성되었습니다.',
        'theme', v_theme_record.theme,
        'content_count', v_content_count,
        'channels_used', p_channels
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 사용 예시
-- 모든 채널 사용
-- SELECT generate_monthly_content_selective(2025, 12);

-- 특정 채널만 사용
-- SELECT generate_monthly_content_selective(2025, 12, '{"blog": true, "kakao": true, "sms": false, "instagram": false, "youtube": false}'::jsonb);
