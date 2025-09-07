import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';

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

  useEffect(() => {
    // 정적 데이터가 있으면 사용, 없으면 API에서 가져오기
    if (staticPosts && staticPosts.length > 0) {
      setPosts(staticPosts);
      setLoading(false);
    } else {
      setLoading(true);
      const fetchPosts = async () => {
        try {
          const response = await fetch('/api/blog/posts');
          const data = await response.json();
          
          if (response.ok) {
            setPosts(data.posts);
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
        <title>마쓰구골프 블로그 | 고반발 드라이버 전문 브랜드</title>
        <meta name="description" content="마쓰구골프 블로그에서 고반발 드라이버, 시니어 드라이버, 골프 피팅 등 골프 관련 정보와 고객 후기를 확인하세요." />
        <meta name="keywords" content="고반발 드라이버, 시니어 드라이버, 골프 드라이버, 남성 드라이버, 골프 피팅, 마쓰구골프" />
        <meta property="og:title" content="마쓰구골프 블로그 | 고반발 드라이버 전문 브랜드" />
        <meta property="og:description" content="마쓰구골프 블로그에서 고반발 드라이버, 시니어 드라이버, 골프 피팅 등 골프 관련 정보와 고객 후기를 확인하세요." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://masgolf.co.kr/blog" />
        <link rel="canonical" href="https://masgolf.co.kr/blog" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* 고급스러운 헤더 */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">마쓰구골프 블로그</h1>
                <p className="mt-3 text-slate-600 text-lg font-medium">고반발 드라이버 전문 브랜드의 골프 정보와 고객 후기</p>
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
              <button className="px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                전체
              </button>
              <button className="px-6 py-3 bg-white/70 backdrop-blur-sm text-slate-700 rounded-full text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:-translate-y-0.5">
                고반발 드라이버
              </button>
              <button className="px-6 py-3 bg-white/70 backdrop-blur-sm text-slate-700 rounded-full text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:-translate-y-0.5">
                시니어 드라이버
              </button>
              <button className="px-6 py-3 bg-white/70 backdrop-blur-sm text-slate-700 rounded-full text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:-translate-y-0.5">
                고객 후기
              </button>
              <button className="px-6 py-3 bg-white/70 backdrop-blur-sm text-slate-700 rounded-full text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-all duration-300 hover:-translate-y-0.5">
                이벤트
              </button>
            </div>
          </div>

          {/* 고급스러운 블로그 게시물 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-900/5 border border-slate-200/50 overflow-hidden hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-500 hover:-translate-y-2">
                <Link href={`/blog/${post.slug}`}>
                  <div className="relative h-64 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent z-10"></div>
                    <Image
                      src={post.featured_image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
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
                          {new Date(post.published_at).toLocaleDateString('ko-KR')}
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
          <div className="mt-16 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button className="px-4 py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors duration-200 rounded-xl hover:bg-slate-100">
                이전
              </button>
              <button className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-700 text-white font-semibold rounded-xl shadow-lg">
                1
              </button>
              <button className="px-4 py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors duration-200 rounded-xl hover:bg-slate-100">
                2
              </button>
              <button className="px-4 py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors duration-200 rounded-xl hover:bg-slate-100">
                3
              </button>
              <button className="px-4 py-3 text-slate-500 hover:text-slate-700 font-medium transition-colors duration-200 rounded-xl hover:bg-slate-100">
                다음
              </button>
            </nav>
          </div>
        </main>
      </div>
    </>
  );
}

// 정적 생성용 getStaticProps
export async function getStaticProps() {
  try {
    // 마이그레이션된 게시물 데이터 로드
    const postsDirectory = path.join(process.cwd(), 'mas9golf/migrated-posts');
    const filenames = fs.readdirSync(postsDirectory);
    
    const posts = filenames
      .filter(name => name.endsWith('.json'))
      .map(filename => {
        const filePath = path.join(postsDirectory, filename);
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const postData = JSON.parse(fileContents);
        
        return {
          id: postData.id,
          title: postData.title,
          slug: postData.slug,
          excerpt: postData.excerpt,
          featuredImage: postData.featuredImage,
          publishedAt: postData.publishedAt,
          category: postData.category,
          tags: postData.tags
        };
      })
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    return {
      props: {
        posts: posts
      },
      revalidate: 3600 // 1시간마다 재생성
    };
  } catch (error) {
    console.error('Error loading posts:', error);
    return {
      props: {
        posts: []
      },
      revalidate: 3600
    };
  }
}
