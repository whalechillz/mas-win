import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import AdminNav from '@/components/admin/AdminNav';
import Link from 'next/link';

const BaseChannelEditor = dynamic(() => import('@/components/shared/BaseChannelEditor'), { ssr: false });

export default function NaverBlogEditor() {
  const router = useRouter();
  const { calendarId, hub, title, summary, channelKey, tab } = router.query;
  
  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState('list');
  
  // 허브 모드 상태
  const [isHubMode, setIsHubMode] = useState(false);
  const [hubData, setHubData] = useState(null);
  
  // 네이버 블로그 게시물 목록
  const [naverPosts, setNaverPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 홈피 블로그 게시물 목록 (가져오기용)
  const [homepagePosts, setHomepagePosts] = useState([]);
  const [selectedHomepagePost, setSelectedHomepagePost] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  
  // AI 콘텐츠 생성 관련 상태
  const [roughContent, setRoughContent] = useState('');
  const [isGeneratingFromRough, setIsGeneratingFromRough] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState(null);
  
  // SEO 최적화 관련 상태
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaKeywords, setMetaKeywords] = useState('');
  const [urlSlug, setUrlSlug] = useState('');
  const [isOptimizingSeo, setIsOptimizingSeo] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    messageText: '',
    messageType: 'BLOG',
    characterCount: 0,
    seoKeywords: [],
    estimatedReadTime: 0
  });

  // URL 파라미터 확인 (허브 연동)
  useEffect(() => {
    if (hub && title && summary) {
      setIsHubMode(true);
      setHubData({
        hubId: hub,
        title: decodeURIComponent(title as string),
        summary: decodeURIComponent(summary as string)
      });
      
      // 허브 데이터로 폼 초기화
      setFormData(prev => ({
        ...prev,
        title: decodeURIComponent(title as string),
        messageText: decodeURIComponent(summary as string)
      }));
      
      // 허브 모드일 때는 새 게시물 작성 탭으로 이동
      setActiveTab('create');
    }
  }, [hub, title, summary]);

  // 탭 파라미터 확인
  useEffect(() => {
    if (tab) {
      setActiveTab(tab as string);
    }
  }, [tab]);

  // 네이버 블로그 게시물 목록 가져오기
  const fetchNaverPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/naver-blog');
      if (response.ok) {
        const data = await response.json();
        setNaverPosts(data.data || []);
      }
    } catch (error) {
      console.error('네이버 블로그 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 홈피 블로그 게시물 목록 가져오기
  const fetchHomepagePosts = async () => {
    try {
      const response = await fetch('/api/admin/blog');
      if (response.ok) {
        const data = await response.json();
        setHomepagePosts(data.posts || []);
      }
    } catch (error) {
      console.error('홈피 블로그 목록 조회 오류:', error);
    }
  };

  // 홈피 블로그에서 네이버 블로그로 가져오기
  const handleImportFromHomepage = async () => {
    if (!selectedHomepagePost) {
      alert('가져올 게시물을 선택해주세요.');
      return;
    }

    setImportLoading(true);
    try {
      // 홈피 블로그 데이터를 네이버 블로그 형식으로 변환
      const importData = {
        title: selectedHomepagePost.title,
        content: selectedHomepagePost.content,
        excerpt: selectedHomepagePost.summary || '',
        account_name: 'default',
        status: 'draft',
        hub_content_id: selectedHomepagePost.calendar_id || null
      };

      const response = await fetch('/api/admin/naver-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('홈피 블로그에서 성공적으로 가져왔습니다!');
        
        // 새 게시물 작성 탭으로 이동하고 폼 데이터 설정
        setFormData({
          title: selectedHomepagePost.title,
          messageText: selectedHomepagePost.content,
          messageType: 'BLOG',
          characterCount: selectedHomepagePost.content.length,
          seoKeywords: [],
          estimatedReadTime: Math.ceil(selectedHomepagePost.content.length / 200)
        });
        
        setActiveTab('create');
        setSelectedHomepagePost(null);
        
        // 네이버 블로그 목록 새로고침
        fetchNaverPosts();
      } else {
        const error = await response.json();
        alert('가져오기 실패: ' + error.message);
      }
    } catch (error) {
      console.error('가져오기 오류:', error);
      alert('가져오기 중 오류가 발생했습니다.');
    } finally {
      setImportLoading(false);
    }
  };

  // AI 콘텐츠 생성 함수들
  const generateContentFromRough = async () => {
    if (!roughContent.trim()) {
      alert('러프 콘텐츠를 입력해주세요.');
      return;
    }

    setIsGeneratingFromRough(true);
    try {
      const response = await fetch('/api/admin/generate-blog-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roughContent,
          contentType: '네이버 블로그',
          persona: '중상급 골퍼',
          brandWeight: 'medium'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAiGeneratedContent(result);
        
        // 생성된 콘텐츠로 폼 데이터 업데이트
        setFormData(prev => ({
          ...prev,
          title: result.title || '',
          messageText: result.content || '',
          characterCount: (result.content || '').length,
          estimatedReadTime: Math.ceil((result.content || '').length / 200)
        }));
        
        alert('AI가 콘텐츠를 생성했습니다!');
      } else {
        const error = await response.json();
        alert('AI 생성 실패: ' + error.message);
      }
    } catch (error) {
      console.error('AI 생성 오류:', error);
      alert('AI 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingFromRough(false);
    }
  };

  const generateTitle = async () => {
    if (!formData.messageText.trim()) {
      alert('내용을 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const response = await fetch('/api/admin/generate-blog-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.messageText,
          contentType: '네이버 블로그'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({
          ...prev,
          title: result.title || prev.title
        }));
        alert('AI가 제목을 생성했습니다!');
      } else {
        const error = await response.json();
        alert('제목 생성 실패: ' + error.message);
      }
    } catch (error) {
      console.error('제목 생성 오류:', error);
      alert('제목 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // SEO 최적화 함수
  const optimizeSeo = async () => {
    if (!formData.title.trim() || !formData.messageText.trim()) {
      alert('제목과 내용을 먼저 입력해주세요.');
      return;
    }

    setIsOptimizingSeo(true);
    try {
      const response = await fetch('/api/admin/optimize-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.messageText,
          contentType: '네이버 블로그'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setMetaTitle(result.metaTitle || '');
        setMetaDescription(result.metaDescription || '');
        setMetaKeywords(result.metaKeywords || '');
        setUrlSlug(result.urlSlug || '');
        alert('SEO 최적화가 완료되었습니다!');
      } else {
        const error = await response.json();
        alert('SEO 최적화 실패: ' + error.message);
      }
    } catch (error) {
      console.error('SEO 최적화 오류:', error);
      alert('SEO 최적화 중 오류가 발생했습니다.');
    } finally {
      setIsOptimizingSeo(false);
    }
  };

  // URL 슬러그 자동 생성
  const generateUrlSlug = () => {
    if (!formData.title.trim()) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    const slug = formData.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    
    setUrlSlug(slug);
  };

  // 포스트 보기 핸들러
  const handleViewPost = (post: any) => {
    // 네이버 블로그 URL이 있으면 새 탭에서 열기
    if (post.naver_post_url) {
      window.open(post.naver_post_url, '_blank');
    } else {
      // 네이버 블로그 URL이 없으면 미리보기 모달 표시
      alert(`네이버 블로그 URL이 없습니다.\n제목: ${post.title}\n상태: ${post.status}`);
    }
  };

  // 포스트 편집 핸들러
  const handleEditPost = (post: any) => {
    // 네이버 블로그 고급 에디터로 이동
    window.open(`/admin/naver-blog-advanced?edit=${post.id}`, '_blank');
  };

  // 포스트 삭제 핸들러
  const handleDeletePost = async (postId: string) => {
    if (!confirm('이 네이버 블로그 포스트를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/naver-blog/${postId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('네이버 블로그 포스트가 삭제되었습니다.');
        fetchNaverPosts(); // 목록 새로고침
      } else {
        const error = await response.json();
        alert('삭제 실패: ' + error.message);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 목록 로드
  useEffect(() => {
    if (activeTab === 'list') {
      fetchNaverPosts();
    } else if (activeTab === 'import') {
      fetchHomepagePosts();
    }
  }, [activeTab]);

  // 네이버 블로그 특화 컴포넌트
  const NaverSpecificComponents = () => (
    <div className="space-y-6">
      {/* 허브 콘텐츠 연동 정보 */}
      {isHubMode && hubData && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-red-500 text-lg">®</span>
            <h3 className="text-lg font-semibold text-purple-900">허브 콘텐츠 연동</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-sm font-medium text-gray-700 w-16">제목:</span>
              <span className="text-sm text-gray-900">{hubData.title}</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-sm font-medium text-gray-700 w-16">요약:</span>
              <span className="text-sm text-gray-900">{hubData.summary}</span>
            </div>
            <div className="flex items-center space-x-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  setIsHubMode(false);
                  setHubData(null);
                }}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                허브 연동 해제
              </button>
              <span className="text-xs text-gray-500">
                허브 콘텐츠를 기반으로 네이버 블로그를 작성합니다
              </span>
            </div>
          </div>
        </div>
      )}
      {/* SEO 최적화 섹션 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-900">SEO 최적화</h3>
          <button
            onClick={optimizeSeo}
            disabled={!formData.title.trim() || !formData.messageText.trim() || isOptimizingSeo}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isOptimizingSeo ? '최적화 중...' : 'AI 최적화'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 메타 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메타 제목 ({metaTitle.length}/60)
            </label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                metaTitle.length > 60 ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="검색 결과에 표시될 제목"
              maxLength={60}
            />
            {metaTitle.length > 60 && (
              <p className="text-red-500 text-xs mt-1">60자를 초과했습니다</p>
            )}
          </div>
          
          {/* 메타 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메타 설명 ({metaDescription.length}/160)
            </label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                metaDescription.length > 160 ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="검색 결과에 표시될 설명"
              maxLength={160}
              rows={3}
            />
            {metaDescription.length > 160 && (
              <p className="text-red-500 text-xs mt-1">160자를 초과했습니다</p>
            )}
          </div>
          
          {/* 메타 키워드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메타 키워드
            </label>
            <input
              type="text"
              value={metaKeywords}
              onChange={(e) => setMetaKeywords(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="쉼표로 구분된 키워드"
            />
          </div>
          
          {/* URL 슬러그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL 슬러그
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={urlSlug}
                onChange={(e) => setUrlSlug(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="url-friendly-slug"
              />
              <button
                onClick={generateUrlSlug}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                자동 생성
              </button>
            </div>
          </div>
        </div>
        
        {/* SEO 개선 권장사항 */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">개선 권장사항</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            {metaTitle.length < 30 && <li>• 메타 제목은 30-60자 사이여야 합니다.</li>}
            {metaDescription.length < 120 && <li>• 메타 설명은 120-160자 사이여야 합니다.</li>}
            {!metaKeywords.trim() && <li>• 메타 키워드를 입력해주세요.</li>}
            {!urlSlug.trim() && <li>• 슬러그는 소문자, 숫자, 하이픈만 사용 가능합니다.</li>}
            {!formData.title.includes('골프') && !formData.title.includes('드라이버') && <li>• 제목에 주요 키워드를 포함해주세요.</li>}
          </ul>
        </div>
      </div>

      {/* 예상 읽기 시간 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          예상 읽기 시간
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            약 {formData.estimatedReadTime}분
          </span>
          <span className="text-xs text-gray-500">
            (분당 200자 기준)
          </span>
        </div>
      </div>

      {/* 네이버 블로그 미리보기 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          네이버 블로그 미리보기
        </label>
        <div className="bg-green-100 p-4 rounded-lg max-w-2xl">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">N</span>
              </div>
              <span className="text-sm font-medium">네이버 블로그</span>
            </div>
            <div className="space-y-2">
              {formData.title && (
                <h2 className="text-lg font-bold text-gray-900">
                  {formData.title}
                </h2>
              )}
              {formData.messageText && (
                <div className="text-sm text-gray-700 leading-relaxed">
                  {formData.messageText}
                </div>
              )}
              {formData.seoKeywords.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">키워드:</div>
                  <div className="flex flex-wrap gap-1">
                    {formData.seoKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 수동 복사 안내 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">
          📋 수동 복사 안내
        </h3>
        <p className="text-sm text-yellow-700 mb-3">
          네이버 블로그는 API 제한으로 인해 자동 발송이 불가능합니다. 
          아래 내용을 복사하여 네이버 블로그에 직접 붙여넣기 해주세요.
        </p>
        <button
          onClick={() => {
            const content = `${formData.title}\n\n${formData.messageText}`;
            navigator.clipboard.writeText(content);
            alert('내용이 클립보드에 복사되었습니다!');
          }}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
        >
          내용 복사하기
        </button>
      </div>
    </div>
  );

  // 탭 렌더링 함수
  const renderTabContent = () => {
    switch (activeTab) {
      case 'list':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">네이버 블로그 목록</h2>
              <button
                onClick={() => window.open('/admin/naver-blog-advanced/', '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                새 게시물 작성 (고급 에디터)
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">로딩 중...</div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          제목
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작성일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          허브 연동
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          액션
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {naverPosts.map((post: any) => (
                        <tr key={post.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{post.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {post.status === 'published' ? '발행됨' : '초안'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(post.created_at).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {post.calendar_id ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                🔗 연결됨: {post.calendar_id.substring(0, 8)}...
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                미연결
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleViewPost(post)}
                                className="text-green-600 hover:text-green-900"
                              >
                                보기
                              </button>
                              <button 
                                onClick={() => handleEditPost(post)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                수정
                              </button>
                              <button 
                                onClick={() => handleDeletePost(post.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'create':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">새 게시물 작성</h2>
              <button
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                목록으로
              </button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">🚀 고급 에디터로 이동</h3>
              <p className="text-blue-700 mb-4">
                더 강력한 기능을 제공하는 고급 네이버 블로그 에디터를 사용하세요.
              </p>
              <button
                onClick={() => window.open('/admin/naver-blog-advanced/', '_blank')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                고급 에디터 열기
              </button>
            </div>
          </div>
        );
      
      case 'import':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">홈피에서 가져오기</h2>
              <button
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                목록으로
              </button>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-green-900 mb-2">🚀 고급 에디터로 이동</h3>
              <p className="text-green-700 mb-4">
                더 강력한 홈피에서 가져오기 기능을 제공하는 고급 네이버 블로그 에디터를 사용하세요.
              </p>
              <button
                onClick={() => window.open('/admin/naver-blog-advanced/?tab=import', '_blank')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                고급 에디터 열기
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">홈피 블로그에서 가져오기</h3>
              <p className="text-gray-600 mb-6">
                홈피 블로그의 기존 게시물을 네이버 블로그 형식으로 변환하여 가져올 수 있습니다.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    홈피 블로그 게시물 선택
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedHomepagePost?.id || ''}
                    onChange={(e) => {
                      const postId = e.target.value;
                      const post = homepagePosts.find(p => p.id.toString() === postId);
                      setSelectedHomepagePost(post || null);
                    }}
                  >
                    <option value="">게시물을 선택하세요</option>
                    {homepagePosts.map((post: any) => (
                      <option key={post.id} value={post.id}>
                        {post.title} {post.calendar_id ? '(허브 연결됨)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 선택된 게시물 미리보기 */}
                {selectedHomepagePost && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">선택된 게시물 미리보기</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">제목:</span>
                        <span className="text-sm text-gray-900 ml-2">{selectedHomepagePost.title}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">요약:</span>
                        <span className="text-sm text-gray-900 ml-2">{selectedHomepagePost.summary}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">허브 연동:</span>
                        <span className={`text-sm ml-2 ${
                          selectedHomepagePost.calendar_id ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {selectedHomepagePost.calendar_id ? '연결됨' : '미연결'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-4">
                  <button 
                    onClick={handleImportFromHomepage}
                    disabled={!selectedHomepagePost || importLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {importLoading ? '가져오는 중...' : '가져오기'}
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedHomepagePost(null);
                      setActiveTab('list');
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">네이버 블로그 관리</h1>
            <Link href="/admin" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
              ← 메인 대시보드로 돌아가기
            </Link>
          </div>
          
          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📝 블로그 목록
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ✏️ 새 게시물 작성
              </button>
              <button
                onClick={() => window.open('/admin/naver-blog-advanced/?tab=import', '_blank')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'import'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📥 홈피에서 가져오기 (고급 에디터)
              </button>
            </nav>
          </div>
          
          {/* 탭 컨텐츠 */}
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
