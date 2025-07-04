export default function VersionsPage() {
  const versions = [
    { name: '2025년 5월 버전', file: 'funnel-2025-05.html' },
    { name: '2025년 6월 기본', file: 'funnel-2025-06.html' },
    { name: '2025년 6월 프라임타임', file: 'funnel-2025-06-prime-time.html' },
    { name: '2025년 6월 프라임타임 (테이블)', file: 'funnel-2025-06-prime-time-tables.html' },
    { name: '2025년 7월 완성본', file: 'funnel-2025-07-complete.html' },
    { name: '2025년 7월 프리미엄 V2', file: 'funnel-2025-07-premium-v2.html' },
    { name: '2025년 7월 썸머 파이널', file: 'funnel-2025-07-summer-final.html' },
  ];

  return (
    <div style={{ padding: '50px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '30px' }}>🎨 MASGOLF 시안 목록</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {versions.map((version) => (
          <div key={version.file} style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '15px' }}>{version.name}</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a 
                href={`/versions/${version.file}`}
                target="_blank"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#002147',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                새 창에서 보기
              </a>
              <button
                onClick={() => window.location.href = `/preview?file=${version.file}`}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#FF0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                미리보기
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}