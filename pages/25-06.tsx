import { useEffect } from 'react';

export default function Funnel202506() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'tel-link') {
        window.location.href = `tel:${event.data.phoneNumber}`;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      src="/versions/funnel-2025-06-live.html"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0
      }}
      title="MAS Golf 6월 프라임타임"
    />
  );
}