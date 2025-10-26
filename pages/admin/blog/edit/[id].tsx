import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
const TipTapEditor = dynamic(() => import('../../../../components/admin/TipTapEditor'), { ssr: false });
const GalleryPicker = dynamic(() => import('../../../../components/admin/GalleryPicker'), { ssr: false });
import Head from 'next/head';
import AdminNav from '../../../../components/admin/AdminNav';
import { useSession } from 'next-auth/react';
import { CONTENT_STRATEGY, CUSTOMER_PERSONAS, CUSTOMER_CHANNELS } from '../../../../lib/masgolf-brand-data';
import BrandStrategySelector from '../../../../components/admin/BrandStrategySelector';
import VariationRecommendationModal from '../../../../components/admin/VariationRecommendationModal';

export default function BlogEdit() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  
  // 편집 관련 상태
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '골프 정보',
    status: 'draft',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    slug: '',
    created_at: ''
  });

  // 러프 콘텐츠 관련 상태
  const [roughContent, setRoughContent] = useState('');
  const [isGeneratingFromRough, setIsGeneratingFromRough] = useState(false);
  const [isApplyingBrandStrategy, setIsApplyingBrandStrategy] = useState(false);

  // AI 제목 생성 관련 상태
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingExcerpt, setIsGeneratingExcerpt] = useState(false);
  const [isGeneratingMetaTitle, setIsGeneratingMetaTitle] = useState(false);
  const [isGeneratingMetaDescription, setIsGeneratingMetaDescription] = useState(false);
  const [isGeneratingMetaKeywords, setIsGeneratingMetaKeywords] = useState(false);
  const [isAnalyzingSEO, setIsAnalyzingSEO] = useState(false);
  const [isGeneratingAllSEO, setIsGeneratingAllSEO] = useState(false);

  // SEO 품질 분석 관련 상태
  const [seoAnalysisResult, setSeoAnalysisResult] = useState(null);
  const [seoAnalysisSuggestions, setSeoAnalysisSuggestions] = useState({
    meta_title: '',
    meta_description: '',
    slug: '',
    keywords: ''
  });

  // 갤러리 관련 상태
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [totalImagesCount, setTotalImagesCount] = useState(0);
  const [postImages, setPostImages] = useState([]);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // AI 콘텐츠 개선 관련 상태
  const [simpleAIRequest, setSimpleAIRequest] = useState('');
  const [isImprovingContent, setIsImprovingContent] = useState(false);

  // 브랜드 전략 관련 상태
  const [brandContentType, setBrandContentType] = useState('골프 정보');
  const [brandPersona, setBrandPersona] = useState('중상급 골퍼');
  const [audienceTemperature, setAudienceTemperature] = useState('warm');
  const [brandWeight, setBrandWeight] = useState('low');
  const [customerChannel, setCustomerChannel] = useState('근거리 고객');
  const [storyFramework, setStoryFramework] = useState('pixar');
  const [conversionGoal, setConversionGoal] = useState('consideration');
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [currentBrandStrategy, setCurrentBrandStrategy] = useState(null);

  // AI 이미지 생성 관련 상태
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showGeneratedImages, setShowGeneratedImages] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [showGeneratedImageModal, setShowGeneratedImageModal] = useState(false);
  const [selectedGeneratedImage, setSelectedGeneratedImage] = useState('');
  const [imageGenerationStep, setImageGenerationStep] = useState('');
  const [isVarying, setIsVarying] = useState(false);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [imageGenerationPrompt, setImageGenerationPrompt] = useState('');
  const [imageGenerationModel, setImageGenerationModel] = useState('');
  const [showGenerationProcess, setShowGenerationProcess] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [imageSavingStates, setImageSavingStates] = useState<{[key: number]: 'idle' | 'saving' | 'saved' | 'error'}>({});
  const [imageGenerationCount, setImageGenerationCount] = useState<1 | 2 | 3 | 4>(1);
  const [aiPreset, setAiPreset] = useState<'ultra_extreme_free' | 'extreme_max_free' | 'max_free' | 'ultra_free' | 'super_free' | 'hyper_free' | 'extreme_creative' | 'mega_creative' | 'free_creative' | 'creative' | 'balanced' | 'precise' | 'ultra_precise' | 'high_precision' | 'ultra_high_precision' | 'extreme_precision'>('creative');

  // 허브 연동 상태
  const [hubData, setHubData] = useState(null);
  const [isHubMode, setIsHubMode] = useState(false);
  const [syncModalData, setSyncModalData] = useState({
    isOpen: false,
    blogPost: null,
    hubId: null
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // 편집 모드 감지
  const isEditMode = () => {
    return id && id !== 'new';
  };

  // 게시물 로드
  const loadPostForEdit = async () => {
    if (!id || id === 'new') return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/blog/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data);
        setFormData({
          title: data.title || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          category: data.category || '골프 정보',
          status: data.status || 'draft',
          meta_title: data.meta_title || '',
          meta_description: data.meta_description || '',
          meta_keywords: data.meta_keywords || '',
          slug: data.slug || '',
          created_at: data.created_at || ''
        });
        
        // 허브 데이터 로드
        if (data.calendar_id) {
          loadHubData(data.calendar_id);
        }
      } else {
        throw new Error('게시물을 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('게시물 로드 오류:', error);
      alert('게시물을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 허브 데이터 로드
  const loadHubData = async (calendarId) => {
    try {
      const response = await fetch(`/api/content-calendar-hub/${calendarId}`);
      if (response.ok) {
        const data = await response.json();
        setHubData(data);
        setIsHubMode(true);
      }
    } catch (error) {
      console.error('허브 데이터 로드 오류:', error);
    }
  };

  // 슬러그 생성
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // 러프 콘텐츠에서 제목, 요약, 본문 생성
  const handleRoughContentGenerate = async () => {
    if (!roughContent.trim()) {
      alert('러프 콘텐츠를 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingFromRough(true);
    
    try {
      console.log('🚀 러프 콘텐츠 처리 시작...');
      console.log('📝 입력된 콘텐츠:', roughContent);
      
      // 1단계: 제목 생성
      const titleResponse = await fetch('/api/generate-enhanced-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'title',
          title: roughContent,
          contentType: formData.category || '골프 정보'
        })
      });

      if (!titleResponse.ok) {
        throw new Error('제목 생성 실패');
      }

      const titleData = await titleResponse.json();
      const selectedTitle = titleData.title;

      // 2단계: 요약 생성
      const excerptResponse = await fetch('/api/generate-enhanced-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'excerpt',
          title: selectedTitle,
          content: roughContent,
          contentType: formData.category || '골프 정보'
        })
      });

      if (!excerptResponse.ok) {
        throw new Error('요약 생성 실패');
      }

      const excerptData = await excerptResponse.json();
      const selectedExcerpt = excerptData.excerpt;

      // 3단계: 본문 생성
      const contentResponse = await fetch('/api/generate-enhanced-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'content',
          title: selectedTitle,
          content: roughContent,
          contentType: formData.category || '골프 정보'
        })
      });

      if (!contentResponse.ok) {
        throw new Error('본문 생성 실패');
      }

      const contentData = await contentResponse.json();
      const selectedContent = contentData.content;

      // 폼 데이터 업데이트
      setFormData(prev => ({
        ...prev,
        title: selectedTitle,
        excerpt: selectedExcerpt,
        content: selectedContent,
        meta_title: selectedTitle
      }));
      
      alert('✅ 러프 콘텐츠가 제목, 요약, 본문으로 정리되었습니다!');
      setRoughContent(''); // 입력창 초기화
      
    } catch (error) {
      console.error('❌ 러프 콘텐츠 처리 오류:', error);
      alert(`러프 콘텐츠 처리 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsGeneratingFromRough(false);
    }
  };

  // AI 제목 생성
  const generateAITitle = async () => {
    const contentSource = `${formData.excerpt}\n\n${formData.content?.slice(0, 500) || ''}`;
    
    if (!contentSource.trim()) {
      alert('제목/요약 또는 내용 일부를 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const response = await fetch('/api/generate-blog-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSource: contentSource,
          contentType: formData.category || '골프 정보'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.titles && data.titles.length > 0) {
          const selectedTitle = data.titles[0];
          setFormData(prev => ({
            ...prev,
            title: selectedTitle,
            meta_title: selectedTitle
          }));
          alert('AI가 제목을 생성했습니다!');
        }
      } else {
        throw new Error('제목 생성 실패');
      }
    } catch (error) {
      console.error('AI 제목 생성 오류:', error);
      alert('제목 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // AI 요약 생성
  const generateAIExcerpt = async () => {
    if (!formData.content) {
      alert('내용을 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingExcerpt(true);
    try {
      const response = await fetch('/api/blog/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content,
          title: formData.title
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, excerpt: data.summary }));
        alert('AI가 요약을 생성했습니다!');
      } else {
        throw new Error('요약 생성 실패');
      }
    } catch (error) {
      console.error('AI 요약 생성 오류:', error);
      alert('요약 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingExcerpt(false);
    }
  };

  // AI 메타 제목 생성
  const generateAIMetaTitle = async () => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingMetaTitle(true);
    try {
      const response = await fetch('/api/generate-enhanced-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'meta_title',
          title: formData.title,
          content: formData.content
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, meta_title: data.meta_title }));
        alert('AI가 메타 제목을 생성했습니다!');
      } else {
        throw new Error('메타 제목 생성 실패');
      }
    } catch (error) {
      console.error('AI 메타 제목 생성 오류:', error);
      alert('메타 제목 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingMetaTitle(false);
    }
  };

  // AI 메타 설명 생성
  const generateAIMetaDescription = async () => {
    if (!formData.content) {
      alert('내용을 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingMetaDescription(true);
    try {
      const response = await fetch('/api/generate-enhanced-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'meta_description',
          title: formData.title,
          content: formData.content
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, meta_description: data.meta_description }));
        alert('AI가 메타 설명을 생성했습니다!');
      } else {
        throw new Error('메타 설명 생성 실패');
      }
    } catch (error) {
      console.error('AI 메타 설명 생성 오류:', error);
      alert('메타 설명 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingMetaDescription(false);
    }
  };

  // AI 메타 키워드 생성
  const generateAIMetaKeywords = async () => {
    if (!formData.content) {
      alert('내용을 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingMetaKeywords(true);
    try {
      const response = await fetch('/api/generate-enhanced-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'meta_keywords',
          title: formData.title,
          content: formData.content
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, meta_keywords: data.meta_keywords }));
        alert('AI가 메타 키워드를 생성했습니다!');
      } else {
        throw new Error('메타 키워드 생성 실패');
      }
    } catch (error) {
      console.error('AI 메타 키워드 생성 오류:', error);
      alert('메타 키워드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingMetaKeywords(false);
    }
  };

  // SEO 품질 분석
  const analyzeSEOQuality = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 먼저 입력해주세요.');
      return;
    }

    setIsAnalyzingSEO(true);
    try {
      const response = await fetch('/api/optimize-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
          meta_keywords: formData.meta_keywords
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSeoAnalysisResult(data);
        setSeoAnalysisSuggestions({
          meta_title: data.suggestions?.meta_title || '',
          meta_description: data.suggestions?.meta_description || '',
          slug: data.suggestions?.slug || '',
          keywords: data.suggestions?.keywords || ''
        });
        alert('SEO 품질 분석이 완료되었습니다!');
      } else {
        throw new Error('SEO 분석 실패');
      }
    } catch (error) {
      console.error('SEO 품질 분석 오류:', error);
      alert('SEO 품질 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzingSEO(false);
    }
  };

  // 전체 SEO 생성
  const generateAllSEO = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingAllSEO(true);
    try {
      // 메타 제목 생성
      await generateAIMetaTitle();
      // 메타 설명 생성
      await generateAIMetaDescription();
      // 메타 키워드 생성
      await generateAIMetaKeywords();
      
      alert('전체 SEO 메타데이터가 생성되었습니다!');
    } catch (error) {
      console.error('전체 SEO 생성 오류:', error);
      alert('SEO 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingAllSEO(false);
    }
  };

  // AI 콘텐츠 개선
  const handleSimpleAIImprovement = async () => {
    if (!simpleAIRequest.trim()) {
      alert('개선 요청사항을 입력해주세요.');
      return;
    }

    if (!formData.content) {
      alert('개선할 내용이 없습니다.');
      return;
    }

    setIsImprovingContent(true);
    try {
      const response = await fetch('/api/simple-ai-improvement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content,
          request: simpleAIRequest
        })
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, content: data.improvedContent }));
        setSimpleAIRequest('');
        alert('AI가 콘텐츠를 개선했습니다!');
      } else {
        throw new Error('콘텐츠 개선 실패');
      }
    } catch (error) {
      console.error('AI 콘텐츠 개선 오류:', error);
      alert('콘텐츠 개선 중 오류가 발생했습니다.');
    } finally {
      setIsImprovingContent(false);
    }
  };

  // 브랜드 전략 적용
  const handleBrandStrategyApply = async () => {
    if (!formData.content) {
      alert('브랜드 전략을 적용할 내용이 없습니다.');
      return;
    }

    setIsApplyingBrandStrategy(true);
    try {
      const brandStrategy = {
        contentType: brandContentType,
        persona: brandPersona,
        audienceTemperature: audienceTemperature,
        brandWeight: brandWeight,
        customerChannel: customerChannel,
        storyFramework: storyFramework,
        conversionGoal: conversionGoal
      };

      const response = await fetch('/api/admin/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content,
          brandStrategy: brandStrategy
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentBrandStrategy(brandStrategy);
        setShowVariationModal(true);
        alert('브랜드 전략이 적용되었습니다!');
      } else {
        throw new Error('브랜드 전략 적용 실패');
      }
    } catch (error) {
      console.error('브랜드 전략 적용 오류:', error);
      alert('브랜드 전략 적용 중 오류가 발생했습니다.');
    } finally {
      setIsApplyingBrandStrategy(false);
    }
  };

  // AI 이미지 생성
  const generateAIImage = async () => {
    if (!formData.content) {
      alert('이미지 생성을 위한 내용이 없습니다.');
      return;
    }

    setIsGeneratingImages(true);
    try {
      const response = await fetch('/api/generate-blog-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content,
          title: formData.title,
          count: imageGenerationCount,
          preset: aiPreset
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedImages(data.images || []);
        setShowGeneratedImages(true);
        alert('AI 이미지가 생성되었습니다!');
      } else {
        throw new Error('이미지 생성 실패');
      }
    } catch (error) {
      console.error('AI 이미지 생성 오류:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // 편집 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('게시물이 수정되었습니다!');
        router.push('/admin/blog');
      } else {
        throw new Error('게시물 수정 실패');
      }
    } catch (error) {
      console.error('게시물 수정 오류:', error);
      alert('게시물 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (isEditMode()) {
      loadPostForEdit();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">게시물을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>게시물 편집 - MASGOLF</title>
      </Head>
      
      <AdminNav />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">게시물 편집</h1>
                <p className="text-gray-600">게시물을 수정하세요</p>
              </div>
              <Link href="/admin/blog" className="text-blue-600 hover:text-blue-800">
                ← 목록으로 돌아가기
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. 러프 콘텐츠 입력 섹션 */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">✍️ 러프 콘텐츠 입력</h3>
                <span className="text-sm text-gray-500">두서없이 써도 AI가 정리해드립니다</span>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    글감/아이디어/두서없는 내용 입력
                  </label>
                  <textarea
                    placeholder="예: 드라이버 비거리 늘리고 싶은데... 60대라서 힘들어... 마쓰구골프라는 브랜드가 있다고 들었는데... 초고반발이라고 하던데... 맞춤 피팅도 해준다고... 비싸긴 한데 효과가 있을까... 동료들이 추천해줬는데..."
                    value={roughContent}
                    onChange={(e) => setRoughContent(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent h-32 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 두서없이 써도 AI가 제목, 요약, 본문으로 정리해드립니다
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleRoughContentGenerate}
                    disabled={isGeneratingFromRough || !roughContent.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isGeneratingFromRough ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>정리 중...</span>
                      </>
                    ) : (
                      <>
                        <span>🧹</span>
                        <span>AI가 정리하기</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setRoughContent('')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
                  >
                    지우기
                  </button>
                </div>
              </div>
            </div>

            {/* 2. 제목 섹션 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    title: e.target.value,
                    slug: formData.slug || generateSlug(e.target.value)
                  })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="게시물 제목을 입력하세요"
                  required
                />
                <button
                  type="button"
                  onClick={generateAITitle}
                  className="px-3 whitespace-nowrap rounded bg-purple-600 text-white text-sm hover:bg-purple-700"
                  disabled={isGeneratingTitle}
                >
                  {isGeneratingTitle ? '생성 중…' : '🤖 제목 추천'}
                </button>
              </div>
            </div>

            {/* 3. SEO 메타 데이터 섹션 */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">🔍 SEO 메타데이터</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">메타 제목 (SEO)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({...formData, meta_title: e.target.value})}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SEO 최적화된 제목"
                    />
                    <button
                      type="button"
                      onClick={generateAIMetaTitle}
                      disabled={isGeneratingMetaTitle}
                      className="px-3 whitespace-nowrap rounded bg-purple-600 text-white text-sm hover:bg-purple-700"
                    >
                      {isGeneratingMetaTitle ? '생성 중…' : 'AI 생성'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">메타 설명 (SEO)</label>
                  <div className="flex gap-2">
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SEO 최적화된 설명"
                      rows={3}
                    />
                    <button
                      type="button"
                      onClick={generateAIMetaDescription}
                      disabled={isGeneratingMetaDescription}
                      className="px-3 whitespace-nowrap rounded bg-purple-600 text-white text-sm hover:bg-purple-700"
                    >
                      {isGeneratingMetaDescription ? '생성 중…' : 'AI 생성'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">메타 키워드 (SEO)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.meta_keywords}
                      onChange={(e) => setFormData({...formData, meta_keywords: e.target.value})}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="관련 키워드 (쉼표로 구분)"
                    />
                    <button
                      type="button"
                      onClick={generateAIMetaKeywords}
                      disabled={isGeneratingMetaKeywords}
                      className="px-3 whitespace-nowrap rounded bg-purple-600 text-white text-sm hover:bg-purple-700"
                    >
                      {isGeneratingMetaKeywords ? '생성 중…' : 'AI 생성'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. SEO 품질 분석 */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">📊 SEO 품질 분석</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={analyzeSEOQuality}
                    disabled={isAnalyzingSEO}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isAnalyzingSEO ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>분석 중...</span>
                      </>
                    ) : (
                      <>
                        <span>📊</span>
                        <span>SEO 품질 분석</span>
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={generateAllSEO}
                    disabled={isGeneratingAllSEO}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGeneratingAllSEO ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>전체 SEO 생성</span>
                      </>
                    )}
                  </button>
                </div>

                {seoAnalysisResult && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">SEO 분석 결과</h4>
                    <div className="text-sm text-blue-800">
                      <p>점수: {seoAnalysisResult.score}/100</p>
                      <p>제안사항: {seoAnalysisResult.suggestions}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. 갤러리 열기 */}
            <div className="flex justify-center py-4">
              <button
                type="button"
                onClick={() => setIsGalleryOpen(!isGalleryOpen)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  isGalleryOpen 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {isGalleryOpen ? '📁 갤러리 닫기' : '📂 갤러리 열기'}
                {totalImagesCount > 0 && (
                  <span className="ml-2 text-xs opacity-75">
                    ({totalImagesCount}개)
                  </span>
                )}
              </button>
            </div>

            {/* 6. 편집창 (본문 에디터) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
              {/* @ts-ignore */}
              <TipTapEditor
                valueMarkdown={formData.content}
                onChangeMarkdown={(md) => setFormData({ ...formData, content: md })}
              />
            </div>

            {/* 7. AI 콘텐츠 개선 */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">🤖 AI 콘텐츠 개선</h3>
                <span className="text-sm text-gray-500">AI로 콘텐츠를 분석하고 개선할 수 있습니다</span>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    개선 요청사항
                  </label>
                  <textarea
                    value={simpleAIRequest}
                    onChange={(e) => setSimpleAIRequest(e.target.value)}
                    placeholder="예: 더 매력적인 제목으로 바꿔주세요, SEO를 고려한 내용으로 개선해주세요, 더 읽기 쉽게 만들어주세요..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleSimpleAIImprovement}
                  disabled={isImprovingContent || !simpleAIRequest.trim()}
                  className="px-6 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isImprovingContent ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>개선 중...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>간단 AI 개선</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 8. 마쓰구 브랜드 전략 (하단) */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center space-x-2 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">🎯 마쓰구 브랜드 전략</h3>
                <span className="text-sm text-gray-500">페르소나와 오디언스 온도에 맞춘 맞춤형 콘텐츠 생성</span>
              </div>
              
              <BrandStrategySelector
                contentType={brandContentType}
                setContentType={setBrandContentType}
                persona={brandPersona}
                setPersona={setBrandPersona}
                audienceTemperature={audienceTemperature}
                setAudienceTemperature={setAudienceTemperature}
                brandWeight={brandWeight}
                setBrandWeight={setBrandWeight}
                customerChannel={customerChannel}
                setCustomerChannel={setCustomerChannel}
                storyFramework={storyFramework}
                setStoryFramework={setStoryFramework}
                conversionGoal={conversionGoal}
                setConversionGoal={setConversionGoal}
              />
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleBrandStrategyApply}
                  disabled={isApplyingBrandStrategy}
                  className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isApplyingBrandStrategy ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>적용 중...</span>
                    </>
                  ) : (
                    <>
                      <span>🎯</span>
                      <span>브랜드 전략 적용</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 9. AI 이미지 생성 섹션 (하단) */}
            <div className="border-t border-gray-200 pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">🎨 AI 이미지 생성</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">생성할 이미지 개수</label>
                    <select
                      value={imageGenerationCount}
                      onChange={(e) => setImageGenerationCount(Number(e.target.value) as 1 | 2 | 3 | 4)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>1개</option>
                      <option value={2}>2개</option>
                      <option value={3}>3개</option>
                      <option value={4}>4개</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">AI 프리셋</label>
                    <select
                      value={aiPreset}
                      onChange={(e) => setAiPreset(e.target.value as any)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="creative">창의적</option>
                      <option value="balanced">균형</option>
                      <option value="precise">정확</option>
                      <option value="ultra_precise">초정확</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={generateAIImage}
                    disabled={isGeneratingImages}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isGeneratingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>생성 중...</span>
                      </>
                    ) : (
                      <>
                        <span>🎨</span>
                        <span>AI 이미지 생성</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 폼 제출 버튼 */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex justify-end space-x-4">
                <Link
                  href="/admin/blog"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 베리에이션 추천 모달 */}
      {showVariationModal && (
        <VariationRecommendationModal
          isOpen={showVariationModal}
          onClose={() => setShowVariationModal(false)}
          brandStrategy={currentBrandStrategy}
          originalContent={formData.content}
          onApplyVariation={(variation) => {
            setFormData(prev => ({ ...prev, content: variation }));
            setShowVariationModal(false);
          }}
        />
      )}
    </div>
  );
}