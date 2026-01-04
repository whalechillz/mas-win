-- 카카오 수신자 그룹 관리 테이블
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS kakao_recipient_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  recipient_uuids JSONB, -- UUID 배열 또는 전화번호 배열
  recipient_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 그룹 이름 인덱스
CREATE INDEX IF NOT EXISTS idx_kakao_recipient_groups_name 
ON kakao_recipient_groups(name);

-- 활성 그룹 인덱스
CREATE INDEX IF NOT EXISTS idx_kakao_recipient_groups_active 
ON kakao_recipient_groups(is_active);

COMMENT ON TABLE kakao_recipient_groups IS '카카오 수신자 그룹 관리 테이블';
COMMENT ON COLUMN kakao_recipient_groups.name IS '그룹 이름';
COMMENT ON COLUMN kakao_recipient_groups.description IS '그룹 설명';
COMMENT ON COLUMN kakao_recipient_groups.recipient_uuids IS '수신자 UUID 또는 전화번호 배열 (JSONB)';
COMMENT ON COLUMN kakao_recipient_groups.recipient_count IS '수신자 수';
COMMENT ON COLUMN kakao_recipient_groups.is_active IS '활성 여부';




