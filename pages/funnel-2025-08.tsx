import { useEffect } from 'react';

export default function Funnel202508() {
  useEffect(() => {
    // iframe에서 전화번호 클릭 메시지 처리
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'tel-link') {
        console.log('전화번호 메시지 수신:', event.data.phoneNumber);
        window.location.href = `tel:${event.data.phoneNumber}`;
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 강력한 캐시 방지를 위한 매개변수들
  const timestamp = new Date().getTime();
  const randomId = Math.random().toString(36).substring(7);

  return (
    <iframe
      src={`/versions/funnel-2025-08-vacation-final.html?v=${timestamp}&nocache=${randomId}&t=${Date.now()}`}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0
      }}
      title="MAS Golf 8월 휴가철 퍼널"
      key={`funnel-iframe-${timestamp}`}
    />
  );
}
