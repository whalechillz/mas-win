-- 통합 마케팅 시스템 데이터베이스 스키마
-- 기획서에 따른 새로운 테이블 생성

-- 1. 월별 퍼널 계획 테이블
CREATE TABLE IF NOT EXISTS monthly_funnel_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  theme VARCHAR(255),
  funnel_data JSONB NOT NULL DEFAULT '{
    "stages": {
      "awareness": {
        "goal": "",
        "channels": [],
        "expectedReach": 0
      },
      "interest": {
        "goal": "",
        "channels": [],
        "expectedCTR": 0
      },
      "consideration": {
        "goal": "",
        "landingPageUrl": "",
        "expectedConversion": 0
      },
      "purchase": {
        "goal": "",
        "promotions": [],
        "expectedRevenue": 0
      }
    }
  }'::jsonb,
  status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- 2. 퍼널 페이지 테이블
CREATE TABLE IF NOT EXISTS funnel_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_plan_id UUID REFERENCES monthly_funnel_plans(id) ON DELETE CASCADE,
  page_data JSONB NOT NULL DEFAULT '{
    "mainImage": {
      "path": "",
      "prompt": "",
      "generatedBy": "manual"
    },
    "subImages": [],
    "content": {
      "headline": "",
      "subheadline": "",
      "cta": "",
      "benefits": []
    }
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 생성된 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS generated_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_plan_id UUID REFERENCES monthly_funnel_plans(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('blog', 'kakao', 'sms', 'email', 'instagram')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  validation_score JSONB DEFAULT '{
    "seoScore": 0,
    "readability": 0,
    "brandConsistency": 0,
    "channelOptimization": 0,
    "suggestions": []
  }'::jsonb,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 월별 KPI 테이블
CREATE TABLE IF NOT EXISTS monthly_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  kpi_data JSONB NOT NULL DEFAULT '{
    "channels": {
      "blog": {
        "target": 0,
        "actual": 0,
        "posts": 0,
        "engagement": 0,
        "conversion": 0
      },
      "kakao": {
        "target": 0,
        "actual": 0,
        "posts": 0,
        "engagement": 0,
        "conversion": 0
      },
      "sms": {
        "target": 0,
        "actual": 0,
        "posts": 0,
        "engagement": 0,
        "conversion": 0
      },
      "email": {
        "target": 0,
        "actual": 0,
        "posts": 0,
        "engagement": 0,
        "conversion": 0
      },
      "instagram": {
        "target": 0,
        "actual": 0,
        "posts": 0,
        "engagement": 0,
        "conversion": 0
      }
    },
    "employees": [],
    "overall": {
      "roi": 0,
      "efficiency": 0,
      "recommendations": []
    }
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- 인덱스 생성
CREATE INDEX idx_monthly_funnel_plans_year_month ON monthly_funnel_plans(year, month);
CREATE INDEX idx_monthly_funnel_plans_status ON monthly_funnel_plans(status);
CREATE INDEX idx_funnel_pages_funnel_plan_id ON funnel_pages(funnel_plan_id);
CREATE INDEX idx_generated_contents_funnel_plan_id ON generated_contents(funnel_plan_id);
CREATE INDEX idx_generated_contents_channel ON generated_contents(channel);
CREATE INDEX idx_generated_contents_status ON generated_contents(status);
CREATE INDEX idx_monthly_kpis_year_month ON monthly_kpis(year, month);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_monthly_funnel_plans_updated_at 
  BEFORE UPDATE ON monthly_funnel_plans 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnel_pages_updated_at 
  BEFORE UPDATE ON funnel_pages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_contents_updated_at 
  BEFORE UPDATE ON generated_contents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_kpis_updated_at 
  BEFORE UPDATE ON monthly_kpis 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 비활성화
ALTER TABLE monthly_funnel_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_contents DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_kpis DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON monthly_funnel_plans TO anon, authenticated, service_role;
GRANT ALL ON funnel_pages TO anon, authenticated, service_role;
GRANT ALL ON generated_contents TO anon, authenticated, service_role;
GRANT ALL ON monthly_kpis TO anon, authenticated, service_role;

-- View: 월별 통합 대시보드
CREATE OR REPLACE VIEW integrated_marketing_dashboard AS
SELECT 
  mfp.year,
  mfp.month,
  mfp.theme,
  mfp.status as funnel_status,
  COUNT(DISTINCT fp.id) as page_count,
  COUNT(DISTINCT gc.id) as content_count,
  COUNT(DISTINCT CASE WHEN gc.status = 'published' THEN gc.id END) as published_content_count,
  mk.kpi_data
FROM monthly_funnel_plans mfp
LEFT JOIN funnel_pages fp ON mfp.id = fp.funnel_plan_id
LEFT JOIN generated_contents gc ON mfp.id = gc.funnel_plan_id
LEFT JOIN monthly_kpis mk ON mfp.year = mk.year AND mfp.month = mk.month
GROUP BY mfp.year, mfp.month, mfp.theme, mfp.status, mk.kpi_data
ORDER BY mfp.year DESC, mfp.month DESC;

GRANT SELECT ON integrated_marketing_dashboard TO anon, authenticated, service_role;

-- 샘플 데이터 (2025년 7월)
INSERT INTO monthly_funnel_plans (year, month, theme, funnel_data, status)
VALUES (
  2025,
  7,
  '여름 프로모션',
  '{
    "stages": {
      "awareness": {
        "goal": "브랜드 인지도 향상",
        "channels": ["instagram", "blog"],
        "expectedReach": 50000
      },
      "interest": {
        "goal": "제품 관심도 증가",
        "channels": ["kakao", "email"],
        "expectedCTR": 3.5
      },
      "consideration": {
        "goal": "구매 고려 유도",
        "landingPageUrl": "/summer-promotion",
        "expectedConversion": 2.5
      },
      "purchase": {
        "goal": "매출 증대",
        "promotions": ["여름 특가 30% 할인", "무료 배송"],
        "expectedRevenue": 15000000
      }
    }
  }'::jsonb,
  'planning'
) ON CONFLICT (year, month) DO NOTHING;