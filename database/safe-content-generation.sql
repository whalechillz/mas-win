-- 중복 방지 버전의 멀티채널 콘텐츠 생성 함수
CREATE OR REPLACE FUNCTION generate_monthly_content_safe(
    p_year INTEGER,
    p_month INTEGER,
    p_channels JSONB DEFAULT '{"blog": true, "kakao": true}'::jsonb,
    p_mode VARCHAR DEFAULT 'skip' -- 'skip', 'append', 'replace'
)
RETURNS JSON AS $$
DECLARE
    v_existing_count INTEGER;
    v_new_count INTEGER := 0;
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    v_start_date := DATE(p_year || '-' || LPAD(p_month::TEXT, 2, '0') || '-01');
    v_end_date := (v_start_date + INTERVAL '1 month')::DATE;
    
    -- 기존 콘텐츠 개수 확인
    SELECT COUNT(*) INTO v_existing_count
    FROM content_ideas
    WHERE scheduled_date >= v_start_date
    AND scheduled_date < v_end_date;
    
    -- 이미 콘텐츠가 있으면
    IF v_existing_count > 0 THEN
        IF p_mode = 'skip' THEN
            RETURN json_build_object(
                'success', false,
                'message', '이미 ' || v_existing_count || '개의 콘텐츠가 있습니다. 기존 콘텐츠를 유지합니다.',
                'existing_count', v_existing_count,
                'action', 'skipped'
            );
        ELSIF p_mode = 'replace' THEN
            -- 기존 콘텐츠 삭제 (status가 'published'가 아닌 것만)
            DELETE FROM content_ideas
            WHERE scheduled_date >= v_start_date
            AND scheduled_date < v_end_date
            AND status != 'published'
            AND platform = ANY(
                SELECT jsonb_object_keys(p_channels) 
                WHERE (p_channels->>jsonb_object_keys(p_channels))::boolean = true
            );
        END IF;
    END IF;
    
    -- 블로그 콘텐츠 생성 (중복 체크)
    IF (p_channels->>'blog')::boolean THEN
        -- 이미 있는지 확인
        IF NOT EXISTS (
            SELECT 1 FROM content_ideas 
            WHERE platform = 'blog' 
            AND scheduled_date >= v_start_date 
            AND scheduled_date < v_end_date
            LIMIT 1
        ) THEN
            INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
            VALUES 
            ('7월 무더위 골프 극복법', '여름철 라운딩 팁', 'blog', 'idea', '제이', v_start_date + 4, '여름골프'),
            ('신상품 드라이버 리뷰', '최신 드라이버 상세 리뷰', 'blog', 'idea', '제이', v_start_date + 14, '신상품'),
            ('프로들의 여름 스타일', '프로 골퍼 패션', 'blog', 'idea', '제이', v_start_date + 24, '패션');
            
            v_new_count := v_new_count + 3;
        END IF;
    END IF;
    
    -- 카카오톡 콘텐츠 생성 (중복 체크)
    IF (p_channels->>'kakao')::boolean THEN
        IF NOT EXISTS (
            SELECT 1 FROM content_ideas 
            WHERE platform = 'kakao' 
            AND scheduled_date >= v_start_date 
            AND scheduled_date < v_end_date
            LIMIT 1
        ) THEN
            INSERT INTO content_ideas (title, content, platform, status, assignee, scheduled_date, tags)
            VALUES 
            ('[마스골프] 7월 특가!', '여름 용품 30% 할인', 'kakao', 'idea', '스테피', v_start_date, '특가'),
            ('[마스골프] 쿨링 제품', '무더위 필수템', 'kakao', 'idea', '스테피', v_start_date + 7, '신상품'),
            ('[마스골프] 주말 이벤트', '선착순 경품', 'kakao', 'idea', '나과장', v_start_date + 14, '이벤트'),
            ('[마스골프] 월말 세일', '마지막 기회!', 'kakao', 'idea', '나과장', v_start_date + 27, '세일');
            
            v_new_count := v_new_count + 4;
        END IF;
    END IF;
    
    -- 결과 반환
    RETURN json_build_object(
        'success', true,
        'message', CASE 
            WHEN v_new_count > 0 THEN v_new_count || '개의 새 콘텐츠가 추가되었습니다.'
            ELSE '새로 추가된 콘텐츠가 없습니다.'
        END,
        'new_count', v_new_count,
        'existing_count', v_existing_count,
        'total_count', v_existing_count + v_new_count
    );
END;
$$ LANGUAGE plpgsql;

-- 사용 예시
-- SELECT generate_monthly_content_safe(2025, 7, '{"blog": true, "kakao": true}'::jsonb, 'skip');
-- SELECT generate_monthly_content_safe(2025, 7, '{"blog": true, "kakao": true}'::jsonb, 'append');
-- SELECT generate_monthly_content_safe(2025, 7, '{"blog": true, "kakao": true}'::jsonb, 'replace');
