-- 관리자 사용자 테이블 구조 개선 마이그레이션
-- 실행 전 백업 권장

-- 1. 기존 admin_users 테이블 구조 확인 및 필요한 컬럼 추가
DO $$
BEGIN
  -- last_login 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN last_login TIMESTAMPTZ;
  END IF;

  -- is_active 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- updated_at 컬럼이 없으면 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE admin_users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_admin_users_phone ON admin_users(phone);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- 3. 기존 데이터의 is_active를 true로 설정 (NULL인 경우)
UPDATE admin_users SET is_active = true WHERE is_active IS NULL;

-- 4. updated_at 트리거 생성 (자동 업데이트)
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_admin_users_updated_at ON admin_users;
CREATE TRIGGER trigger_update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- 5. 기존 사용자들의 last_login을 created_at으로 설정 (NULL인 경우)
UPDATE admin_users 
SET last_login = created_at 
WHERE last_login IS NULL AND created_at IS NOT NULL;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '마이그레이션 완료: admin_users 테이블 구조 개선됨';
END $$;

