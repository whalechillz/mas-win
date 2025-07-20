#!/bin/bash

echo "🚀 통합 마케팅 시스템 빠른 설치 시작..."

# 1. 필요한 디렉토리 생성
echo "📁 디렉토리 생성 중..."
mkdir -p components/admin/marketing/integrated
mkdir -p pages/api/funnel-plans/\[year\]

# 2. 더미 컴포넌트 생성 (빌드 에러 방지)
echo "📝 기본 컴포넌트 생성 중..."

# FunnelPlanManager.tsx
cat > components/admin/marketing/integrated/FunnelPlanManager.tsx << 'EOF'
import React from 'react';

export default function FunnelPlanManager({ year, month }: { year: number; month: number }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
      <h3 className="text-xl font-bold mb-4">퍼널 기획 관리</h3>
      <p className="text-gray-600 dark:text-gray-400">
        {year}년 {month}월 퍼널 기획 - 구현 중...
      </p>
    </div>
  );
}
EOF

# FunnelPageBuilder.tsx
cat > components/admin/marketing/integrated/FunnelPageBuilder.tsx << 'EOF'
import React from 'react';

export default function FunnelPageBuilder({ year, month }: { year: number; month: number }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
      <h3 className="text-xl font-bold mb-4">퍼널 페이지 구성</h3>
      <p className="text-gray-600 dark:text-gray-400">
        {year}년 {month}월 페이지 빌더 - 구현 중...
      </p>
    </div>
  );
}
EOF

# GoogleAdsManager.tsx
cat > components/admin/marketing/integrated/GoogleAdsManager.tsx << 'EOF'
import React from 'react';

export default function GoogleAdsManager({ year, month }: { year: number; month: number }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
      <h3 className="text-xl font-bold mb-4">구글 애드 관리</h3>
      <p className="text-gray-600 dark:text-gray-400">
        {year}년 {month}월 구글 애드 - 구현 중...
      </p>
    </div>
  );
}
EOF

# ContentGenerator.tsx
cat > components/admin/marketing/integrated/ContentGenerator.tsx << 'EOF'
import React from 'react';

export default function ContentGenerator({ year, month }: { year: number; month: number }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
      <h3 className="text-xl font-bold mb-4">AI 콘텐츠 생성</h3>
      <p className="text-gray-600 dark:text-gray-400">
        {year}년 {month}월 콘텐츠 생성 - 구현 중...
      </p>
    </div>
  );
}
EOF

# ContentValidator.tsx
cat > components/admin/marketing/integrated/ContentValidator.tsx << 'EOF'
import React from 'react';

export default function ContentValidator({ year, month }: { year: number; month: number }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
      <h3 className="text-xl font-bold mb-4">콘텐츠 검증</h3>
      <p className="text-gray-600 dark:text-gray-400">
        {year}년 {month}월 콘텐츠 검증 - 구현 중...
      </p>
    </div>
  );
}
EOF

# KPIManager.tsx
cat > components/admin/marketing/integrated/KPIManager.tsx << 'EOF'
import React from 'react';

export default function KPIManager({ year, month }: { year: number; month: number }) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg">
      <h3 className="text-xl font-bold mb-4">KPI 관리</h3>
      <p className="text-gray-600 dark:text-gray-400">
        {year}년 {month}월 KPI 분석 - 구현 중...
      </p>
    </div>
  );
}
EOF

# 3. API 엔드포인트 생성
echo "🔌 API 엔드포인트 생성 중..."

# monthly-themes API
cat > pages/api/admin/monthly-themes.ts << 'EOF'
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { year } = req.query;
  
  // 더미 데이터 반환
  const themes = [
    { month: 7, theme: '뜨거운 여름, 완벽한 스윙을 위한 준비' },
    { month: 8, theme: '늦여름 라운딩, 가을 시즌 준비' },
    { month: 9, theme: '선선한 가을, 최고의 골프 시즌' },
    { month: 10, theme: '단풍 라운딩, 연말 준비' },
    { month: 11, theme: '겨울 대비, 실내 연습' },
    { month: 12, theme: '연말 특별 이벤트' }
  ];
  
  res.status(200).json(themes);
}
EOF

# 4. 의존성 설치
echo "📦 필요한 패키지 설치 중..."
npm install --save formidable @types/formidable 2>/dev/null || true

# 5. 환경 변수 확인
echo "🔧 환경 변수 확인 중..."
if [ ! -f .env.local ]; then
  echo "⚠️  .env.local 파일이 없습니다. 생성 중..."
  cat > .env.local.example << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (선택사항)
OPENAI_API_KEY=your_openai_api_key
EOF
  echo "✅ .env.local.example 파일이 생성되었습니다. 실제 값으로 수정 후 .env.local로 이름을 변경하세요."
fi

# 6. 데이터베이스 스키마 파일 생성
echo "📊 데이터베이스 스키마 생성 중..."
cat > database/integrated-marketing-schema.sql << 'EOF'
-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 월별 퍼널 계획
CREATE TABLE IF NOT EXISTS monthly_funnel_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  theme VARCHAR(255),
  funnel_data JSONB,
  status VARCHAR(50) DEFAULT 'planning',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 퍼널 페이지
CREATE TABLE IF NOT EXISTS funnel_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  funnel_plan_id UUID REFERENCES monthly_funnel_plans(id) ON DELETE CASCADE,
  page_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 생성된 콘텐츠
CREATE TABLE IF NOT EXISTS generated_contents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  funnel_plan_id UUID REFERENCES monthly_funnel_plans(id) ON DELETE CASCADE,
  channel VARCHAR(50),
  content TEXT,
  validation_score JSONB,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 월별 KPI
CREATE TABLE IF NOT EXISTS monthly_kpis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  kpi_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month)
);

-- 인덱스 생성
CREATE INDEX idx_funnel_plans_year_month ON monthly_funnel_plans(year, month);
CREATE INDEX idx_generated_contents_channel ON generated_contents(channel);
CREATE INDEX idx_generated_contents_status ON generated_contents(status);

-- 월별 테마가 없다면 생성
INSERT INTO monthly_themes (month, year, theme) VALUES
(1, 2025, '새해 새 마음, 새로운 스윙'),
(2, 2025, '봄맞이 준비, 실내 연습'),
(3, 2025, '봄 시즌 오픈, 필드로'),
(4, 2025, '벚꽃 라운딩, 봄의 정취'),
(5, 2025, '가정의 달, 가족과 함께'),
(6, 2025, '초여름 준비, 장비 점검')
ON CONFLICT (month, year) DO NOTHING;
EOF

echo "✅ 기본 설치 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. Supabase SQL Editor에서 database/integrated-marketing-schema.sql 실행"
echo "2. .env.local 파일에 환경 변수 설정"
echo "3. npm run dev로 로컬 테스트"
echo "4. 각 컴포넌트의 더미 코드를 실제 구현으로 교체"
echo ""
echo "🎯 테스트 URL:"
echo "- Admin: http://localhost:3000/admin"
echo "- Marketing Enhanced: http://localhost:3000/marketing-enhanced"

# 실행 권한 부여
chmod +x setup-integrated-marketing.sh
