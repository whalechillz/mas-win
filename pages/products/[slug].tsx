import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function ProductDynamic() {
  const router = useRouter();
  const { slug } = router.query;

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

  // slug에 따른 HTML 파일 매핑
  const getProductHtml = (slug: string) => {
    const productMap: { [key: string]: string } = {
      '2025-08': '/versions/funnel-2025-08-live.html',
      'funnel-2025-08': '/versions/funnel-2025-08-live.html',
      '2025-07': '/versions/funnel-2025-07-complete.html',
      'funnel-2025-07': '/versions/funnel-2025-07-complete.html',
      '2025-06': '/versions/funnel-2025-06-live.html',
      'funnel-2025-06': '/versions/funnel-2025-06-live.html',
      '2025-05': '/versions/funnel-2025-05-live.html',
      'funnel-2025-05': '/versions/funnel-2025-05-live.html'
    };
    
    return productMap[slug] || '/versions/funnel-2025-08-live.html';
  };

  if (!slug) {
    return <div>로딩 중...</div>;
  }

  return (
    <iframe
      src={getProductHtml(slug as string)}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0
      }}
      title={`MAS Golf ${slug} 제품`}
    />
  );
}

