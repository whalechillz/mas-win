#!/bin/bash

echo "🔧 API 문제 해결 중..."
echo ""

# 1. 로컬에서 테스트
echo "1️⃣ 로컬 테스트:"
echo "   npm run dev"
echo "   http://localhost:3000/funnel-2025-07"
echo "   개발자도구 콘솔에서 /api/track-view 요청 확인"
echo ""

# 2. Vercel 재배포
echo "2️⃣ Vercel 재배포 필요:"
echo "   git add ."
echo "   git commit -m 'fix: track-view API 수정'"
echo "   git push"
echo ""

# 3. 빠른 수정 - JS 버전으로 변경
echo "3️⃣ 또는 TypeScript → JavaScript 변경:"
mv pages/api/track-view.ts pages/api/track-view.js 2>/dev/null

cat > pages/api/track-view.js << 'EOF'
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { campaign_id, page } = req.body;
  
  // 환경변수 확인
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Supabase 동적 import
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 페이지 뷰 기록
    const { error: insertError } = await supabase.from('page_views').insert({
      campaign_id,
      page_url: page,
      user_agent: req.headers['user-agent'] || '',
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      referer: req.headers['referer'] || '',
      created_at: new Date().toISOString()
    });

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Failed to track view' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return res.status(500).json({ error: error.message });
  }
}
EOF

echo ""
echo "✅ JavaScript 버전으로 변경 완료!"
echo ""
echo "다시 배포:"
echo "git add pages/api/track-view.js"
echo "git rm pages/api/track-view.ts"
echo "git commit -m 'fix: track-view API를 JS로 변경'"
echo "git push"
