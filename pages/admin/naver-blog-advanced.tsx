import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import AdminNav from '@/components/admin/AdminNav';

// 동적 임포트
const TipTapEditor = dynamic(() => import('@/components/admin/TipTapEditor'), { ssr: false });
const GalleryPicker = dynamic(() => import('@/components/admin/GalleryPicker'), { ssr: false });
const BrandStrategySelector = dynamic(() => import('@/components/admin/BrandStrategySelector'), { ssr: false });

export default function NaverBlogAdvanced() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { hub, title, summary, edit, id } = router.query;

  // 기본 상태 관리
  const [activeTab, setActiveTab] = useState('list');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 편집 관련 상태
  const [editingPost, setEditingPost] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // 허브 연동 상태
  const [isHubMode, setIsHubMode] = useState(false);
  const [hubData, setHubData] = useState(null);
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    category: '골프',
    tags: [],
    featured_image: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    naver_blog_id: '',
    naver_post_url: '',
    naver_tags: [],
    naver_category: '골프',
    naver_visibility: 'public',
    naver_allow_comments: true,
    naver_allow_trackbacks: true
  });

  // AI 콘텐츠 생성 관련 상태
  const [roughContent, setRoughContent] = useState('');
  const [isGeneratingFromRough, setIsGeneratingFromRough] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [aiGeneratedContent, setAiGeneratedContent] = useState(null);

  // 네이버 특화 SEO 상태
  const [naverSeoScore, setNaverSeoScore] = useState(0);
  const [naverSeoAnalysis, setNaverSeoAnalysis] = useState(null);
  const [isAnalyzingSeo, setIsAnalyzingSeo] = useState(false);

  // 네이버 블로그 최적화 상태
  const [naverOptimization, setNaverOptimization] = useState({
    keywordDensity: 0,
    readabilityScore: 0,
    engagementScore: 0,
    trendingKeywords: [],
    competitorAnalysis: null
  });

  // 이미지 생성 관련 상태
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenerationPrompt, setImageGenerationPrompt] = useState('');
  const [imageGenerationCount, setImageGenerationCount] = useState(1);

  // 네이버 블로그 특화 기능 상태
  const [naverTrends, setNaverTrends] = useState([]);
  const [naverCompetitors, setNaverCompetitors] = useState([]);
  const [naverBestTimes, setNaverBestTimes] = useState([]);
  const [naverHashtags, setNaverHashtags] = useState([]);

  // 블로그 소스에서 가져오기 관련 상태
  const [homepagePosts, setHomepagePosts] = useState([]);
  const [selectedHomepagePost, setSelectedHomepagePost] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // 미리보기 관련 상태
  const [previewPost, setPreviewPost] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // 브랜드 전략 상태
  const [brandStrategy, setBrandStrategy] = useState({
    contentType: '골프 정보',
    persona: 'tech_enthusiast',
    framework: 'PAS',
    channel: 'local',
    brandStrength: '낮음',
    audienceTemperature: 'warm',
    conversionGoal: 'consideration'
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
        content: decodeURIComponent(summary as string),
        excerpt: decodeURIComponent(summary as string)
      }));
      
      // 허브 모드일 때는 새 게시물 작성 탭으로 이동
      setActiveTab('create');
      setShowForm(true);
    }
  }, [hub, title, summary]);

  // 편집 모드 확인
  useEffect(() => {
    if (edit || id) {
      const postId = edit || id;
      setEditingPostId(postId as string);
      setActiveTab('create');
      setShowForm(true);
      loadPostForEdit(parseInt(postId as string));
    }
  }, [edit, id]);

  // 네이버 블로그 게시물 목록 가져오기
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/naver-blog');
      if (response.ok) {
        const data = await response.json();
        console.log('📝 네이버 블로그 API 응답:', data);
        setPosts(data.data || []);
      } else {
        console.error('❌ 네이버 블로그 API 오류:', response.status);
      }
    } catch (error) {
      console.error('❌ 네이버 블로그 목록 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 특정 게시물 로드 (편집용)
  const loadPostForEdit = async (postId: number) => {
    try {
      const response = await fetch(`/api/admin/naver-blog/${postId}`);
      if (response.ok) {
        const data = await response.json();
        setEditingPost(data.data);
        setFormData({
          title: data.data.title || '',
          content: data.data.content || '',
          excerpt: data.data.excerpt || '',
          status: data.data.status || 'draft',
          category: data.data.category || '골프',
          tags: data.data.tags || [],
          featured_image: data.data.featured_image || '',
          meta_title: data.data.meta_title || '',
          meta_description: data.data.meta_description || '',
          meta_keywords: data.data.meta_keywords || '',
          naver_blog_id: data.data.naver_blog_id || '',
          naver_post_url: data.data.naver_post_url || '',
          naver_tags: data.data.naver_tags || [],
          naver_category: data.data.naver_category || '골프',
          naver_visibility: data.data.naver_visibility || 'public',
          naver_allow_comments: data.data.naver_allow_comments !== false,
          naver_allow_trackbacks: data.data.naver_allow_trackbacks !== false
        });
      }
    } catch (error) {
      console.error('게시물 로드 오류:', error);
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
          brandWeight: 'medium',
          platform: 'naver'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAiGeneratedContent(result);
        
        // 생성된 콘텐츠로 폼 데이터 업데이트
        setFormData(prev => ({
          ...prev,
          title: result.title || '',
          content: result.content || '',
          excerpt: result.excerpt || ''
        }));
        
        alert('AI가 네이버 블로그에 최적화된 콘텐츠를 생성했습니다!');
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
    if (!formData.content.trim()) {
      alert('내용을 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const response = await fetch('/api/admin/generate-blog-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content,
          contentType: '네이버 블로그',
          platform: 'naver'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setFormData(prev => ({
          ...prev,
          title: result.title || prev.title
        }));
        alert('AI가 네이버 블로그에 최적화된 제목을 생성했습니다!');
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

  // 네이버 SEO 분석
  const analyzeNaverSeo = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 먼저 입력해주세요.');
      return;
    }

    setIsAnalyzingSeo(true);
    try {
      const response = await fetch('/api/admin/analyze-naver-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          category: formData.category
        })
      });

      if (response.ok) {
        const result = await response.json();
        setNaverSeoScore(result.score);
        setNaverSeoAnalysis(result.analysis);
        setNaverOptimization(result.optimization);
        alert(`네이버 SEO 분석 완료! 점수: ${result.score}/100`);
      } else {
        const error = await response.json();
        alert('SEO 분석 실패: ' + error.message);
      }
    } catch (error) {
      console.error('SEO 분석 오류:', error);
      alert('SEO 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzingSeo(false);
    }
  };

  // 네이버 트렌드 분석
  const fetchNaverTrends = async () => {
    try {
      const response = await fetch('/api/admin/naver-trends');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 네이버 트렌드 API 응답:', data);
        setNaverTrends(data.trends || []);
        setNaverCompetitors(data.competitors || []);
        setNaverBestTimes(data.bestTimes || []);
        setNaverHashtags(data.hashtags || []);
      } else {
        console.error('❌ 네이버 트렌드 API 오류:', response.status);
      }
    } catch (error) {
      console.error('❌ 네이버 트렌드 조회 오류:', error);
    }
  };

  // 이미지 생성
  const generateImages = async () => {
    if (!imageGenerationPrompt.trim()) {
      alert('이미지 생성 프롬프트를 입력해주세요.');
      return;
    }

    setIsGeneratingImages(true);
    try {
      const response = await fetch('/api/generate-paragraph-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imageGenerationPrompt,
          count: imageGenerationCount,
          style: 'naver-blog-optimized'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedImages(result.images || []);
        alert(`${result.images.length}개의 이미지가 생성되었습니다!`);
      } else {
        const error = await response.json();
        alert('이미지 생성 실패: ' + error.message);
      }
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // 게시물 저장
  const savePost = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingPostId ? `/api/admin/naver-blog/${editingPostId}` : '/api/admin/naver-blog';
      const method = editingPostId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          hub_content_id: hubData?.hubId || null
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(editingPostId ? '게시물이 수정되었습니다!' : '게시물이 저장되었습니다!');
        
        // 폼 초기화
        setFormData({
          title: '',
          content: '',
          excerpt: '',
          status: 'draft',
          category: '골프',
          tags: [],
          featured_image: '',
          meta_title: '',
          meta_description: '',
          meta_keywords: '',
          naver_blog_id: '',
          naver_post_url: '',
          naver_tags: [],
          naver_category: '골프',
          naver_visibility: 'public',
          naver_allow_comments: true,
          naver_allow_trackbacks: true
        });
        
        setShowForm(false);
        setEditingPostId(null);
        setEditingPost(null);
        fetchPosts();
      } else {
        const error = await response.json();
        alert('저장 실패: ' + error.message);
      }
    } catch (error) {
      console.error('저장 오류:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 홈페이지 블로그 포스트 가져오기
  const fetchHomepagePosts = async () => {
    try {
      console.log('🔄 홈페이지 블로그 포스트 조회 시작...');
      const response = await fetch('/api/admin/blog');
      const data = await response.json();
      console.log('📝 API 응답:', data);
      
      if (data.posts) {
        setHomepagePosts(data.posts);
        console.log('✅ 홈페이지 블로그 포스트 로드 성공:', data.posts.length, '개');
      } else {
        console.warn('⚠️ 홈페이지 블로그 포스트가 없습니다.');
        setHomepagePosts([]);
      }
    } catch (error) {
      console.error('❌ 홈페이지 블로그 조회 오류:', error);
      setHomepagePosts([]);
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
        excerpt: selectedHomepagePost.excerpt || '',
        status: 'draft',
        category: selectedHomepagePost.category || '골프',
        tags: selectedHomepagePost.tags || [],
        featured_image: selectedHomepagePost.featured_image || '',
        meta_title: selectedHomepagePost.meta_title || selectedHomepagePost.title,
        meta_description: selectedHomepagePost.meta_description || selectedHomepagePost.excerpt || '',
        meta_keywords: selectedHomepagePost.meta_keywords || '',
        naver_tags: selectedHomepagePost.tags || [],
        naver_category: selectedHomepagePost.category || '골프',
        calendar_id: hubData?.hubId || null
      };

      // 폼 데이터에 가져온 데이터 설정
      setFormData(prev => ({
        ...prev,
        title: importData.title,
        content: importData.content,
        excerpt: importData.excerpt,
        category: importData.category,
        tags: importData.tags,
        featured_image: importData.featured_image,
        meta_title: importData.meta_title,
        meta_description: importData.meta_description,
        meta_keywords: importData.meta_keywords,
        naver_tags: importData.naver_tags,
        naver_category: importData.naver_category
      }));

      alert('홈피 블로그에서 성공적으로 가져왔습니다!');
      setSelectedHomepagePost(null);
      setActiveTab('create');
    } catch (error) {
      console.error('가져오기 오류:', error);
      alert('가져오기 중 오류가 발생했습니다.');
    } finally {
      setImportLoading(false);
    }
  };

  // 포스트 보기 핸들러
  const handleViewPost = (post: any) => {
    // 네이버 블로그 URL이 있으면 새 탭에서 열기
    if (post.naver_post_url) {
      window.open(post.naver_post_url, '_blank');
    } else {
      // 네이버 블로그 URL이 없으면 미리보기 모달 표시
      setPreviewPost(post);
      setShowPreview(true);
    }
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
        fetchPosts(); // 목록 새로고침
      } else {
        const error = await response.json();
        alert('삭제 실패: ' + error.message);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (activeTab === 'list') {
      fetchPosts();
    } else if (activeTab === 'import') {
      fetchHomepagePosts();
    }
    fetchNaverTrends();
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

      {/* 네이버 SEO 최적화 섹션 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-900">네이버 SEO 최적화</h3>
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-green-600">{naverSeoScore}/100</div>
            <button
              onClick={analyzeNaverSeo}
              disabled={!formData.title.trim() || !formData.content.trim() || isAnalyzingSeo}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isAnalyzingSeo ? '분석 중...' : 'SEO 분석'}
            </button>
          </div>
        </div>
        
        {naverSeoAnalysis && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-600">키워드 밀도</div>
                <div className="text-lg font-bold text-blue-600">{naverOptimization.keywordDensity}%</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-600">가독성 점수</div>
                <div className="text-lg font-bold text-green-600">{naverOptimization.readabilityScore}/100</div>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-600">참여도 점수</div>
                <div className="text-lg font-bold text-purple-600">{naverOptimization.engagementScore}/100</div>
              </div>
            </div>
            
            {naverSeoAnalysis.recommendations && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">개선 권장사항</h4>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {naverSeoAnalysis.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 네이버 트렌드 분석 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">네이버 트렌드 분석</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">인기 키워드</h4>
            <div className="flex flex-wrap gap-1">
              {naverTrends && naverTrends.length > 0 ? naverTrends.slice(0, 10).map((trend, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {trend && typeof trend === 'object' && trend.keyword ? trend.keyword : `트렌드 ${index + 1}`}
                </span>
              )) : (
                <span className="text-gray-500 text-sm">트렌드 데이터를 불러오는 중...</span>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">추천 해시태그</h4>
            <div className="flex flex-wrap gap-1">
              {naverHashtags && naverHashtags.length > 0 ? naverHashtags.slice(0, 10).map((hashtag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                >
                  #{typeof hashtag === 'string' ? hashtag : `해시태그${index + 1}`}
                </span>
              )) : (
                <span className="text-gray-500 text-sm">해시태그 데이터를 불러오는 중...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 네이버 블로그 설정 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">네이버 블로그 설정</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              네이버 블로그 ID
            </label>
            <input
              type="text"
              value={formData.naver_blog_id}
              onChange={(e) => setFormData(prev => ({ ...prev, naver_blog_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="네이버 블로그 ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              가시성
            </label>
            <select
              value={formData.naver_visibility}
              onChange={(e) => setFormData(prev => ({ ...prev, naver_visibility: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">공개</option>
              <option value="private">비공개</option>
              <option value="friends">친구만</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              네이버 태그
            </label>
            <input
              type="text"
              value={formData.naver_tags.join(', ')}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                naver_tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="태그1, 태그2, 태그3"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              네이버 카테고리
            </label>
            <select
              value={formData.naver_category}
              onChange={(e) => setFormData(prev => ({ ...prev, naver_category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="골프">골프</option>
              <option value="스포츠">스포츠</option>
              <option value="라이프스타일">라이프스타일</option>
              <option value="기타">기타</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.naver_allow_comments}
              onChange={(e) => setFormData(prev => ({ ...prev, naver_allow_comments: e.target.checked }))}
              className="mr-2"
            />
            댓글 허용
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.naver_allow_trackbacks}
              onChange={(e) => setFormData(prev => ({ ...prev, naver_allow_trackbacks: e.target.checked }))}
              className="mr-2"
            />
            트랙백 허용
          </label>
        </div>
      </div>

      {/* 이미지 생성 섹션 */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">AI 이미지 생성</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 생성 프롬프트
            </label>
            <textarea
              value={imageGenerationPrompt}
              onChange={(e) => setImageGenerationPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 h-20"
              placeholder="네이버 블로그에 최적화된 이미지를 생성할 프롬프트를 입력하세요"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                생성 개수
              </label>
              <select
                value={imageGenerationCount}
                onChange={(e) => setImageGenerationCount(parseInt(e.target.value) as 1 | 2 | 3 | 4)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={1}>1개</option>
                <option value={2}>2개</option>
                <option value={3}>3개</option>
                <option value={4}>4개</option>
              </select>
            </div>
            
            <button
              onClick={generateImages}
              disabled={!imageGenerationPrompt.trim() || isGeneratingImages}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isGeneratingImages ? '생성 중...' : '이미지 생성'}
            </button>
          </div>
          
          {generatedImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {generatedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.url}
                    alt={`Generated image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, featured_image: image.url }))}
                    className="absolute bottom-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    선택
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 네이버 블로그 미리보기 */}
      <div className="bg-green-100 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-4">네이버 블로그 미리보기</h3>
        
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
            
            {formData.content && (
              <div className="text-sm text-gray-700 leading-relaxed">
                {formData.content.substring(0, 200)}...
              </div>
            )}
            
            {formData.naver_tags.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">태그:</div>
                <div className="flex flex-wrap gap-1">
                  {formData.naver_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
            const content = `${formData.title}\n\n${formData.content}`;
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
                onClick={() => {
                  setActiveTab('create');
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                새 게시물 작성
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
                      {posts.map((post: any) => (
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
                                onClick={() => {
                                  setEditingPostId(post.id);
                                  setActiveTab('create');
                                  setShowForm(true);
                                  loadPostForEdit(post.id);
                                }}
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
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPostId ? '게시물 수정' : '새 게시물 작성'}
              </h2>
              <button
                onClick={() => {
                  setActiveTab('list');
                  setShowForm(false);
                  setEditingPostId(null);
                  setEditingPost(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                목록으로
              </button>
            </div>
            
            {/* AI 콘텐츠 생성 섹션 */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-purple-600 text-xl">⚡</span>
                <h3 className="text-lg font-semibold text-purple-900">AI 콘텐츠 생성</h3>
              </div>
              
              {/* 러프 콘텐츠 입력 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    러프 콘텐츠 입력
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    두서없이 써도 AI가 네이버 블로그에 최적화된 콘텐츠로 정리해드립니다
                  </p>
                  <textarea
                    value={roughContent}
                    onChange={(e) => setRoughContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 h-32"
                    placeholder="예: 드라이버 비거리 늘리고 싶은데... 60대라서 힘들어... 마쓰구프라는 브랜드가 있다고 들었는데... 초고반발이라고 하던데... 맞춤 피팅도 해준다고... 비싸긴 한데 효과가 있을까... 동료들이 추천해줬는데..."
                  />
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={generateContentFromRough}
                      disabled={!roughContent.trim() || isGeneratingFromRough}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isGeneratingFromRough ? 'AI가 정리하는 중...' : 'AI가 정리하기'}
                    </button>
                    <button
                      onClick={() => setRoughContent('')}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      지우기
                    </button>
                  </div>
                </div>
                
                {/* 제목 추천 */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={generateTitle}
                    disabled={!formData.content.trim() || isGeneratingTitle}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isGeneratingTitle ? '제목 생성 중...' : '제목 추천'}
                  </button>
                  <span className="text-sm text-gray-600">
                    내용을 입력한 후 제목을 추천받을 수 있습니다
                  </span>
                </div>
              </div>
            </div>
            
            {/* 브랜드 전략 선택기 */}
            <BrandStrategySelector 
              onStrategyChange={(strategy) => {
                setBrandStrategy(strategy);
              }}
              onApplyStrategy={async (strategy) => {
                // 브랜드 전략 적용 시 실제 AI 콘텐츠 생성
                console.log('브랜드 전략 적용:', strategy);
                
                if (!formData.content || formData.content.trim() === '') {
                  alert('러프 콘텐츠를 먼저 입력해주세요.');
                  return;
                }
                
                try {
                  const response = await fetch('/api/admin/generate-blog-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      roughContent: formData.content,
                      contentType: strategy.contentType,
                      persona: strategy.persona,
                      framework: strategy.framework,
                      channel: strategy.channel,
                      brandStrength: strategy.brandStrength,
                      audienceTemperature: strategy.audienceTemperature,
                      conversionGoal: strategy.conversionGoal,
                      platform: 'naver'
                    })
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    console.log('✅ 브랜드 전략 적용 성공:', data);
                    
                    // 폼 데이터 업데이트
                    setFormData(prev => ({
                      ...prev,
                      title: data.title,
                      content: data.content,
                      excerpt: data.excerpt,
                      meta_title: data.title,
                      meta_description: data.excerpt,
                      meta_keywords: data.keywords?.join(', ') || '',
                      naver_tags: data.naverTags || [],
                      tags: data.keywords || []
                    }));
                    
                    alert('브랜드 전략이 적용되었습니다! 제목과 내용이 업데이트되었습니다.');
                  } else {
                    throw new Error('AI 콘텐츠 생성 실패');
                  }
                } catch (error) {
                  console.error('❌ 브랜드 전략 적용 오류:', error);
                  alert('브랜드 전략 적용 중 오류가 발생했습니다.');
                }
              }}
              showVariationButton={true}
              onGenerateVariation={async (variations) => {
                // 베리에이션 생성
                console.log('베리에이션 생성:', variations);
                try {
                  const response = await fetch('/api/admin/generate-variations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      variations: variations,
                      originalContent: formData.content,
                      contentType: brandStrategy.contentType
                    })
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    console.log('✅ 베리에이션 생성 성공:', data);
                    alert(`${data.totalCount}개의 베리에이션이 생성되었습니다!`);
                    // TODO: 베리에이션 결과를 UI에 표시하는 로직 추가
                  } else {
                    throw new Error('베리에이션 생성 실패');
                  }
                } catch (error) {
                  console.error('❌ 베리에이션 생성 오류:', error);
                  alert('베리에이션 생성 중 오류가 발생했습니다.');
                }
              }}
            />
            
            {/* 기본 폼 */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="네이버 블로그 제목을 입력하세요"
                  />
                </div>
                
                {/* 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용 *
                  </label>
                  <TipTapEditor
                    content={formData.content}
                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                    placeholder="네이버 블로그 내용을 작성하세요"
                  />
                </div>
                
                {/* 요약 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    요약
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
                    placeholder="게시물 요약을 입력하세요"
                  />
                </div>
                
                {/* 상태 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    상태
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">초안</option>
                    <option value="published">발행</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* 네이버 특화 컴포넌트 */}
            <NaverSpecificComponents />
            
            {/* 저장 버튼 */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setActiveTab('list');
                  setShowForm(false);
                  setEditingPostId(null);
                  setEditingPost(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                취소
              </button>
              <button
                onClick={savePost}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '저장 중...' : '저장'}
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
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  📝 블로그 소스에서 가져오기
                </h3>
                <p className="text-blue-700 mb-3">
                  기존 홈페이지 블로그 포스트를 네이버 블로그에 최적화된 형태로 변환합니다.
                </p>
                <div className="bg-blue-100 p-3 rounded-lg mb-3">
                  <p className="text-sm text-blue-800">
                    💡 <strong>사용법:</strong> 가져올 블로그 포스트를 선택하면 네이버 블로그에 최적화된 형태로 자동 변환됩니다.
                  </p>
                </div>
                <div className="flex gap-4 items-center">
                  <select
                    value={selectedHomepagePost?.id || ''}
                    onChange={(e) => {
                      const post = homepagePosts.find(p => p.id === e.target.value);
                      setSelectedHomepagePost(post || null);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">블로그 포스트를 선택하세요</option>
                    {homepagePosts.map((post) => (
                      <option key={post.id} value={post.id}>
                        {post.title} ({post.status === 'published' ? '발행됨' : '초안'})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleImportFromHomepage}
                    disabled={!selectedHomepagePost || importLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {importLoading ? '가져오는 중...' : '가져오기'}
                  </button>
                </div>
              </div>
              
              {selectedHomepagePost && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">선택된 포스트 미리보기</h4>
                  <div className="space-y-2">
                    <p><strong>제목:</strong> {selectedHomepagePost.title}</p>
                    <p><strong>카테고리:</strong> {selectedHomepagePost.category}</p>
                    <p><strong>상태:</strong> {selectedHomepagePost.status === 'published' ? '발행됨' : '초안'}</p>
                    <p><strong>요약:</strong> {selectedHomepagePost.excerpt || '요약 없음'}</p>
                    <p><strong>내용 길이:</strong> {selectedHomepagePost.content?.length || 0}자</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (status === 'loading') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">로딩 중...</div>;
  }

  if (status === 'unauthenticated') {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">로그인이 필요합니다.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">네이버 블로그 고급 관리</h1>
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
                onClick={() => {
                  setActiveTab('create');
                  setShowForm(true);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ✏️ 새 게시물 작성
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'import'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📥 홈피에서 가져오기
              </button>
            </nav>
          </div>
          
          {/* 탭 컨텐츠 */}
          {renderTabContent()}
        </div>
      </div>

      {/* 미리보기 모달 */}
      {showPreview && previewPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">📝 네이버 블로그 미리보기</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">제목</h3>
                <p className="text-gray-700">{previewPost.title}</p>
              </div>

              {previewPost.excerpt && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">요약</h3>
                  <p className="text-gray-700">{previewPost.excerpt}</p>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">내용</h3>
                <div 
                  className="text-gray-700 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewPost.content }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">상태</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    previewPost.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {previewPost.status === 'published' ? '발행됨' : '초안'}
                  </span>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">카테고리</h4>
                  <p className="text-gray-700">{previewPost.category || '골프'}</p>
                </div>

                {previewPost.naver_post_url && (
                  <div className="col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-1">네이버 블로그 URL</h4>
                    <a 
                      href={previewPost.naver_post_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 break-all"
                    >
                      {previewPost.naver_post_url}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setEditingPostId(previewPost.id);
                  setActiveTab('create');
                  setShowForm(true);
                  loadPostForEdit(previewPost.id);
                  setShowPreview(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                편집하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
