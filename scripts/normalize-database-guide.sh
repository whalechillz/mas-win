#!/bin/bash

echo "=== win.masgolf.co.kr 데이터베이스 정규화 스크립트 ==="
echo ""
echo "🔧 현재 문제점:"
echo "- quiz_results, bookings, contacts 테이블에 동일한 필드가 중복 저장"
echo "- 데이터 일관성 문제 발생 가능"
echo "- 불필요한 중복 데이터"
echo ""
echo "✅ 해결 방법:"
echo "- quiz_results를 마스터 테이블로 사용"
echo "- bookings와 contacts는 quiz_result_id로 참조"
echo "- 뷰(View)를 사용하여 조인된 데이터 제공"
echo ""
echo "=== 실행 순서 ==="
echo ""
echo "1. 백업 생성 (필수!)"
echo "   - Supabase 대시보드에서 데이터 백업"
echo ""
echo "2. 기존 데이터 마이그레이션 SQL 실행:"

cat << 'SQL1'
-- STEP 1: 기존 데이터를 quiz_results로 마이그레이션
-- contacts의 퀴즈 데이터를 quiz_results로 이동
INSERT INTO quiz_results (name, phone, swing_style, priority, current_distance, campaign_source)
SELECT DISTINCT 
    c.name, 
    c.phone, 
    c.swing_style, 
    c.priority, 
    c.current_distance::varchar,
    COALESCE(c.campaign_source, 'migrated-from-contacts')
FROM contacts c
WHERE c.quiz_result_id IS NULL 
    AND c.swing_style IS NOT NULL
ON CONFLICT (phone) DO NOTHING;

-- contacts 테이블 quiz_result_id 업데이트
UPDATE contacts c
SET quiz_result_id = q.id
FROM quiz_results q
WHERE c.phone = q.phone 
    AND c.quiz_result_id IS NULL;

-- bookings의 퀴즈 데이터를 quiz_results로 이동
INSERT INTO quiz_results (name, phone, swing_style, priority, current_distance, recommended_flex, expected_distance, campaign_source)
SELECT DISTINCT 
    b.name, 
    b.phone, 
    b.swing_style, 
    b.priority, 
    b.current_distance::varchar,
    b.recommended_flex,
    b.expected_distance::varchar,
    COALESCE(b.campaign_source, 'migrated-from-bookings')
FROM bookings b
WHERE b.quiz_result_id IS NULL 
    AND b.swing_style IS NOT NULL
ON CONFLICT (phone) DO UPDATE SET
    swing_style = COALESCE(EXCLUDED.swing_style, quiz_results.swing_style),
    priority = COALESCE(EXCLUDED.priority, quiz_results.priority),
    current_distance = COALESCE(EXCLUDED.current_distance, quiz_results.current_distance),
    recommended_flex = COALESCE(EXCLUDED.recommended_flex, quiz_results.recommended_flex),
    expected_distance = COALESCE(EXCLUDED.expected_distance, quiz_results.expected_distance);

-- bookings 테이블 quiz_result_id 업데이트
UPDATE bookings b
SET quiz_result_id = q.id
FROM quiz_results q
WHERE b.phone = q.phone 
    AND b.quiz_result_id IS NULL;
SQL1

echo ""
echo "3. 뷰(View) 생성 SQL 실행:"

cat << 'SQL2'
-- STEP 2: 조인된 데이터를 위한 뷰 생성
CREATE OR REPLACE VIEW contacts_with_quiz AS
SELECT 
    c.id,
    c.name,
    c.phone,
    c.call_times,
    c.created_at,
    c.contacted,
    c.contacted_at,
    c.notes,
    c.quiz_result_id,
    c.campaign_source,
    -- quiz_results에서 가져온 필드들
    q.swing_style,
    q.priority,
    q.current_distance,
    q.recommended_flex,
    q.expected_distance
FROM contacts c
LEFT JOIN quiz_results q ON c.quiz_result_id = q.id;

CREATE OR REPLACE VIEW bookings_with_quiz AS
SELECT 
    b.id,
    b.name,
    b.phone,
    b.date,
    b.time,
    b.club,
    b.created_at,
    b.status,
    b.memo,
    b.quiz_result_id,
    b.campaign_source,
    -- quiz_results에서 가져온 필드들
    q.swing_style,
    q.priority,
    q.current_distance,
    q.recommended_flex,
    q.expected_distance
FROM bookings b
LEFT JOIN quiz_results q ON b.quiz_result_id = q.id;
SQL2

echo ""
echo "4. 중복 필드 제거 SQL 실행 (주의: 데이터 마이그레이션 후 실행):"

cat << 'SQL3'
-- STEP 3: 중복 필드 제거 (마이그레이션 확인 후 실행!)
ALTER TABLE contacts 
DROP COLUMN IF EXISTS swing_style,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS current_distance;

ALTER TABLE bookings
DROP COLUMN IF EXISTS swing_style,
DROP COLUMN IF EXISTS priority,
DROP COLUMN IF EXISTS current_distance,
DROP COLUMN IF EXISTS recommended_flex,
DROP COLUMN IF EXISTS expected_distance;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_contacts_quiz_result_id ON contacts(quiz_result_id);
CREATE INDEX IF NOT EXISTS idx_bookings_quiz_result_id ON bookings(quiz_result_id);
SQL3

echo ""
echo "5. 코드 변경사항:"
echo "   - admin.tsx: bookings_with_quiz, contacts_with_quiz 뷰 사용"
echo "   - contact-v2.js: quiz_results 테이블에만 퀴즈 데이터 저장"
echo "   - ContactManagement.tsx: 이미 수정됨"
echo ""
echo "6. 서버 재시작:"
echo "   npm run dev"
echo ""
echo "⚠️  주의사항:"
echo "- 반드시 데이터 백업 후 진행"
echo "- SQL은 순서대로 실행"
echo "- 마이그레이션 확인 후 중복 필드 제거"
echo ""
echo "완료!"
