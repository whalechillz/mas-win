import { useEffect } from 'react';

export default function Funnel202505() {
  useEffect(() => {
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

  return (
    <iframe
      src="/versions/funnel-2025-05-live.html"
      style={{ width: '100%', height: '100vh', border: 'none', margin: 0, padding: 0 }}
      title="MAS Golf 5월 가정의 달"
    />
  );
}
