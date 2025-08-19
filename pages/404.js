export default function Custom404() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        fontSize: '1.3rem',
        color: '#222',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        죄송합니다. 해당 페이지를 찾을 수 없습니다.<br />
        궁금하신 내용은 아래 연락처로 편하게 문의 주세요.
      </div>
      
      {/* 디버깅 정보 */}
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h3 style={{ color: '#dc3545', marginBottom: '12px', fontSize: '1.1rem' }}>
          🔍 디버깅 정보
        </h3>
        <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>
          <p><strong>현재 URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
          <p><strong>호스트명:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</p>
          <p><strong>경로:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}</p>
          <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 100) + '...' : 'N/A'}</p>
          <p><strong>타임스탬프:</strong> {new Date().toISOString()}</p>
        </div>
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #dee2e6' }}>
          <p style={{ fontSize: '0.8rem', color: '#dc3545' }}>
            💡 <strong>문제 해결:</strong> Vercel 대시보드에서 도메인 설정과 리다이렉트 규칙을 확인해주세요.
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <a
          href="tel:01076173010"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            borderRadius: '24px',
            backgroundColor: '#002147',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#FFD700';
            e.target.style.color = '#222';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#002147';
            e.target.style.color = '#fff';
          }}
        >
          고객센터
        </a>
        <a
          href="/25-08"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            borderRadius: '24px',
            backgroundColor: '#dc3545',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#c82333';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#dc3545';
          }}
        >
          무료 시타 신청
        </a>
        <a
          href="/debug-404"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            borderRadius: '24px',
            backgroundColor: '#17a2b8',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#138496';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#17a2b8';
          }}
        >
          상세 디버깅
        </a>
      </div>
    </div>
  );
}