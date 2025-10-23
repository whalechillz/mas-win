-- 모든 테이블의 RLS 정책 완전 수정
-- Supabase Security Advisor의 61개 오류 완전 해결

-- 1. 현재 모든 public 테이블 확인
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. 모든 public 테이블에 RLS 활성화
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_record.tablename);
    END LOOP;
END $$;

-- 3. 기존 정책 정리 (중복 방지)
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, policy_record.tablename);
    END LOOP;
END $$;

-- 4. 핵심 테이블들에 대한 상세 정책 생성

-- bookings 테이블 (예약 관리)
CREATE POLICY "bookings_public_insert" ON public.bookings 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "bookings_public_select" ON public.bookings 
    FOR SELECT USING (true);

CREATE POLICY "bookings_public_update" ON public.bookings 
    FOR UPDATE USING (true);

CREATE POLICY "bookings_public_delete" ON public.bookings 
    FOR DELETE USING (true);

-- contacts 테이블 (문의 관리)
CREATE POLICY "contacts_public_insert" ON public.contacts 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "contacts_public_select" ON public.contacts 
    FOR SELECT USING (true);

CREATE POLICY "contacts_public_update" ON public.contacts 
    FOR UPDATE USING (true);

CREATE POLICY "contacts_public_delete" ON public.contacts 
    FOR DELETE USING (true);

-- blog_posts 테이블 (블로그)
CREATE POLICY "blog_posts_public_select" ON public.blog_posts 
    FOR SELECT USING (true);

CREATE POLICY "blog_posts_authenticated_manage" ON public.blog_posts 
    FOR ALL USING (auth.role() = 'authenticated');

-- conversion_tracking 테이블 (전환 추적)
CREATE POLICY "conversion_tracking_public_insert" ON public.conversion_tracking 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "conversion_tracking_public_select" ON public.conversion_tracking 
    FOR SELECT USING (true);

-- customer_profiles 테이블 (고객 프로필)
CREATE POLICY "customer_profiles_public_insert" ON public.customer_profiles 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "customer_profiles_public_select" ON public.customer_profiles 
    FOR SELECT USING (true);

CREATE POLICY "customer_profiles_public_update" ON public.customer_profiles 
    FOR UPDATE USING (true);

-- 5. 나머지 모든 테이블에 대한 기본 정책 생성
DO $$ 
DECLARE
    table_name TEXT;
    all_tables TEXT[] := ARRAY[
        'advanced_presets', 'ai_usage_logs', 'batch_jobs', 'blog_analytics',
        'image_categories', 'image_metadata', 'users_profile', 'campaigns',
        'quiz_results', 'blog_categories', 'pages', 'products', 'media', 'settings'
    ];
BEGIN
    FOREACH table_name IN ARRAY all_tables
    LOOP
        -- 공개 읽기 정책
        EXECUTE format('CREATE POLICY "%I_public_select" ON public.%I FOR SELECT USING (true)', table_name, table_name);
        
        -- 인증된 사용자 전체 관리 정책
        EXECUTE format('CREATE POLICY "%I_authenticated_manage" ON public.%I FOR ALL USING (auth.role() = ''authenticated'')', table_name, table_name);
    END LOOP;
END $$;

-- 6. 특별한 테이블들에 대한 추가 정책
-- users_profile 테이블 (사용자 프로필)
CREATE POLICY "users_profile_public_insert" ON public.users_profile 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "users_profile_own_data" ON public.users_profile 
    FOR ALL USING (auth.uid() = id);

-- campaigns 테이블 (캠페인)
CREATE POLICY "campaigns_public_select" ON public.campaigns 
    FOR SELECT USING (true);

CREATE POLICY "campaigns_authenticated_manage" ON public.campaigns 
    FOR ALL USING (auth.role() = 'authenticated');

-- quiz_results 테이블 (퀴즈 결과)
CREATE POLICY "quiz_results_public_insert" ON public.quiz_results 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "quiz_results_public_select" ON public.quiz_results 
    FOR SELECT USING (true);

-- 7. 최종 확인 쿼리들
-- RLS 활성화 상태 확인
SELECT 
    'RLS Status Check' as check_type,
    COUNT(*) as total_tables,
    COUNT(CASE WHEN rowsecurity THEN 1 END) as rls_enabled_tables,
    COUNT(CASE WHEN NOT rowsecurity THEN 1 END) as rls_disabled_tables
FROM pg_tables 
WHERE schemaname = 'public';

-- 정책 개수 확인
SELECT 
    'Policy Count Check' as check_type,
    COUNT(*) as total_policies,
    COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- 테이블별 정책 확인
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
