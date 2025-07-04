import { useEffect } from 'react';

export default function Funnel202507() {
  useEffect(() => {
    // iframe이 로드된 후 API URL 수정
    const handleIframeLoad = () => {
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        // iframe 내부의 fetch 함수 오버라이드
        iframe.contentWindow.fetch = new Proxy(iframe.contentWindow.fetch, {
          apply: function(target, thisArg, argumentsList) {
            let [url, options] = argumentsList;
            
            // 잘못된 Vercel URL을 현재 도메인으로 변경
            if (typeof url === 'string' && url.includes('vercel.app') && url.includes('/api/')) {
              const apiPath = url.substring(url.indexOf('/api/'));
              url = window.location.origin + apiPath;
              console.log('API URL 수정:', url);
            }
            
            return target.apply(thisArg, [url, options]);
          }
        });
      }
    };

    // iframe 로드 이벤트 리스너 추가
    const iframe = document.querySelector('iframe');
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
    }

    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
    };
  }, []);

  return (
    <iframe
      src="/versions/funnel-2025-07-summer-final.html"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        margin: 0,
        padding: 0
      }}
      title="MAS Golf 7월 퍼널"
    />
  );
}