import React, { useState, useEffect } from 'react';

export default function EnvCheck() {
  const [envStatus, setEnvStatus] = useState(null);
  
  useEffect(() => {
    fetch('/api/test-insert')
      .then(res => res.json())
      .then(data => setEnvStatus(data))
      .catch(err => setEnvStatus({ error: err.message }));
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 환경 변수 체크</h1>
      
      {!envStatus ? (
        <p>확인 중...</p>
      ) : (
        <div>
          <h2>결과:</h2>
          <pre style={{ 
            background: '#f0f0f0', 
            padding: '15px', 
            borderRadius: '5px',
            fontSize: '14px'
          }}>
{JSON.stringify(envStatus, null, 2)}
          </pre>
          
          <div style={{ marginTop: '20px', padding: '15px', background: envStatus.hasServiceKey ? '#d4edda' : '#f8d7da', borderRadius: '5px' }}>
            <h3>상태: {envStatus.hasServiceKey ? '✅ Service Key 설정됨' : '❌ Service Key 없음!'}</h3>
            {!envStatus.hasServiceKey && (
              <div>
                <p><strong>해결 방법:</strong></p>
                <ol>
                  <li>Vercel.com 접속</li>
                  <li>Settings → Environment Variables</li>
                  <li>SUPABASE_SERVICE_KEY 추가</li>
                  <li>재배포 대기 (2-3분)</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}