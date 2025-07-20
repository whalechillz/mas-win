import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function FunnelPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadFunnelPage(slug as string);
    }
  }, [slug]);

  const loadFunnelPage = async (pageSlug: string) => {
    try {
      // 퍼널 페이지 HTML 파일 로드
      const response = await fetch(`/funnel-pages/${pageSlug}.html`);
      if (response.ok) {
        const html = await response.text();
        setHtmlContent(html);
      } else {
        // 페이지가 없으면 404로 리다이렉트
        router.push('/404');
      }
    } catch (error) {
      console.error('Failed to load funnel page:', error);
      router.push('/404');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // HTML 콘텐츠를 직접 렌더링
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      className="funnel-page-container"
    />
  );
}
