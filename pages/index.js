export default function Home() {
  // 7월 캠페인 HTML로 직접 리다이렉트
  if (typeof window !== 'undefined') {
    window.location.href = '/versions/funnel-2025-07-complete.html';
  }
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#000'
    }}>
      <p style={{ color: '#fff' }}>로딩 중...</p>
    </div>
  );
}