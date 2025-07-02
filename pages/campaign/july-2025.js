import { useEffect } from 'react';
import Script from 'next/script';

export default function CampaignJuly2025() {
  useEffect(() => {
    // 환경변수를 window 객체에 추가
    window.SUPABASE_CONFIG = {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
    
    // Slack Webhook URL은 보안상 서버사이드에서만 사용
  }, []);

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
        strategy="beforeInteractive"
      />
      <iframe
        src="/versions/funnel-2025-07-complete.html"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0
        }}
        title="MAS Golf 7월 캠페인"
      />
    </>
  );
}