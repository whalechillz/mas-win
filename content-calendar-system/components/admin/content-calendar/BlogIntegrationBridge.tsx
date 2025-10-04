// Blog Integration Bridge Component
// /components/admin/content-calendar/BlogIntegrationBridge.tsx

import React, { useState, useEffect } from 'react';
import { ContentCalendarItem } from '@/types';
import IntegrationConfig from '@/lib/config/integration';

interface BlogIntegrationBridgeProps {
  onImport: (content: ContentCalendarItem) => void;
}

interface BlogPost {
  id: string;
  title: string;
  content: string;
  status: string;
  publishedAt: Date;
  tags: string[];
  author: string;
  viewCount: number;
}

interface NaverScrapedPost {
  id: string;
  title: string;
  content: string;
  originalUrl: string;
  scrapedAt: Date;
  tags: string[];
  images: string[];
  author: string;
}

const BlogIntegrationBridge: React.FC<BlogIntegrationBridgeProps> = ({
  onImport
}) => {
  const [activeTab, setActiveTab] = useState<'blog' | 'naver'>('blog');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [naverPosts, setNaverPosts] = useState<NaverScrapedPost[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // =====================================================
  // 데이터 로드
  // =====================================================
  useEffect(() => {
    loadExistingContent();
  }, [activeTab]);

  const loadExistingContent = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'blog') {
        await loadBlogPosts();
      } else {
        await loadNaverScrapedPosts();
      }
    } catch (error) {
      console.error('콘텐츠 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBlogPosts = async () => {
    const response = await fetch('/api/blog/posts?limit=50&notInCalendar=true');
    const data = await response.json();
    setBlogPosts(data.posts || []);
  };

  const loadNaverScrapedPosts = async () => {
    const response = await fetch('/api/blog/naver-scraper/posts?notImported=true');
    const data = await response.json();
    setNaverPosts(data.posts || []);
  };

  // =====================================================
  // 가져오기 처리
  // =====================================================
  const handleImportSelected = async () => {
    if (selectedPosts.length === 0) {
      alert('가져올 콘텐츠를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      for (const postId of selectedPosts) {
        if (activeTab === 'blog') {
          await importBlogPost(postId);
        } else {
          await importNaverPost(postId);
        }
      }
      
      alert(`${selectedPosts.length}개 콘텐츠를 캘린더로 가져왔습니다.`);
      setSelectedPosts([]);
      loadExistingContent();
    } catch (error) {
      console.error('가져오기 실패:', error);
      alert('일부 콘텐츠 가져오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const importBlogPost = async (postId: string) => {
    const post = blogPosts.find(p => p.id === postId);
    if (!post) return;

    const calendarItem: Partial<ContentCalendarItem> = {
      title: post.title,
      contentBody: post.content,
      contentType: 'blog',
      status: post.status === 'published' ? 'published' : 'draft',
      contentDate: new Date(post.publishedAt),
      keywords: post.tags,
      source: 'blog_import',
      blogPostId: post.id,
      performanceMetrics: {
        views: post.viewCount
      }
    };

    // API 호출로 캘린더에 저장
    const response = await fetch('/api/content-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calendarItem)
    });

    if (response.ok) {
      const savedContent = await response.json();
      onImport(savedContent.data);
    }
  };

  const importNaverPost = async (postId: string) => {
    const post = naverPosts.find(p => p.id === postId);
    if (!post) return;

    const calendarItem: Partial<ContentCalendarItem> = {
      title: post.title,
      contentBody: post.content,
      contentType: 'blog',
      status: 'draft',
      contentDate: new Date(post.scrapedAt),
      keywords: post.tags,
      hashtags: post.tags.map(tag => `#${tag}`),
      thumbnailUrl: post.images[0],
      source: 'naver_scraper',
      naverScraperId: post.id,
      seoMeta: {
        originalUrl: post.originalUrl,
        author: post.author
      }
    };

    const response = await fetch('/api/content-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calendarItem)
    });

    if (response.ok) {
      const savedContent = await response.json();
      
      // 네이버 스크래퍼 테이블 업데이트
      await fetch(`/api/blog/naver-scraper/mark-imported/${postId}`, {
        method: 'PUT'
      });
      
      onImport(savedContent.data);
    }
  };

  // =====================================================
  // 필터링
  // =====================================================
  const filteredBlogPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredNaverPosts = naverPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // =====================================================
  // 렌더링
  // =====================================================
  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-4">기존 콘텐츠 가져오기</h2>
        
        {/* Tabs */}
        <div className="flex space-x-1 mb-4">
          <button
            onClick={() => setActiveTab('blog')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'blog'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            블로그 포스트
          </button>
          <button
            onClick={() => setActiveTab('naver')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'naver'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            네이버 스크랩
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center justify-between">
          <input
            type="text"
            placeholder="제목 또는 태그로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 max-w-sm px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {selectedPosts.length}개 선택됨
            </span>
            <button
              onClick={handleImportSelected}
              disabled={selectedPosts.length === 0 || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              캘린더로 가져오기
            </button>
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">로딩 중...</p>
          </div>
        ) : (
          <>
            {activeTab === 'blog' && (
              <BlogPostsList
                posts={filteredBlogPosts}
                selectedPosts={selectedPosts}
                onToggleSelect={(id) => {
                  setSelectedPosts(prev =>
                    prev.includes(id)
                      ? prev.filter(p => p !== id)
                      : [...prev, id]
                  );
                }}
              />
            )}
            
            {activeTab === 'naver' && (
              <NaverPostsList
                posts={filteredNaverPosts}
                selectedPosts={selectedPosts}
                onToggleSelect={(id) => {
                  setSelectedPosts(prev =>
                    prev.includes(id)
                      ? prev.filter(p => p !== id)
                      : [...prev, id]
                  );
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

// =====================================================
// Sub Components
// =====================================================

const BlogPostsList: React.FC<{
  posts: BlogPost[];
  selectedPosts: string[];
  onToggleSelect: (id: string) => void;
}> = ({ posts, selectedPosts, onToggleSelect }) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        가져올 수 있는 블로그 포스트가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map(post => (
        <div
          key={post.id}
          className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
        >
          <input
            type="checkbox"
            checked={selectedPosts.includes(post.id)}
            onChange={() => onToggleSelect(post.id)}
            className="mr-4"
          />
          
          <div className="flex-1">
            <h4 className="font-medium">{post.title}</h4>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>작성자: {post.author}</span>
              <span>발행일: {new Date(post.publishedAt).toLocaleDateString()}</span>
              <span>조회수: {post.viewCount}</span>
            </div>
            {post.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <span className={`px-2 py-1 text-xs rounded ${
            post.status === 'published' 
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {post.status}
          </span>
        </div>
      ))}
    </div>
  );
};

const NaverPostsList: React.FC<{
  posts: NaverScrapedPost[];
  selectedPosts: string[];
  onToggleSelect: (id: string) => void;
}> = ({ posts, selectedPosts, onToggleSelect }) => {
  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        가져올 수 있는 네이버 스크랩 포스트가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map(post => (
        <div
          key={post.id}
          className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
        >
          <input
            type="checkbox"
            checked={selectedPosts.includes(post.id)}
            onChange={() => onToggleSelect(post.id)}
            className="mr-4"
          />
          
          <div className="flex-1">
            <h4 className="font-medium">{post.title}</h4>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>작성자: {post.author}</span>
              <span>스크랩일: {new Date(post.scrapedAt).toLocaleDateString()}</span>
              <a
                href={post.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                원본 보기
              </a>
            </div>
            {post.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {post.images.length > 0 && (
              <div className="flex gap-2 mt-2">
                {post.images.slice(0, 3).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt=""
                    className="w-16 h-16 object-cover rounded"
                  />
                ))}
                {post.images.length > 3 && (
                  <span className="flex items-center text-sm text-gray-500">
                    +{post.images.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
            네이버
          </span>
        </div>
      ))}
    </div>
  );
};

export default BlogIntegrationBridge;
