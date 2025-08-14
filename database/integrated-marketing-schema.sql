-- 통합 마케팅 시스템 데이터베이스 스키마

-- 1. 월별 퍼널 계획 테이블
CREATE TABLE IF NOT EXISTS monthly_funnel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  theme VARCHAR(255),
  funnel_data JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'planning',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- 2. 퍼널 페이지 테이블
CREATE TABLE IF NOT EXISTS funnel_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_plan_id UUID REFERENCES monthly_funnel_plans(id) ON DELETE CASCADE,
  page_data JSONB DEFAULT '{}',
  html_path VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 생성된 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS generated_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_plan_id UUID REFERENCES monthly_funnel_plans(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  content TEXT,
  validation_score JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 월별 KPI 테이블
CREATE TABLE IF NOT EXISTS monthly_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  kpi_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- 5. 직원 블로그 할당 테이블
CREATE TABLE IF NOT EXISTS employee_blog_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  quota_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_name, year, month)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_monthly_funnel_plans_year_month ON monthly_funnel_plans(year, month);
CREATE INDEX IF NOT EXISTS idx_funnel_pages_plan_id ON funnel_pages(funnel_plan_id);
CREATE INDEX IF NOT EXISTS idx_generated_contents_plan_id ON generated_contents(funnel_plan_id);
CREATE INDEX IF NOT EXISTS idx_generated_contents_channel ON generated_contents(channel);
CREATE INDEX IF NOT EXISTS idx_monthly_kpis_year_month ON monthly_kpis(year, month);
CREATE INDEX IF NOT EXISTS idx_employee_blog_quotas_employee ON employee_blog_quotas(employee_name, year, month);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_monthly_funnel_plans_updated_at BEFORE UPDATE ON monthly_funnel_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funnel_pages_updated_at BEFORE UPDATE ON funnel_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generated_contents_updated_at BEFORE UPDATE ON generated_contents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_monthly_kpis_updated_at BEFORE UPDATE ON monthly_kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_blog_quotas_updated_at BEFORE UPDATE ON employee_blog_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입
INSERT INTO monthly_funnel_plans (year, month, theme, status) VALUES
(2025, 7, '여름 특별 캠페인', 'active'),
(2025, 8, '휴가철 골프 패키지', 'planning')
ON CONFLICT (year, month) DO NOTHING;

INSERT INTO employee_blog_quotas (employee_name, year, month, quota_count) VALUES
('제이', 2025, 7, 10),
('마스터', 2025, 7, 8),
('싱싱', 2025, 7, 6)
ON CONFLICT (employee_name, year, month) DO NOTHING;

-- 통합 마케팅 대시보드 뷰 생성
CREATE OR REPLACE VIEW integrated_marketing_dashboard AS
SELECT 
  mfp.year,
  mfp.month,
  mfp.theme,
  mfp.status,
  COUNT(DISTINCT fp.id) as funnel_pages_count,
  COUNT(DISTINCT gc.id) as generated_contents_count,
  COUNT(DISTINCT CASE WHEN gc.status = 'validated' THEN gc.id END) as validated_contents_count,
  mk.kpi_data
FROM monthly_funnel_plans mfp
LEFT JOIN funnel_pages fp ON mfp.id = fp.funnel_plan_id
LEFT JOIN generated_contents gc ON mfp.id = gc.funnel_plan_id
LEFT JOIN monthly_kpis mk ON mfp.year = mk.year AND mfp.month = mk.month
GROUP BY mfp.id, mfp.year, mfp.month, mfp.theme, mfp.status, mk.kpi_data
ORDER BY mfp.year DESC, mfp.month DESC;

-- 완료 메시지
SELECT '통합 마케팅 시스템 데이터베이스 스키마가 성공적으로 생성되었습니다!' as message;
