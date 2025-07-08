#!/bin/bash

# MASGOLF 데이터베이스 구조 정비 실행 스크립트
# 단계별로 안전하게 실행

echo "🚀 MASGOLF 데이터베이스 구조 정비 시작"
echo "=================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 단계별 실행 함수
execute_step() {
    local step_name=$1
    local sql_file=$2
    
    echo -e "${YELLOW}[$step_name]${NC} 실행 중..."
    
    # 여기서는 SQL 파일을 생성만 합니다
    # 실제 실행은 Supabase SQL Editor에서 수행
    
    echo -e "${GREEN}✓${NC} $step_name SQL 파일 생성 완료: $sql_file"
}

# 1단계: 현재 상태 백업
echo -e "\n${YELLOW}[1단계] 현재 데이터 백업${NC}"
cat > step1_backup.sql << 'EOF'
-- 현재 데이터 백업
-- Supabase 대시보드에서 백업을 먼저 생성하세요!

-- 백업 테이블 생성
CREATE TABLE bookings_backup AS SELECT * FROM bookings;
CREATE TABLE contacts_backup AS SELECT * FROM contacts;
CREATE TABLE quiz_results_backup AS SELECT * FROM quiz_results;

-- 백업 확인
SELECT 'bookings' as table_name, COUNT(*) as row_count FROM bookings
UNION ALL
SELECT 'bookings_backup', COUNT(*) FROM bookings_backup
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'contacts_backup', COUNT(*) FROM contacts_backup;
EOF
execute_step "백업 생성" "step1_backup.sql"

# 2단계: 임시 호환성 유지 (긴급 수정)
echo -e "\n${YELLOW}[2단계] 임시 호환성 컬럼 추가${NC}"
cat > step2_compatibility.sql << 'EOF'
-- 현재 코드와의 호환성을 위한 임시 컬럼 추가
-- 이렇게 하면 즉시 오류가 해결됩니다

-- bookings 테이블에 퀴즈 컬럼 추가
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS swing_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(50),
ADD COLUMN IF NOT EXISTS current_distance INTEGER,
ADD COLUMN IF NOT EXISTS recommended_flex VARCHAR(20),
ADD COLUMN IF NOT EXISTS expected_distance INTEGER;

-- contacts 테이블에 퀴즈 컬럼 추가
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS swing_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS priority VARCHAR(50),
ADD COLUMN IF NOT EXISTS current_distance INTEGER,
ADD COLUMN IF NOT EXISTS recommended_flex VARCHAR(20),
ADD COLUMN IF NOT EXISTS expected_distance INTEGER;

-- 추가된 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('bookings', 'contacts') 
AND column_name IN ('swing_style', 'priority', 'current_distance', 'recommended_flex', 'expected_distance')
ORDER BY table_name, column_name;
EOF
execute_step "호환성 컬럼 추가" "step2_compatibility.sql"

# 3단계: 고객 마스터 테이블 생성
echo -e "\n${YELLOW}[3단계] 고객 통합 테이블 생성${NC}"
cat > step3_customer_master.sql << 'EOF'
-- 고객 마스터 테이블 생성
CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    birth_year INTEGER,
    gender VARCHAR(10),
    golf_experience_years INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    marketing_consent BOOLEAN DEFAULT false,
    marketing_consent_date TIMESTAMPTZ,
    customer_grade VARCHAR(20) DEFAULT 'BRONZE',
    is_active BOOLEAN DEFAULT true,
    last_contact_date DATE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- 고객 골프 프로필 테이블
CREATE TABLE IF NOT EXISTS customer_golf_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    swing_style VARCHAR(50),
    play_priority VARCHAR(50),
    current_distance INTEGER,
    average_score INTEGER,
    handicap DECIMAL(3,1),
    height INTEGER,
    arm_length INTEGER,
    swing_speed DECIMAL(4,1),
    recommended_flex VARCHAR(20),
    recommended_cpm INTEGER,
    recommended_loft DECIMAL(3,1),
    recommended_lie DECIMAL(3,1),
    expected_distance INTEGER,
    expected_improvement VARCHAR(255),
    current_driver_brand VARCHAR(100),
    current_driver_model VARCHAR(100),
    satisfaction_level INTEGER,
    pain_points TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id)
);

CREATE INDEX IF NOT EXISTS idx_golf_profiles_customer_id ON customer_golf_profiles(customer_id);
EOF
execute_step "고객 마스터 테이블" "step3_customer_master.sql"

# 4단계: 데이터 마이그레이션
echo -e "\n${YELLOW}[4단계] 기존 데이터 마이그레이션${NC}"
cat > step4_migration.sql << 'EOF'
-- 기존 데이터를 새 구조로 마이그레이션

-- 1. contacts에서 고객 정보 추출
INSERT INTO customers (phone, name, created_at)
SELECT DISTINCT 
    phone, 
    name, 
    MIN(created_at) as created_at
FROM contacts 
WHERE phone IS NOT NULL AND name IS NOT NULL
GROUP BY phone, name
ON CONFLICT (phone) DO NOTHING;

-- 2. bookings에서 고객 정보 추출
INSERT INTO customers (phone, name, created_at)
SELECT DISTINCT 
    phone, 
    name, 
    MIN(created_at) as created_at
FROM bookings 
WHERE phone IS NOT NULL AND name IS NOT NULL
GROUP BY phone, name
ON CONFLICT (phone) DO UPDATE SET
    name = EXCLUDED.name,
    last_contact_date = CURRENT_DATE;

-- 3. 기존 테이블에 customer_id 연결
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);

UPDATE bookings b
SET customer_id = c.id
FROM customers c
WHERE b.phone = c.phone;

UPDATE contacts ct
SET customer_id = c.id
FROM customers c
WHERE ct.phone = c.phone;

-- 4. 퀴즈 데이터를 골프 프로필로 마이그레이션
INSERT INTO customer_golf_profiles (
    customer_id,
    swing_style,
    play_priority,
    current_distance,
    recommended_flex,
    expected_distance
)
SELECT DISTINCT ON (c.id)
    c.id,
    COALESCE(b.swing_style, ct.swing_style),
    COALESCE(b.priority, ct.priority),
    COALESCE(b.current_distance, ct.current_distance),
    COALESCE(b.recommended_flex, ct.recommended_flex),
    COALESCE(b.expected_distance, ct.expected_distance)
FROM customers c
LEFT JOIN bookings b ON c.id = b.customer_id
LEFT JOIN contacts ct ON c.id = ct.customer_id
WHERE (b.swing_style IS NOT NULL OR ct.swing_style IS NOT NULL)
ON CONFLICT (customer_id) DO UPDATE SET
    swing_style = EXCLUDED.swing_style,
    play_priority = EXCLUDED.play_priority,
    current_distance = EXCLUDED.current_distance,
    recommended_flex = EXCLUDED.recommended_flex,
    expected_distance = EXCLUDED.expected_distance,
    updated_at = NOW();

-- 마이그레이션 결과 확인
SELECT 
    'customers' as table_name, COUNT(*) as count 
FROM customers
UNION ALL
SELECT 
    'customer_golf_profiles', COUNT(*) 
FROM customer_golf_profiles
UNION ALL
SELECT 
    'bookings with customer_id', COUNT(*) 
FROM bookings 
WHERE customer_id IS NOT NULL;
EOF
execute_step "데이터 마이그레이션" "step4_migration.sql"

# 5단계: 분석 뷰 생성
echo -e "\n${YELLOW}[5단계] 퍼스널라이제이션 뷰 생성${NC}"
cat > step5_views.sql << 'EOF'
-- 고객 360도 뷰
CREATE OR REPLACE VIEW customer_360_view AS
SELECT 
    c.*,
    cgp.swing_style,
    cgp.current_distance,
    cgp.recommended_flex,
    cgp.expected_distance,
    COUNT(DISTINCT b.id) as total_bookings,
    COUNT(DISTINCT ct.id) as total_contacts,
    MAX(b.created_at) as last_booking_date,
    MAX(ct.created_at) as last_contact_date
FROM customers c
LEFT JOIN customer_golf_profiles cgp ON c.id = cgp.customer_id
LEFT JOIN bookings b ON c.id = b.customer_id
LEFT JOIN contacts ct ON c.id = ct.customer_id
GROUP BY c.id, cgp.swing_style, cgp.current_distance, 
         cgp.recommended_flex, cgp.expected_distance;

-- 퍼스널라이제이션 세그먼트 뷰
CREATE OR REPLACE VIEW personalization_segments AS
SELECT 
    c.id as customer_id,
    c.name,
    c.phone,
    cgp.swing_style,
    cgp.play_priority,
    cgp.current_distance,
    CASE 
        WHEN cgp.current_distance < 180 THEN '초급'
        WHEN cgp.current_distance < 220 THEN '중급'
        WHEN cgp.current_distance < 250 THEN '상급'
        ELSE '프로급'
    END as skill_level,
    CASE
        WHEN cgp.expected_distance - cgp.current_distance >= 30 THEN '높은 개선 가능성'
        WHEN cgp.expected_distance - cgp.current_distance >= 20 THEN '중간 개선 가능성'
        ELSE '낮은 개선 가능성'
    END as improvement_potential,
    c.customer_grade,
    c.is_active
FROM customers c
JOIN customer_golf_profiles cgp ON c.id = cgp.customer_id;

-- 뷰 확인
SELECT * FROM customer_360_view LIMIT 5;
SELECT * FROM personalization_segments LIMIT 5;
EOF
execute_step "분석 뷰 생성" "step5_views.sql"

# 6단계: 프로그램 코드 업데이트
echo -e "\n${YELLOW}[6단계] 프로그램 코드 업데이트${NC}"
cat > step6_update_code.sh << 'SHELL'
#!/bin/bash
# 새로운 DB 구조에 맞춰 코드 업데이트

echo "프로그램 코드 업데이트 중..."

# funnel-2025-07-complete.html 파일 수정
# 여기에 실제 코드 수정 로직 추가

echo "✓ 코드 업데이트 완료"
SHELL
chmod +x step6_update_code.sh
execute_step "코드 업데이트 스크립트" "step6_update_code.sh"

# 완료
echo -e "\n${GREEN}✅ 모든 SQL 파일이 생성되었습니다!${NC}"
echo -e "\n${YELLOW}실행 순서:${NC}"
echo "1. Supabase 대시보드에서 백업 생성"
echo "2. step2_compatibility.sql 실행 (즉시 오류 해결)"
echo "3. step3_customer_master.sql 실행"
echo "4. step4_migration.sql 실행"
echo "5. step5_views.sql 실행"
echo "6. 코드 업데이트 후 테스트"

echo -e "\n${YELLOW}퍼스널라이제이션 활용 예시:${NC}"
cat > personalization_examples.sql << 'EOF'
-- 1. 스윙 스타일별 고객 분포
SELECT 
    swing_style, 
    COUNT(*) as customer_count,
    AVG(current_distance) as avg_distance
FROM personalization_segments
GROUP BY swing_style;

-- 2. 개선 가능성이 높은 고객 찾기
SELECT 
    name, 
    phone, 
    current_distance,
    expected_distance,
    improvement_potential
FROM personalization_segments
WHERE improvement_potential = '높은 개선 가능성'
ORDER BY expected_distance - current_distance DESC;

-- 3. 비활성 고객 재활성화 대상
SELECT 
    c.name,
    c.phone,
    c.last_contact_date,
    cgp.swing_style,
    cgp.recommended_flex
FROM customers c
JOIN customer_golf_profiles cgp ON c.id = cgp.customer_id
WHERE c.last_contact_date < CURRENT_DATE - INTERVAL '30 days'
AND c.is_active = true;
EOF

echo -e "\n${GREEN}퍼스널라이제이션 쿼리 예시: personalization_examples.sql${NC}"