import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { marked } from 'marked';

// 날짜 포맷팅 함수 (안전한 처리)
function formatDate(dateString) {
  if (!dateString) return '날짜 정보 없음';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '날짜 정보 없음';
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return '날짜 정보 없음';
  }
}

// 7월 퍼널 스타일의 고급스러운 아이콘 컴포넌트들
const ArrowLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ShareIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
  </svg>
);

// 공유 기능 아이콘들
const KakaoIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.52 1.44 4.8 3.6 6.24L4.8 20.4l3.6-1.44c.96.24 1.92.48 3.6.48 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
  </svg>
);

const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PrintIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// 7월 퍼널 스타일의 고급스러운 섹션 아이콘들
const FeaturesIcon = () => (
  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-lg">
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </div>
);

const ContactIcon = () => (
  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  </div>
);

const GalleryIcon = () => (
  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
);

// 마크다운을 HTML로 변환하는 함수 (HTML인지 마크다운인지 자동 감지)
const convertMarkdownToHtml = (content) => {
  if (!content) return '';
  
  // ✅ 이미 HTML인지 확인 (HTML 태그가 있으면 HTML로 간주)
  const isHTML = /<[a-z][\s\S]*>/i.test(content);
  
  if (isHTML) {
    // ✅ 이미 HTML이면 그대로 반환 (마크다운 변환하지 않음)
    // ✅ 깨진 이미지 URL 수정
    let html = content;
    
    // ✅ 잘린 이미지 URL 수정: `/or`로 끝나고 파일 확장자가 없는 경우만 감지
    // 예: `! [가을 골프 시즌 이미지] (https://...supabase.co/storage/v1/object/public/blog-images/or`
    // -> 올바른 URL로 교체
    // 주의: `/originals/` 경로는 정상이므로 제외
    html = html.replace(
      /!\[([^\]]*)\]\(([^)]*\/or(?!iginals)[^)]*)\)/gi,
      (match, alt, url) => {
        // 파일 확장자가 있는지 확인 (정상 URL)
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
          return match; // 정상 URL이면 그대로 반환
        }
        console.warn('⚠️ 잘린 이미지 URL 발견:', url);
        // 잘린 URL은 제거하거나 기본 이미지로 교체
        return `<p style="color: red; font-style: italic;">⚠️ 이미지 링크가 손상되었습니다: ${alt || '이미지'}</p>`;
      }
    );
  
    // ✅ HTML img 태그의 잘린 URL 수정
    html = html.replace(
      /<img[^>]+src=["']([^"']*\/or(?!iginals)[^"']*)["'][^>]*>/gi,
      (match, url) => {
        // 파일 확장자가 있는지 확인 (정상 URL)
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
          return match; // 정상 URL이면 그대로 반환
        }
        console.warn('⚠️ 잘린 이미지 URL 발견 (HTML):', url);
        return `<p style="color: red; font-style: italic;">⚠️ 이미지 링크가 손상되었습니다.</p>`;
      }
    );
    
    // ✅ 마크다운 이미지 문법이 HTML 내에 있는 경우 처리
    // 예: `! [alt](url)` -> `<img src="url" alt="alt" />`
    html = html.replace(
      /!\[([^\]]*)\]\(([^)]+)\)/gi,
      (match, alt, url) => {
        // URL이 잘렸는지 확인: `/or`로 끝나고 파일 확장자가 없으며, `/originals/`가 아닌 경우
        if (url.match(/\/or(?!iginals)[^/]*$/i) && !url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
          console.warn('⚠️ 잘린 이미지 URL 발견 (마크다운):', url);
          return `<p style="color: red; font-style: italic;">⚠️ 이미지 링크가 손상되었습니다: ${alt || '이미지'}</p>`;
        }
        return `<img src="${url}" alt="${alt || ''}" style="max-width: 100%; height: auto;" />`;
      }
    );
    
    return html;
  }
  
  // ✅ 마크다운인 경우 변환
  marked.setOptions({
    breaks: true, // 줄바꿈을 <br>로 변환
    gfm: true, // GitHub Flavored Markdown 지원
  });
  
  let html = marked(content);
  
  // ✅ 마크다운 변환 후에도 잘린 이미지 URL 확인 및 수정
  html = html.replace(
    /<img[^>]+src=["']([^"']*\/or(?!iginals)[^"']*)["'][^>]*>/gi,
    (match, url) => {
      // 파일 확장자가 있는지 확인 (정상 URL)
      if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
        return match; // 정상 URL이면 그대로 반환
      }
      console.warn('⚠️ 잘린 이미지 URL 발견 (변환 후):', url);
      return `<p style="color: red; font-style: italic;">⚠️ 이미지 링크가 손상되었습니다.</p>`;
    }
  );
  
  return html;
};

export default function BlogPost({ post: staticPost }) {
  const router = useRouter();
  const { slug } = router.query;
  const [post, setPost] = useState(staticPost || null);
  const [loading, setLoading] = useState(!staticPost);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 공유 기능 함수들
  const handleKakaoShare = () => {
    if (typeof window !== 'undefined' && post) {
      const url = window.location.href;
      const title = post.title;
      const description = post.excerpt || post.content.substring(0, 100) + '...';
      
      // 카카오톡 공유 (Web Share API 사용)
      if (navigator.share) {
        navigator.share({
          title: title,
          text: description,
          url: url
        }).catch(console.error);
      } else {
        // 카카오톡 공유 링크 생성
        const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        window.open(kakaoUrl, '_blank');
      }
    }
  };

  const handleCopyLink = async () => {
    if (typeof window !== 'undefined') {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('링크 복사 실패:', err);
        // 폴백: 텍스트 선택 방식
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const handleEmailShare = () => {
    if (typeof window !== 'undefined' && post) {
      const url = window.location.href;
      const title = post.title;
      const subject = `[마쓰구골프] ${title}`;
      const body = `안녕하세요!\n\n골프 관련 좋은 정보를 공유합니다:\n\n${title}\n${url}\n\n마쓰구골프에서 더 많은 정보를 확인해보세요!`;
      
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // 블로그 페이지 상세 추적
  useEffect(() => {
    if (post && typeof window !== 'undefined') {
      // UTM 파라미터 추출
      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source');
      const utmMedium = urlParams.get('utm_medium');
      const utmCampaign = urlParams.get('utm_campaign');
      const utmTerm = urlParams.get('utm_term');
      const utmContent = urlParams.get('utm_content');
      
      // 리퍼러 정보
      const referrer = document.referrer;
      const isGoogleSearch = referrer.includes('google.com');
      const isNaverSearch = referrer.includes('naver.com');
      const isDirect = !referrer || referrer === window.location.origin;
      
      // 검색어 추출 (Google/Naver)
      let searchKeyword = '';
      if (isGoogleSearch) {
        const googleMatch = referrer.match(/[?&]q=([^&]+)/);
        if (googleMatch) {
          searchKeyword = decodeURIComponent(googleMatch[1]);
        }
      } else if (isNaverSearch) {
        const naverMatch = referrer.match(/[?&]query=([^&]+)/);
        if (naverMatch) {
          searchKeyword = decodeURIComponent(naverMatch[1]);
        }
      }

      // Google Analytics 4 이벤트 전송
      if (window.gtag) {
        window.gtag('event', 'blog_view', {
          blog_title: post.title,
          blog_slug: post.slug,
          blog_category: post.category,
          utm_source: utmSource || 'direct',
          utm_medium: utmMedium || (isGoogleSearch ? 'organic' : isNaverSearch ? 'organic' : 'direct'),
          utm_campaign: utmCampaign || 'none',
          utm_term: utmTerm || searchKeyword || 'none',
          utm_content: utmContent || 'none',
          referrer: referrer || 'direct',
          search_keyword: searchKeyword || 'none',
          traffic_source: isGoogleSearch ? 'google_organic' : isNaverSearch ? 'naver_organic' : utmSource ? 'paid' : 'direct'
        });

        // 페이지뷰 이벤트
        window.gtag('event', 'page_view', {
          page_title: post.title,
          page_location: window.location.href,
          page_path: window.location.pathname,
          content_group1: 'blog',
          content_group2: post.category
        });
      }

      // Supabase 조회수 추적
      const trackBlogView = async () => {
        try {
          await fetch('/api/track-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaign_id: 'blog',
              page: window.location.pathname,
              blog_title: post.title,
              blog_slug: post.slug,
              blog_category: post.category,
              utm_source: utmSource,
              utm_medium: utmMedium,
              utm_campaign: utmCampaign,
              utm_term: utmTerm,
              utm_content: utmContent,
              referrer: referrer,
              search_keyword: searchKeyword,
              traffic_source: isGoogleSearch ? 'google_organic' : isNaverSearch ? 'naver_organic' : utmSource ? 'paid' : 'direct'
            })
          });
        } catch (error) {
          console.error('블로그 조회수 추적 실패:', error);
        }
      };

      trackBlogView();
    }
  }, [post]);

  useEffect(() => {
    // 정적 데이터가 있으면 사용, 없으면 API에서 가져오기
    if (staticPost) {
      setPost(staticPost);
      setLoading(false);
    } else if (slug) {
      const fetchPost = async () => {
        try {
          // URL 파라미터에서 관리자 권한 확인
          const urlParams = new URLSearchParams(window.location.search);
          const isAdmin = urlParams.get('admin') === 'true';
          
          // 관리자 권한이 있으면 헤더에 추가
          const headers = {};
          if (isAdmin) {
            headers['x-admin-auth'] = 'true';
          }
          
          console.log('🔍 퍼블릭 블로그 페이지 로드:', { 
            slug, 
            isAdmin,
            urlParams: window.location.search 
          });
          
          const response = await fetch(`/api/blog/${slug}`, {
            headers: headers
          });
          const data = await response.json();
          
          if (response.ok) {
            // API 응답 구조 확인: 관리자 요청은 직접 객체, 일반 요청은 중첩 구조
            if (data.post) {
              // 일반 요청: {post: {...}, relatedPosts: [...]}
              setPost(data.post);
              setRelatedPosts(data.relatedPosts || []);
            } else {
              // 관리자 요청: 직접 객체 {...}
              setPost(data);
              setRelatedPosts([]);
            }
          } else {
            console.error('Failed to fetch post:', data.error);
            setPost(null);
          }
        } catch (error) {
          console.error('Error fetching post:', error);
          setPost(null);
        } finally {
          setLoading(false);
        }
      };

      fetchPost();
    }
  }, [slug, staticPost]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-slate-400 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <p className="mt-6 text-slate-600 font-medium tracking-wide">게시물을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4 tracking-tight">게시물을 찾을 수 없습니다</h1>
          <p className="text-slate-600 mb-8 leading-relaxed">요청하신 게시물이 존재하지 않거나 삭제되었습니다.</p>
          <Link href="/blog" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all duration-200 font-medium">
            <ArrowLeftIcon />
            블로그 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{post.meta_title || post.title}</title>
        <meta name="description" content={post.meta_description || post.excerpt} />
        <meta name="keywords" content={post.tags.join(', ')} />
        <meta property="og:title" content={post.meta_title || post.title} />
        <meta property="og:description" content={post.meta_description || post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://masgolf.co.kr/blog/${post.slug}`} />
        {post.featured_image && <meta property="og:image" content={post.featured_image} />}
        <link rel="canonical" href={`https://masgolf.co.kr/blog/${post.slug}`} />
        
        {/* 인쇄 스타일 */}
        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            body {
              font-size: 12pt;
              line-height: 1.4;
              color: #000;
              background: #fff;
            }
            .container {
              max-width: none;
              margin: 0;
              padding: 0;
            }
            .prose {
              max-width: none;
            }
            .prose h1, .prose h2, .prose h3 {
              color: #000;
              page-break-after: avoid;
            }
            .prose p {
              margin-bottom: 1em;
              orphans: 3;
              widows: 3;
            }
            .prose img {
              max-width: 100%;
              height: auto;
              page-break-inside: avoid;
            }
          }
          .print-only {
            display: none;
          }
        `}</style>
        
        {/* 구조화된 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": post.title,
              "image": post.featured_image,
              "datePublished": post.published_at || post.publishedAt,
              "author": {
                "@type": "Person",
                "name": "마쓰구골프"
              },
              "publisher": {
                "@type": "Organization",
                "name": "마쓰구골프",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://masgolf.co.kr/logo.png"
                }
              },
              "description": post.excerpt,
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://masgolf.co.kr/blog/${post.slug}`
              }
            })
          }}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* 고급스러운 헤더 */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 no-print">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/blog" className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium transition-colors duration-200 group">
                <ArrowLeftIcon />
                <span className="group-hover:translate-x-0.5 transition-transform duration-200">블로그 목록</span>
              </Link>
              <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 group">
                <HomeIcon />
                <span className="group-hover:translate-x-0.5 transition-transform duration-200">홈으로</span>
              </Link>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 미발행 상태 배너 */}
          {post.status !== 'published' && (
            <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm">
                    <strong>⚠️ 미리보기 모드</strong> - 이 게시물은 아직 발행되지 않았습니다.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <article className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl shadow-slate-900/5 border border-slate-200/50 overflow-hidden">
            {/* 고급스러운 썸네일 이미지 */}
            {post.featured_image && (
              <div className="relative h-80 md:h-[32rem] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent z-10"></div>
                <Image
                  src={post.featured_image.includes('pstatic.net') || post.featured_image.includes('supabase.co')
                    ? `/api/image-proxy?url=${encodeURIComponent(post.featured_image)}`
                    : post.featured_image
                  }
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  priority
                />
              </div>
            )}

            <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10 md:py-12">
              {/* 카테고리 */}
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-700 text-white text-sm font-semibold rounded-full shadow-lg">
                  {post.category}
                </span>
              </div>

              {/* 제목 */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-8 leading-tight tracking-tight">
                {post.title}
              </h1>

              {/* 메타 정보 */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-10 text-slate-600">
                <div className="flex items-center gap-2">
                  <CalendarIcon />
                  <time dateTime={post.published_at || post.publishedAt} className="font-medium">
                    {formatDate(post.published_at || post.publishedAt)}
                  </time>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon />
                  <span className="font-medium">마쓰구골프</span>
                </div>
              </div>

              {/* 태그 */}
              <div className="flex flex-wrap gap-3 mb-12">
                {post.tags.map((tag, index) => (
                  <span key={index} className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-full border border-slate-200 hover:bg-slate-200 transition-colors duration-200">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 본문 내용 */}
              <div 
                className="prose prose-lg prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-lg prose-a:text-blue-600 prose-a:font-medium prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:text-gray-700 prose-li:text-gray-700 prose-li:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(post.content) }}
              />

              {/* 한국 50대 남성 최적화 공유 섹션 */}
              <div className="mt-12 pt-8 border-t border-gray-200 no-print">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">🏌️‍♂️ 골프 동호회 친구들과 공유하세요!</h3>
                  
                  {/* 공유 버튼들 */}
                  <div className="flex flex-wrap justify-center gap-3 mb-6">
                    {/* 카카오톡 공유 */}
                    <button 
                      onClick={handleKakaoShare}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      <KakaoIcon />
                      카카오톡 공유
                    </button>
                    
                    {/* 링크 복사 */}
                    <button 
                      onClick={handleCopyLink}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm shadow-md hover:shadow-lg ${
                        copySuccess 
                          ? 'bg-green-500 text-white hover:bg-green-600' 
                          : 'bg-gray-600 text-white hover:bg-gray-700'
                      }`}
                    >
                      <CopyIcon />
                      {copySuccess ? '복사 완료!' : '링크 복사'}
                    </button>
                    
                    {/* 이메일 공유 */}
                    <button 
                      onClick={handleEmailShare}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      <EmailIcon />
                      이메일 공유
                    </button>
                    
                    {/* 인쇄 */}
                    <button 
                      onClick={handlePrint}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      <PrintIcon />
                      인쇄하기
                    </button>
                  </div>
                  
                </div>
              </div>
            </div>
          </article>

          {/* 고급스러운 관련 게시물 섹션 */}
          {relatedPosts.length > 0 && (
            <section className="mt-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">관련 게시물</h2>
                <p className="text-slate-600 text-lg">더 많은 인사이트를 확인해보세요</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`}>
                    <article className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-200/50 overflow-hidden hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-500 hover:-translate-y-2">
                      <div className="relative h-56 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent z-10"></div>
                        <Image
                          src={relatedPost.featured_image.includes('pstatic.net') || relatedPost.featured_image.includes('supabase.co')
                            ? `/api/image-proxy?url=${encodeURIComponent(relatedPost.featured_image)}`
                            : relatedPost.featured_image
                          }
                          alt={relatedPost.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-6">
                        <div className="mb-3">
                          <span className="inline-flex items-center px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                            {relatedPost.category}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-slate-700 transition-colors duration-200">
                          {relatedPost.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-4">
                          {relatedPost.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <time className="text-xs text-slate-500 font-medium">
                            {formatDate(relatedPost.published_at || relatedPost.publishedAt)}
                          </time>
                          <div className="flex items-center text-slate-500 text-xs font-medium group-hover:text-slate-700 transition-colors duration-200">
                            <span>자세히 보기</span>
                            <svg className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

// 동적 라우팅을 위한 getServerSideProps
export async function getServerSideProps({ params, query, req }) {
  try {
    const { slug } = params;
    
    // 관리자 권한 확인
    const isAdmin = query.admin === 'true' || 
                   req.headers.cookie?.includes('admin-auth=true') ||
                   req.headers.referer?.includes('/admin/');
    
    // API에서 데이터 가져오기
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://masgolf.co.kr' 
      : 'http://localhost:3000';
    
    const headers = {};
    if (isAdmin) {
      headers['x-admin-auth'] = 'true';
    }
    
    const response = await fetch(`${baseUrl}/api/blog/${slug}`, {
      headers: headers
    });
    
    if (!response.ok) {
      return {
        notFound: true
      };
    }
    
    const data = await response.json();
    
    return {
      props: {
        post: data.post,
        relatedPosts: data.relatedPosts || []
      }
    };
  } catch (error) {
    console.error('Error loading post:', error);
    return {
      notFound: true
    };
  }
}