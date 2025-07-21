#!/bin/bash

# GA4 및 KPI 추적 시스템 설정 스크립트
echo "🚀 GA4 및 KPI 추적 시스템 설정을 시작합니다..."

# 1. API 파일 생성
echo "📝 API 엔드포인트 생성 중..."

# track-view API 생성
cat > pages/api/track-view.ts << 'EOF'
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { campaign_id, page } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';

  try {
    await supabase.from('page_views').insert({
      campaign_id,
      page_url: page,
      user_agent: userAgent,
      ip_address: ip as string,
      referer,
      created_at: new Date().toISOString()
    });

    const { data: currentMetrics } = await supabase
      .from('campaign_metrics')
      .select('views')
      .eq('campaign_id', campaign_id)
      .single();

    if (currentMetrics) {
      await supabase
        .from('campaign_metrics')
        .update({ 
          views: (currentMetrics.views || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaign_id);
    } else {
      await supabase
        .from('campaign_metrics')
        .insert({
          campaign_id,
          views: 1,
          unique_visitors: 0,
          phone_clicks: 0,
          form_submissions: 0,
          quiz_completions: 0,
          conversion_rate: 0
        });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return res.status(500).json({ error: 'Failed to track view' });
  }
}
EOF

# 2. GTM 추적 스크립트 생성
echo "📊 GTM 추적 스크립트 생성 중..."

cat > public/campaign-tracking.js << 'EOF'
// 캠페인 추적 스크립트
(function() {
  // 페이지 로드 시 조회수 추적
  window.addEventListener('load', function() {
    // 데이터베이스에 기록
    fetch('/api/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: '2025-07',
        page: window.location.pathname
      })
    }).catch(console.error);
  });

  // 전화번호 클릭 추적
  document.addEventListener('click', function(e) {
    const target = e.target.closest('a[href^="tel:"]');
    if (target) {
      const phoneNumber = target.getAttribute('href').replace('tel:', '');
      if (typeof gtag !== 'undefined') {
        gtag('event', 'phone_click', {
          'phone_number': phoneNumber,
          'campaign_id': '2025-07'
        });
      }
    }
  });
})();
EOF

# 3. 데이터베이스 스키마 생성
echo "🗄️ 데이터베이스 스키마 파일 생성 중..."

cat > database/campaign-tracking-schema.sql << 'EOF'
-- 페이지 뷰 추적 테이블
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  referer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 캠페인 메트릭스 테이블
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) UNIQUE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  phone_clicks INTEGER DEFAULT 0,
  form_submissions INTEGER DEFAULT 0,
  quiz_completions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_page_views_campaign ON page_views(campaign_id);
CREATE INDEX idx_page_views_created ON page_views(created_at DESC);
CREATE INDEX idx_campaign_metrics_campaign ON campaign_metrics(campaign_id);

-- RLS 설정
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for all users" ON page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users" ON page_views
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Enable all for authenticated users" ON campaign_metrics
  FOR ALL TO authenticated
  USING (true);
EOF

echo "✅ 파일 생성 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. Supabase SQL Editor에서 database/campaign-tracking-schema.sql 실행"
echo "2. .env.local에 GA4 관련 환경 변수 추가"
echo "3. public/versions/funnel-2025-07-complete.html에 다음 추가:"
echo "   - <head> 태그에 GTM/GA4 스크립트"
echo "   - </body> 태그 직전에 <script src='/campaign-tracking.js'></script>"
echo "4. npm run dev로 테스트"
echo ""
echo "🎯 GTM Container ID: GTM-WPBX97JG"
echo "📊 GA4 Measurement ID: G-SMJWL2TRM7"
