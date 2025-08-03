import { useState, useEffect } from 'react';

export default function Funnel202508Debug() {
  const [currentTime, setCurrentTime] = useState('');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('v2');
  
  useEffect(() => {
    setCurrentTime(new Date().toLocaleString('ko-KR'));
  }, []);

  const versions = {
    'v1': '/versions/funnel-2025-08-vacation.html',
    'v2': '/versions/funnel-2025-08-vacation-v2.html',
    'main': '/funnel-2025-08'
  };

  const handleIframeLoad = () => {
    setIframeLoaded(true);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', height: '100vh', overflow: 'auto' }}>
      <h1 style={{ color: '#FF6B35' }}>🔍 Funnel 2025-08 디버그 페이지</h1>
      
      <div style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h2>📊 시스템 정보</h2>
        <p><strong>현재 시간:</strong> {currentTime}</p>
        <p><strong>브라우저:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'Loading...'}</p>
        <p><strong>페이지 URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
      </div>

      <div style={{ 
        background: '#fff5f2', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h2>🎯 버전 선택</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            onClick={() => setSelectedVersion('v1')}
            style={{
              padding: '10px 20px',
              background: selectedVersion === 'v1' ? '#FF6B35' : '#ddd',
              color: selectedVersion === 'v1' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            V1 (원본)
          </button>
          <button 
            onClick={() => setSelectedVersion('v2')}
            style={{
              padding: '10px 20px',
              background: selectedVersion === 'v2' ? '#FF6B35' : '#ddd',
              color: selectedVersion === 'v2' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            V2 (플립카드)
          </button>
          <button 
            onClick={() => setSelectedVersion('main')}
            style={{
              padding: '10px 20px',
              background: selectedVersion === 'main' ? '#FF6B35' : '#ddd',
              color: selectedVersion === 'main' ? 'white' : 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Main Route
          </button>
        </div>
        
        <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '5px' }}>
          <p><strong>현재 로드 중인 URL:</strong></p>
          <code style={{ 
            background: '#333', 
            color: '#4ECDC4', 
            padding: '10px', 
            display: 'block',
            borderRadius: '5px',
            marginTop: '10px',
            wordBreak: 'break-all'
          }}>
            {versions[selectedVersion]}?v={new Date().getTime()}
          </code>
        </div>
      </div>

      <div style={{ 
        background: '#e8f5ff', 
        padding: '20px', 
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <h2>✅ 플립카드 체크리스트</h2>
        <ul>
          <li>V2 버전 선택 시 "평범했던 그들이 휴가철 영웅이 되다" 섹션 확인</li>
          <li>카드를 클릭하면 뒤집어져야 함</li>
          <li>앞면: BEFORE 상태 (문제점)</li>
          <li>뒷면: AFTER 상태 (성공 스토리)</li>
        </ul>
      </div>

      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '10px',
        border: '2px solid #ddd',
        marginBottom: '20px'
      }}>
        <h2>🖼️ 미리보기 (iframe 상태: {iframeLoaded ? '✅ 로드됨' : '⏳ 로딩중...'})</h2>
        <div style={{ 
          width: '100%', 
          height: '800px', 
          border: '1px solid #ccc',
          borderRadius: '5px',
          overflow: 'hidden',
          marginBottom: '20px'
        }}>
          <iframe
            key={selectedVersion}
            src={`${versions[selectedVersion]}?v=${new Date().getTime()}&debug=true`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            onLoad={handleIframeLoad}
            title={`Debug - ${selectedVersion}`}
          />
        </div>
      </div>

      <div style={{ 
        background: '#ffeeee', 
        padding: '20px', 
        borderRadius: '10px'
      }}>
        <h2>🔧 문제 해결 방법</h2>
        <ol>
          <li>V2 버전에서 플립카드가 보이는지 확인</li>
          <li>Main Route에서도 동일하게 보이는지 확인</li>
          <li>차이가 있다면 캐시 문제일 가능성이 높음</li>
          <li>
            <strong>강제 새로고침 방법:</strong>
            <ul>
              <li>Mac: Cmd + Shift + R</li>
              <li>Windows: Ctrl + Shift + R</li>
            </ul>
          </li>
        </ol>
      </div>

      <div style={{ 
        marginTop: '20px',
        padding: '20px',
        background: '#f0f0f0',
        borderRadius: '10px'
      }}>
        <h2>📱 전화번호 클릭 테스트</h2>
        <a 
          href="tel:080-028-8888" 
          style={{
            display: 'inline-block',
            padding: '15px 30px',
            background: '#FF6B35',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '50px',
            fontWeight: 'bold'
          }}
        >
          📞 080-028-8888 (테스트)
        </a>
      </div>
    </div>
  );
}
