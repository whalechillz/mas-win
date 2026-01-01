-- 카카오 친구 전화번호 → UUID 매핑 테이블
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS kakao_friend_mappings (
  uuid VARCHAR(100) PRIMARY KEY,
  phone VARCHAR(20),
  nickname VARCHAR(200),
  thumbnail_image TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 전화번호 인덱스 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_kakao_friend_mappings_phone 
ON kakao_friend_mappings(phone);

-- 동기화 시간 인덱스
CREATE INDEX IF NOT EXISTS idx_kakao_friend_mappings_synced_at 
ON kakao_friend_mappings(synced_at);

-- 전화번호 유니크 제약 (선택사항 - 전화번호가 중복될 수 있으므로 제거)
-- ALTER TABLE kakao_friend_mappings ADD CONSTRAINT unique_phone UNIQUE (phone);

COMMENT ON TABLE kakao_friend_mappings IS '카카오 친구 전화번호와 UUID 매핑 테이블';
COMMENT ON COLUMN kakao_friend_mappings.uuid IS '카카오 친구 UUID (Primary Key)';
COMMENT ON COLUMN kakao_friend_mappings.phone IS '전화번호 (정규화된 형식: 숫자만)';
COMMENT ON COLUMN kakao_friend_mappings.nickname IS '카카오 친구 닉네임';
COMMENT ON COLUMN kakao_friend_mappings.thumbnail_image IS '프로필 썸네일 이미지 URL';
COMMENT ON COLUMN kakao_friend_mappings.synced_at IS '마지막 동기화 시간';

