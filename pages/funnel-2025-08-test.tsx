export default function Funnel202508Test() {
  const timestamp = new Date().getTime();
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>🔍 Funnel 2025-08 테스트</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>1️⃣ V1 버전 (원본)</h2>
        <p>URL: /versions/funnel-2025-08-vacation.html</p>
        <iframe
          src={`/versions/funnel-2025-08-vacation.html?v=${timestamp}`}
          style={{
            width: '100%',
            height: '400px',
            border: '2px solid #FF6B35',
            borderRadius: '10px'
          }}
          title="V1"
        />
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>2️⃣ V2 버전 (플립카드)</h2>
        <p>URL: /versions/funnel-2025-08-vacation-v2.html</p>
        <iframe
          src={`/versions/funnel-2025-08-vacation-v2.html?v=${timestamp}`}
          style={{
            width: '100%',
            height: '400px',
            border: '2px solid #4ECDC4',
            borderRadius: '10px'
          }}
          title="V2"
        />
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <h2>3️⃣ 메인 라우트</h2>
        <p>URL: /funnel-2025-08 (현재 사용 중)</p>
        <iframe
          src={`/funnel-2025-08?v=${timestamp}`}
          style={{
            width: '100%',
            height: '400px',
            border: '2px solid #667EEA',
            borderRadius: '10px'
          }}
          title="Main"
        />
      </div>
      
      <div style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '10px',
        marginTop: '40px'
      }}>
        <h3>✅ 체크 사항</h3>
        <ul>
          <li><strong>V2에만</strong> "평범했던 그들이 휴가철 영웅이 되다" 플립카드가 있어야 함</li>
          <li><strong>메인 라우트</strong>는 V2와 동일해야 함</li>
          <li>만약 메인 라우트가 V1처럼 보인다면 캐시 문제</li>
        </ul>
      </div>
    </div>
  );
}
