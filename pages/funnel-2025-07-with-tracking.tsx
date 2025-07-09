import { useEffect, useState } from 'react';
import { PageViewTracker } from '../components/tracking/PageViewTracker';

// Supabase 설정
const supabaseUrl = 'https://yyytjudftvpmcnppaymw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5eXRqdWRmdHZwbWNucHBheW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDcxMTksImV4cCI6MjA2NzAyMzExOX0.TxT-vnDjFip_CCL7Ag8mR7G59dMdQAKfPLY1S3TJqRE';

export default function Funnel202507() {
  const [supabase, setSupabase] = useState(null);
  
  // Supabase 초기화
  useEffect(() => {
    const initSupabase = async () => {
      if (!window.supabase) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = () => {
          const client = window.supabase.createClient(supabaseUrl, supabaseKey);
          setSupabase(client);
        };
        document.head.appendChild(script);
      } else {
        const client = window.supabase.createClient(supabaseUrl, supabaseKey);
        setSupabase(client);
      }
    };
    
    initSupabase();
  }, []);
  
  useEffect(() => {
    // API fix 스크립트 동적 로드
    const script = document.createElement('script');
    script.src = '/api-fix.js';
    script.async = true;
    document.head.appendChild(script);
    
    // iframe에서 전화번호 클릭 메시지 처리
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'tel-link') {
        console.log('전화번호 메시지 수신:', event.data.phoneNumber);
        window.location.href = `tel:${event.data.phoneNumber}`;
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 캐시 방지를 위한 타임스탬프 추가
  const timestamp = new Date().getTime();

  return (
    <>
      {/* 페이지뷰 추적 컴포넌트 */}
      <PageViewTracker 
        campaignId="2025-07" 
        supabase={supabase}
      />
      
      <iframe
        src={`/versions/funnel-2025-07-complete.html?v=${timestamp}&ui=updated`}
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0
        }}
        title="MAS Golf 7월 퍼널"
      />
    </>
  );
}
