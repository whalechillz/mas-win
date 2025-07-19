-- Supabase SQL Editor에서 직접 실행하는 통합 마케팅 스키마
-- 기존 테이블이 있으면 삭제하고 새로 생성 (주의: 데이터가 삭제됩니다)

-- 기존 테이블 삭제 (역순으로)
DROP TABLE IF EXISTS generated_contents CASCADE;
DROP TABLE IF EXISTS funnel_pages CASCADE;
DROP TABLE IF EXISTS monthly_funnel_plans CASCADE;
DROP TABLE IF EXISTS monthly_kpis CASCADE;
DROP VIEW IF EXISTS integrated_marketing_dashboard CASCADE;

-- 이제 integrated-marketing-schema.sql 내용을 붙여넣으세요
