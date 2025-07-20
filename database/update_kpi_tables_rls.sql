-- KPI 관리를 위한 테이블 생성 스크립트

-- 월별 KPI 데이터 테이블 (이미 존재하므로 생략)
-- CREATE TABLE IF NOT EXISTS monthly_kpis (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   year INTEGER NOT NULL,
--   month INTEGER NOT NULL,
--   kpi_data JSONB NOT NULL DEFAULT '{}'::jsonb,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   UNIQUE(year, month)
-- );

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_monthly_kpis_year_month ON monthly_kpis(year, month);

-- RLS (Row Level Security) 활성화
ALTER TABLE monthly_kpis ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (있을 경우)
DROP POLICY IF EXISTS "Admin can view all KPI data" ON monthly_kpis;
DROP POLICY IF EXISTS "Admin can insert KPI data" ON monthly_kpis;
DROP POLICY IF EXISTS "Admin can update KPI data" ON monthly_kpis;
DROP POLICY IF EXISTS "Admin can delete KPI data" ON monthly_kpis;

-- 관리자만 접근 가능한 정책
CREATE POLICY "Admin can view all KPI data" ON monthly_kpis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.email()
      AND team_members.role = 'admin'
    )
  );

CREATE POLICY "Admin can insert KPI data" ON monthly_kpis
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.email()
      AND team_members.role = 'admin'
    )
  );

CREATE POLICY "Admin can update KPI data" ON monthly_kpis
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.email()
      AND team_members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.email()
      AND team_members.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete KPI data" ON monthly_kpis
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.email = auth.email()
      AND team_members.role = 'admin'
    )
  );

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS update_monthly_kpis_updated_at ON monthly_kpis;
CREATE TRIGGER update_monthly_kpis_updated_at BEFORE UPDATE
  ON monthly_kpis FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();