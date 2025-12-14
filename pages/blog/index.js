import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { formatBrandDistanceResearch } from '../../lib/brand-utils';

// 날짜 포맷팅 함수
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return '날짜 정보 없음';
  }
}

// 고급스러운 아이콘 컴포넌트들
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
  </svg>
);

export default function BlogIndex({ posts: staticPosts, initialPagination }) {
  const [posts, setPosts] = useState(staticPosts || []);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [pagination, setPagination] = useState(initialPagination || {
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasNext: false,
    hasPrev: false
  });

  // 페이지 변경 함수
  const handlePageChange = async (page) => {
    setLoading(true);
    setCurrentPage(page);
    
    try {
      const categoryParam = selectedCategory !== '전체' ? `&category=${encodeURIComponent(selectedCategory)}` : '';
      const response = await fetch(`/api/blog/posts/?page=${page}&limit=6${categoryParam}`);
      const data = await response.json();
      
      if (response.ok) {
        // API 응답 데이터를 그대로 사용 (published_at 필드 유지)
        console.log('📊 페이지 변경 API 응답:', data);
        setPosts(data.posts);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch posts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 변경 함수
  const handleCategoryChange = async (category) => {
    setLoading(true);
    setSelectedCategory(category);
    setCurrentPage(1);
    
    try {
      const categoryParam = category !== '전체' ? `&category=${encodeURIComponent(category)}` : '';
      const response = await fetch(`/api/blog/posts/?page=1&limit=6${categoryParam}`);
      const data = await response.json();
      
      if (response.ok) {
        // API 응답 데이터를 그대로 사용 (published_at 필드 유지)
        setPosts(data.posts);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch posts:', data.error);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 정적 데이터가 있으면 사용, 없으면 API에서 가져오기
    if (staticPosts && staticPosts.length > 0) {
      setPosts(staticPosts);
      setLoading(false);
      // 정적 데이터의 경우 페이지네이션 정보 설정
      setPagination({
        currentPage: 1,
        totalPages: Math.ceil(staticPosts.length / 6),
        totalPosts: staticPosts.length,
        hasNext: staticPosts.length > 6,
        hasPrev: false
      });
    } else {
      setLoading(true);
      const fetchPosts = async () => {
        try {
          const response = await fetch('/api/blog/posts/?page=1&limit=6');
          const data = await response.json();
          
          if (response.ok) {
            console.log('📊 API 응답 데이터:', data);
            setPosts(data.posts);
            setPagination(data.pagination);
          } else {
            console.error('Failed to fetch posts:', data.error);
            setPosts([]);
          }
        } catch (error) {
          console.error('Error fetching posts:', error);
          setPosts([]);
        } finally {
          setLoading(false);
        }
      };

      fetchPosts();
    }
  }, [staticPosts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-slate-400 rounded-full animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <p className="mt-6 text-slate-600 font-medium tracking-wide">블로그 게시물을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>골프 가이드 | 마쓰구 비거리 연구 노하우 | 마쓰구골프</title>
        <meta name="description" content="마쓰구 비거리 연구 노하우. 비거리 향상, 정확도 개선, 드라이버 피팅 가이드 등 실전 정보를 확인하세요. KGFA 1급 전문 피터가 전하는 실전 가이드." />
        <meta name="keywords" content="골프 가이드, 골프 노하우, 비거리 향상, 정확도 개선, 드라이버 피팅, 마쓰구 비거리 연구, 골프 팁, 골프 기초" />
        <meta property="og:title" content="골프 가이드 | 마쓰구 비거리 연구 노하우" />
        <meta property="og:description" content="마쓰구 비거리 연구 노하우. KGFA 1급 전문 피터가 전하는 실전 가이드를 확인하세요." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://masgolf.co.kr/blog" />
        <link rel="canonical" href="https://masgolf.co.kr/blog" />
        
        {/* 구조화된 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Blog",
              "name": "마쓰구골프 블로그",
              "description": "고반발 드라이버 전문 브랜드의 골프 정보와 고객 후기",
              "url": "https://masgolf.co.kr/blog",
              "publisher": {
                "@type": "Organization",
                "name": "마쓰구골프",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://masgolf.co.kr/logo.png"
                }
              },
              "blogPost": posts.map(post => ({
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.excerpt,
                "url": `https://masgolf.co.kr/blog/${post.slug}`,
                "datePublished": post.publishedAt,
                "author": {
                  "@type": "Person",
                  "name": "마쓰구"
                }
              }))
            })
          }}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* PC/모바일 최적화된 헤더 */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 sm:py-8 lg:py-12">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 tracking-tight">골프 가이드</h1>
                <p className="mt-2 sm:mt-4 text-slate-600 text-sm sm:text-base lg:text-lg xl:text-xl font-medium">
                  {formatBrandDistanceResearch()}<br className="sm:hidden" />
                  KGFA 1급 전문 피터가 전하는 실전 가이드
                </p>
              </div>
              <Link href="/" className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium transition-colors duration-200 group text-sm sm:text-base lg:text-lg">
                <HomeIcon />
                <span className="group-hover:translate-x-0.5 transition-transform duration-200">홈으로 돌아가기</span>
              </Link>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          {/* PC/모바일 최적화된 카테고리 필터 */}
          <div className="mb-10 sm:mb-12 lg:mb-16">
            <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-5">
              {['전체', '고객 후기', '기술 및 성능', '골프 팁 & 가이드', '제품 소개', '브랜드 스토리', '이벤트 & 프로모션', 'MUZIIK 샤프트', '마쓰구 x MUZIIK'].map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 rounded-full text-xs sm:text-sm lg:text-base font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-white/70 backdrop-blur-sm text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* PC/모바일 최적화된 블로그 게시물 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {posts.map((post) => (
              <article key={post.id} className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-200/50 overflow-hidden hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-500 hover:-translate-y-2 lg:hover:-translate-y-3">
                <Link href={`/blog/${post.slug}`}>
                  <div className="relative h-64 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent z-10"></div>
                    <img
                      src={post.featured_image 
                        ? (post.featured_image.includes('pstatic.net') || 
                           post.featured_image.includes('supabase.co') ||
                           post.featured_image.includes('unsplash.com') ||
                           post.featured_image.includes('images.unsplash.com')
                            ? `/api/image-proxy?url=${encodeURIComponent(post.featured_image)}`
                            : post.featured_image)
                        : '/placeholder-image.svg'
                      }
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        console.log('이미지 로드 실패:', e.target.src);
                        e.target.src = '/placeholder-image.svg';
                      }}
                      onLoad={(e) => {
                        console.log('이미지 로드 성공:', e.target.src);
                      }}
                    />
                    <div className="absolute top-4 left-4 z-20">
                      <span className="px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-700 text-white text-xs font-semibold rounded-full shadow-lg">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3 line-clamp-2 group-hover:text-slate-700 transition-colors duration-200">
                      {post.title}
                    </h2>
                    <p className="text-slate-600 mb-3 sm:mb-4 line-clamp-3 leading-relaxed text-sm sm:text-base">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-2 py-1 sm:px-3 sm:py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm">
                        <CalendarIcon />
                        <time className="font-medium">
                          {formatDate(post.published_at || post.publishedAt)}
                        </time>
                      </div>
                      <div className="flex items-center text-slate-500 text-xs sm:text-sm font-medium group-hover:text-slate-700 transition-colors duration-200">
                        <span>자세히 보기</span>
                        <ArrowRightIcon />
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {/* PC/모바일 최적화된 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="mt-12 sm:mt-16 lg:mt-20 flex justify-center">
              <nav className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 text-slate-500 hover:text-slate-700 font-medium transition-colors duration-200 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base lg:text-lg"
                >
                  이전
                </button>
                
                {/* 페이지 번호들 - 중복 방지 로직 개선 */}
                {(() => {
                  const totalPages = pagination.totalPages;
                  const current = currentPage;
                  const pages = [];
                  
                  if (totalPages <= 7) {
                    // 7페이지 이하면 모두 표시
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // 7페이지 초과면 스마트 페이지네이션
                    // 항상 첫 페이지 표시
                    pages.push(1);
                    
                    if (current <= 4) {
                      // 현재 페이지가 앞쪽에 있을 때
                      for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
                        pages.push(i);
                      }
                      if (totalPages > 5) {
                        pages.push('...');
                        pages.push(totalPages);
                      }
                    } else if (current >= totalPages - 3) {
                      // 현재 페이지가 뒤쪽에 있을 때
                      if (totalPages > 5) {
                        pages.push('...');
                      }
                      for (let i = Math.max(2, totalPages - 4); i <= totalPages; i++) {
                        pages.push(i);
                      }
                    } else {
                      // 현재 페이지가 중간에 있을 때
                      pages.push('...');
                      for (let i = current - 1; i <= current + 1; i++) {
                        pages.push(i);
                      }
                      pages.push('...');
                      pages.push(totalPages);
                    }
                  }
                  
                  return pages.map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-2 text-slate-400 text-sm sm:text-base lg:text-lg">
                          ...
                        </span>
                      );
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 font-medium transition-colors duration-200 rounded-xl text-sm sm:text-base lg:text-lg ${
                          page === current
                            ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 text-slate-500 hover:text-slate-700 font-medium transition-colors duration-200 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base lg:text-lg"
                >
                  다음
                </button>
              </nav>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// 서버사이드 렌더링용 getServerSideProps
export async function getServerSideProps() {
  try {
    // 직접 Supabase에서 게시물 데이터 로드
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase 환경 변수가 설정되지 않았습니다.');
      return {
        props: {
          posts: []
        }
      };
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 게시물 조회
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error('Supabase 쿼리 에러:', error);
      return {
        props: {
          posts: []
        }
      };
    }
    
    const data = {
      posts: posts || [],
      pagination: {
        currentPage: 1,
        totalPages: Math.ceil((posts || []).length / 6),
        totalPosts: (posts || []).length,
        hasNext: (posts || []).length > 6,
        hasPrev: false
      }
    };
    
    if (data.posts && data.posts.length > 0) {
      const transformedPosts = data.posts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featured_image: post.featured_image || null,
        published_at: post.published_at,
        category: post.category,
        tags: post.tags || []
      }));

      return {
        props: {
          posts: transformedPosts,
          initialPagination: data.pagination
        }
      };
    } else {
      console.error('게시물을 찾을 수 없습니다.');
      return {
        props: {
          posts: []
        }
      };
    }
  } catch (error) {
    console.error('Error loading posts:', error);
    return {
      props: {
        posts: []
      }
    };
  }
}
