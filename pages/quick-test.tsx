import React, { useState } from 'react';

export default function QuickTest() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTest = async (testType) => {
    setLoading(true);
    setResult(null);
    
    try {
      let response;
      
      switch(testType) {
        case 'env':
          response = await fetch('/api/test-insert');
          break;
        case 'generate':
          response = await fetch('/api/generate-multichannel-content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              year: 2025,
              month: 7,
              selectedChannels: { blog: true }
            })
          });
          break;
      }
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 빠른 테스트</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => runTest('env')}
          disabled={loading}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          환경 변수 테스트
        </button>
        
        <button
          onClick={() => runTest('generate')}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          콘텐츠 생성 테스트
        </button>
      </div>
      
      {loading && <p>테스트 중...</p>}
      
      {result && (
        <pre style={{
          backgroundColor: '#f3f4f6',
          padding: '15px',
          borderRadius: '5px',
          overflow: 'auto'
        }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}