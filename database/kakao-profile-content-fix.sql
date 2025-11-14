-- kakao_profile_content 테이블에 누락된 기본 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE kakao_profile_content 
ADD COLUMN IF NOT EXISTS background_prompt TEXT,
ADD COLUMN IF NOT EXISTS profile_prompt TEXT,
ADD COLUMN IF NOT EXISTS background_image_url TEXT,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planned',
ADD COLUMN IF NOT EXISTS created BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

