export default function Custom404() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
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
      <div style={{
        display: 'flex',
        gap: '16px'
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
          href="/funnel-2025-07"
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
          시타 신청 바로가기
        </a>
      </div>
    </div>
  );
}