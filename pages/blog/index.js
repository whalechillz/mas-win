import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

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

export default function BlogIndex({ posts: staticPosts }) {
  const [posts, setPosts] = useState(staticPosts || []);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [pagination, setPagination] = useState({
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
      const response = await fetch(`/api/blog/posts?page=${page}&limit=6${categoryParam}`);
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

  // 카테고리 변경 함수
  const handleCategoryChange = async (category) => {
    setLoading(true);
    setSelectedCategory(category);
    setCurrentPage(1);
    
    try {
      const categoryParam = category !== '전체' ? `&category=${encodeURIComponent(category)}` : '';
      const response = await fetch(`/api/blog/posts?page=1&limit=6${categoryParam}`);
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
          const response = await fetch('/api/blog/posts?page=1&limit=6');
          const data = await response.json();
          
          if (response.ok) {
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
        <title>마쓰구 블로그 | 22년 전통의 맞춤형 드라이버 전문 브랜드</title>
        <meta name="description" content="마쓰구 블로그에서 22년 전통의 맞춤형 드라이버, 골프 피팅, 고객 성공 스토리 등 골프 관련 정보를 확인하세요." />
        <meta name="keywords" content="마쓰구, 맞춤형 드라이버, 골프 드라이버, 골프 피팅, 22년 전통, 비거리 향상, 고객 성공 스토리" />
        <meta property="og:title" content="마쓰구 블로그 | 22년 전통의 맞춤형 드라이버 전문 브랜드" />
        <meta property="og:description" content="마쓰구 블로그에서 22년 전통의 맞춤형 드라이버, 골프 피팅, 고객 성공 스토리 등 골프 관련 정보를 확인하세요." />
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
        {/* 고급스러운 헤더 */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">마쓰구 블로그</h1>
                <p className="mt-3 text-slate-600 text-lg font-medium">22년 전통의 맞춤형 드라이버 전문 브랜드</p>
              </div>
              <Link href="/" className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium transition-colors duration-200 group">
                <HomeIcon />
                <span className="group-hover:translate-x-0.5 transition-transform duration-200">홈으로 돌아가기</span>
              </Link>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 고급스러운 카테고리 필터 */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-3">
              {['전체', '비거리 향상 드라이버', '맞춤형 드라이버', '고객 성공 스토리', '골프 팁 & 가이드', '이벤트 & 프로모션'].map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg hover:shadow-xl'
                      : 'bg-white/70 backdrop-blur-sm text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 고급스러운 블로그 게시물 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-200/50 overflow-hidden hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-500 hover:-translate-y-2">
                <Link href={`/blog/${post.slug}`}>
                  <div className="relative h-64 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent z-10"></div>
                    <img
                      src={post.featuredImage || 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=No+Image'}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        console.log('이미지 로드 실패:', e.target.src);
                        e.target.src = 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Error';
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
                  <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-slate-700 transition-colors duration-200">
                      {post.title}
                    </h2>
                    <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <CalendarIcon />
                        <time className="font-medium">
                          {formatDate(post.published_at || post.publishedAt)}
                        </time>
                      </div>
                      <div className="flex items-center text-slate-500 text-sm font-medium group-hover:text-slate-700 transition-colors duration-200">
                        <span>자세히 보기</span>
                        <ArrowRightIcon />
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {/* 고급스러운 페이지네이션 */}
          {pagination.totalPages > 1 && (
            <div className="mt-16 flex justify-center">
              <nav className="flex items-center space-x-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-4 py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors duration-200 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                
                {/* 페이지 번호들 */}
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-3 font-medium transition-colors duration-200 rounded-xl ${
                      pageNum === currentPage
                        ? 'bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-4 py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors duration-200 rounded-xl hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
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

// 정적 생성용 getStaticProps
export async function getStaticProps() {
  try {
    // Supabase에서 게시물 데이터 로드
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/posts/`);
    const data = await response.json();
    
    if (response.ok && data.posts) {
      const posts = data.posts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        featuredImage: post.featured_image || null,
        publishedAt: post.published_at,
        category: post.category,
        tags: post.tags || []
      }));

      return {
        props: {
          posts: posts
        },
        revalidate: 60 // 60초마다 재생성
      };
    } else {
      console.error('Failed to fetch posts from API:', data.error);
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
