import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import AdminNav from '../../../../components/admin/AdminNav';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { CONTENT_STRATEGY, CUSTOMER_PERSONAS, CUSTOMER_CHANNELS } from '../../../../lib/masgolf-brand-data';
import BrandStrategySelector from '../../../../components/admin/BrandStrategySelector';
import VariationRecommendationModal from '../../../../components/admin/VariationRecommendationModal';

// 동적 임포트
const TipTapEditor = dynamic(() => import('../../../../components/admin/TipTapEditor'), { ssr: false });
const GalleryPicker = dynamic(() => import('../../../../components/admin/GalleryPicker'), { ssr: false });

export default function EditBlogPost() {
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
  });

  // 러프 콘텐츠 관련 상태 (원본 소스에서 추가)
  const [contentSource, setContentSource] = useState('');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isAnalyzingContent, setIsAnalyzingContent] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [showTitleOptions, setShowTitleOptions] = useState(false);
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);
  const [contentAnalysisResult, setContentAnalysisResult] = useState(null);
  
  // 허브 연동 상태
  const [hubData, setHubData] = useState(null);
  const [isHubMode, setIsHubMode] = useState(false);
  
  // 허브 동기화 관련 상태
  const [syncModalData, setSyncModalData] = useState({
    isOpen: false,
    blogPost: null,
    hubId: null
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // 이미지 관리 관련 상태
  const [postImages, setPostImages] = useState([]);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // AI 생성 관련 상태 (생성 페이지와 동일)
  const [generationMode, setGenerationMode] = useState('auto');
  const [autoGenerateTopic, setAutoGenerateTopic] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('골프 정보');
  const [selectedPersona, setSelectedPersona] = useState('중상급 골퍼');
  const [selectedBrandWeight, setSelectedBrandWeight] = useState('medium');
  const [selectedPainPoint, setSelectedPainPoint] = useState('비거리 부족');
  const [selectedConversionGoal, setSelectedConversionGoal] = useState('consideration');
  const [selectedStoryFramework, setSelectedStoryFramework] = useState('pixar');
  const [isGeneratingBlog, setIsGeneratingBlog] = useState(false);
  const [generatedBlog, setGeneratedBlog] = useState(null);
  const [generationProgress, setGenerationProgress] = useState('');

  // 러프 콘텐츠 관련 상태
  const [roughContent, setRoughContent] = useState('');
  const [isGeneratingFromRough, setIsGeneratingFromRough] = useState(false);
  const [isApplyingBrandStrategy, setIsApplyingBrandStrategy] = useState(false);

  // 베리에이션 추천 모달 관련 상태
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

  // 이미지 저장 상태 관리
  const [imageSavingStates, setImageSavingStates] = useState<{[key: number]: 'idle' | 'saving' | 'saved' | 'error'}>({});

  // 이미지 생성 개수 선택
  const [imageGenerationCount, setImageGenerationCount] = useState<1 | 2 | 3 | 4>(1);

  // AI 프리셋 설정
  const [aiPreset, setAiPreset] = useState<'ultra_extreme_free' | 'extreme_max_free' | 'max_free' | 'ultra_free' | 'super_free' | 'hyper_free' | 'extreme_creative' | 'mega_creative' | 'free_creative' | 'creative' | 'balanced' | 'precise' | 'ultra_precise' | 'high_precision' | 'ultra_high_precision' | 'extreme_precision'>('creative');

  // 인라인 갤러리 모달 관련 상태
  const [showInlineGalleryModal, setShowInlineGalleryModal] = useState(false);
  const [editorCursorPosition, setEditorCursorPosition] = useState<number | null>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [showMultichannelPreview, setShowMultichannelPreview] = useState(false);
  const [multichannelPreview, setMultichannelPreview] = useState(null);

  // 연간 콘텐츠 자동생성 관련 상태
  const [annualGenerationPeriod, setAnnualGenerationPeriod] = useState('3months');
  const [annualContentCategory, setAnnualContentCategory] = useState('골프 정보');
  const [annualPublishFrequency, setAnnualPublishFrequency] = useState('weekly');
  const [isGeneratingAnnual, setIsGeneratingAnnual] = useState(false);
  const [showAnnualPreview, setShowAnnualPreview] = useState(false);
  const [annualGeneratedContent, setAnnualGeneratedContent] = useState(null);

  // 브랜드 전략 관련 상태
  const [brandContentType, setBrandContentType] = useState('골프 정보');
  const [brandPersona, setBrandPersona] = useState('중상급 골퍼');
  const [audienceTemperature, setAudienceTemperature] = useState('warm');

  // 네이버 블로그 스크래핑 관련 상태
  const [naverScraperMode, setNaverScraperMode] = useState(false);
  const [naverBlogId, setNaverBlogId] = useState('');
  const [naverPostUrls, setNaverPostUrls] = useState('');
  const [isScrapingNaver, setIsScrapingNaver] = useState(false);
  const [scrapedNaverPosts, setScrapedNaverPosts] = useState([]);
  const [selectedNaverPosts, setSelectedNaverPosts] = useState([]);
  const [naverScrapingStatus, setNaverScrapingStatus] = useState('');

  // 마이그레이션 관련 상태
  const [migrationUrl, setMigrationUrl] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [scrapedData, setScrapedData] = useState(null);

  // 단락별 이미지 생성 관련 상태
  const [isGeneratingParagraphImages, setIsGeneratingParagraphImages] = useState(false);
  const [paragraphPrompts, setParagraphPrompts] = useState([]);
  const [showParagraphPromptPreview, setShowParagraphPromptPreview] = useState(false);

  // 골드톤/블랙톤 이미지 생성 관련 상태
  const [isGeneratingGoldToneImages, setIsGeneratingGoldToneImages] = useState(false);
  const [isGeneratingBlackToneImages, setIsGeneratingBlackToneImages] = useState(false);
  const [goldTonePrompts, setGoldTonePrompts] = useState([]);
  const [blackTonePrompts, setBlackTonePrompts] = useState([]);
  const [showGoldTonePrompts, setShowGoldTonePrompts] = useState(false);
  const [showBlackTonePrompts, setShowBlackTonePrompts] = useState(false);

  // 기존 이미지 변형 관련 상태
  const [showExistingImageModal, setShowExistingImageModal] = useState(false);
  const [isGeneratingExistingVariation, setIsGeneratingExistingVariation] = useState(false);
  const [selectedExistingImage, setSelectedExistingImage] = useState(null);
  const [improvedPrompt, setImprovedPrompt] = useState('');

  // 프롬프트 설정 관리 관련 상태
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigDescription, setNewConfigDescription] = useState('');
  const [selectedPromptConfig, setSelectedPromptConfig] = useState(null);
  const [savedConfigs, setSavedConfigs] = useState([]);

  // SEO 관련 상태
  const [isGeneratingExcerpt, setIsGeneratingExcerpt] = useState(false);
  const [isGeneratingMetaTitle, setIsGeneratingMetaTitle] = useState(false);
  const [isGeneratingMetaDescription, setIsGeneratingMetaDescription] = useState(false);
  const [isGeneratingMetaKeywords, setIsGeneratingMetaKeywords] = useState(false);
  const [isAnalyzingSEO, setIsAnalyzingSEO] = useState(false);
  const [isGeneratingAllSEO, setIsGeneratingAllSEO] = useState(false);
  const [seoAnalysis, setSeoAnalysis] = useState(null);
  const [seoQualityResult, setSeoQualityResult] = useState(null);
  const [seoAnalysisSuggestions, setSeoAnalysisSuggestions] = useState([]);

  // 편집 모드 감지 함수
  const isEditMode = () => {
    return post !== null;
  };

  // 프롬프트 설정 관리자
  const promptConfigManager = {
    init: () => {
      if (typeof window === 'undefined') return {};
      try {
        const configs = localStorage.getItem('savedPromptConfigs');
        return configs ? JSON.parse(configs) : {};
      } catch (error) {
        console.error('프롬프트 설정 로드 오류:', error);
        return {};
      }
    },
    
    saveToStorage: (configs) => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem('savedPromptConfigs', JSON.stringify(configs));
      } catch (error) {
        console.error('프롬프트 설정 저장 오류:', error);
      }
    },
    
    loadConfigs: () => {
      if (typeof window === 'undefined') return [];
      try {
        const configs = localStorage.getItem('savedPromptConfigs');
        return configs ? JSON.parse(configs) : [];
      } catch (error) {
        console.error('프롬프트 설정 로드 오류:', error);
        return [];
      }
    }
  };

  // 브랜드 전략 가중치 계산 함수
  const getBrandWeight = (weight) => {
    const weights = {
      '낮음': 0.3,
      '중간': 0.6,
      '높음': 0.9
    };
    return weights[weight] || 0.6;
  };

  const getAudienceWeight = (temperature) => {
    const weights = {
      'cold': 0.2,
      'warm': 0.6,
      'hot': 0.9
    };
    return weights[temperature] || 0.6;
  };

  // AI 콘텐츠 생성 함수들
  const handleRoughContentGenerate = async () => {
    if (!roughContent.trim()) {
      alert('러프 콘텐츠를 입력해주세요.');
      return;
    }

    setIsGeneratingFromRough(true);
    try {
      const response = await fetch('/api/generate-enhanced-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roughContent,
          contentType: selectedContentType,
          persona: selectedPersona,
          brandWeight: selectedBrandWeight,
          painPoint: selectedPainPoint,
          conversionGoal: selectedConversionGoal,
          storyFramework: selectedStoryFramework
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPost({...post, content: data.enhancedContent});
        alert('러프 콘텐츠가 브랜드 전략에 맞게 개선되었습니다!');
      } else {
        throw new Error('콘텐츠 생성 실패');
      }
    } catch (error) {
      console.error('러프 콘텐츠 생성 오류:', error);
      alert('콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingFromRough(false);
    }
  };

  const handleBrandStrategyApply = async () => {
    if (!formData.content) {
      alert('기존 콘텐츠가 없습니다.');
      return;
    }

    setIsApplyingBrandStrategy(true);
    try {
      const response = await fetch('/api/generate-enhanced-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roughContent: formData.content,
          contentType: selectedContentType,
          persona: selectedPersona,
          brandWeight: selectedBrandWeight,
          painPoint: selectedPainPoint,
          conversionGoal: selectedConversionGoal,
          storyFramework: selectedStoryFramework
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPost({...post, content: data.enhancedContent});
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

  // 이미지 생성 함수들
  const generateAIImage = async () => {
    if (!post.content) {
      alert('콘텐츠가 없습니다.');
      return;
    }

    setIsGeneratingImages(true);
    setImageGenerationStep('이미지 생성 중...');
    
    try {
      const response = await fetch('/api/generate-blog-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          count: imageGenerationCount,
          preset: aiPreset
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedImages(data.images || []);
        setShowGeneratedImages(true);
        alert(`${data.images?.length || 0}개의 이미지가 생성되었습니다!`);
      } else {
        throw new Error('이미지 생성 실패');
      }
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImages(false);
      setImageGenerationStep('');
    }
  };

  const generateFALAIImage = async () => {
    if (!post.content) {
      alert('콘텐츠가 없습니다.');
      return;
    }

    setIsGeneratingImages(true);
    setImageGenerationStep('FAL AI 이미지 생성 중...');
    
    try {
      const response = await fetch('/api/generate-blog-image-fal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          count: imageGenerationCount
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedImages(data.images || []);
        setShowGeneratedImages(true);
        alert(`${data.images?.length || 0}개의 FAL AI 이미지가 생성되었습니다!`);
      } else {
        throw new Error('FAL AI 이미지 생성 실패');
      }
    } catch (error) {
      console.error('FAL AI 이미지 생성 오류:', error);
      alert('FAL AI 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImages(false);
      setImageGenerationStep('');
    }
  };

  // 단락별 이미지 생성 함수들
  const generateParagraphPrompts = async () => {
    if (!post.content) {
      alert('콘텐츠가 없습니다.');
      return;
    }

    setIsGeneratingParagraphImages(true);
    try {
      const response = await fetch('/api/generate-paragraph-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          brandStrategy: {
            persona: 'tech_enthusiast',
            customerChannel: 'online',
            brandWeight: '중간',
            audienceTemperature: 'cold',
            audienceWeight: '중간'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setParagraphPrompts(data.prompts || []);
        setShowParagraphPromptPreview(true);
        alert(`${data.prompts?.length || 0}개의 프롬프트가 생성되었습니다!`);
      } else {
        throw new Error('프롬프트 생성 실패');
      }
    } catch (error) {
      console.error('프롬프트 생성 오류:', error);
      alert('프롬프트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingParagraphImages(false);
    }
  };

  const handleGenerateParagraphImages = async () => {
    if (!post.content) {
      alert('콘텐츠가 없습니다.');
      return;
    }

    setIsGeneratingParagraphImages(true);
    try {
      // 1단계: 프롬프트 생성
      const promptResponse = await fetch('/api/generate-paragraph-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          brandStrategy: {
            persona: 'tech_enthusiast',
            customerChannel: 'online',
            brandWeight: '중간',
            audienceTemperature: 'cold',
            audienceWeight: '중간'
          }
        })
      });

      if (!promptResponse.ok) {
        throw new Error('프롬프트 생성 실패');
      }

      const promptData = await promptResponse.json();
      const prompts = promptData.prompts || [];

      if (prompts.length === 0) {
        alert('생성된 프롬프트가 없습니다.');
        return;
      }

      // 2단계: 이미지 생성
      const imageResponse = await fetch('/api/generate-paragraph-images-with-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          prompts: prompts
        })
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        setGeneratedImages(imageData.images || []);
        setShowGeneratedImages(true);
        alert(`${imageData.images?.length || 0}개의 단락별 이미지가 생성되었습니다!`);
      } else {
        throw new Error('이미지 생성 실패');
      }
    } catch (error) {
      console.error('단락별 이미지 생성 오류:', error);
      alert('단락별 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingParagraphImages(false);
    }
  };

  // 골드톤 이미지 생성 함수들
  const generateGoldTonePrompts = async () => {
    if (!post.content) {
      alert('콘텐츠가 없습니다.');
      return;
    }

    setIsGeneratingGoldToneImages(true);
    try {
      const response = await fetch('/api/generate-paragraph-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          brandStrategy: {
            persona: 'senior_premium',
            customerChannel: 'offline',
            brandWeight: '높음',
            audienceTemperature: 'warm',
            audienceWeight: '높음'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGoldTonePrompts(data.prompts || []);
        setShowGoldTonePrompts(true);
        alert(`${data.prompts?.length || 0}개의 골드톤 프롬프트가 생성되었습니다!`);
      } else {
        throw new Error('골드톤 프롬프트 생성 실패');
      }
    } catch (error) {
      console.error('골드톤 프롬프트 생성 오류:', error);
      alert('골드톤 프롬프트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingGoldToneImages(false);
    }
  };

  const handleGenerateGoldToneImages = async () => {
    if (!post.content) {
      alert('콘텐츠가 없습니다.');
      return;
    }

    setIsGeneratingGoldToneImages(true);
    try {
      // 1단계: 골드톤 프롬프트 생성
      const promptResponse = await fetch('/api/generate-paragraph-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          brandStrategy: {
            persona: 'senior_premium',
            customerChannel: 'offline',
            brandWeight: '높음',
            audienceTemperature: 'warm',
            audienceWeight: '높음'
          }
        })
      });

      if (!promptResponse.ok) {
        throw new Error('골드톤 프롬프트 생성 실패');
      }

      const promptData = await promptResponse.json();
      const prompts = promptData.prompts || [];

      if (prompts.length === 0) {
        alert('생성된 골드톤 프롬프트가 없습니다.');
        return;
      }

      // 2단계: 골드톤 이미지 생성
      const imageResponse = await fetch('/api/generate-paragraph-images-with-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          prompts: prompts
        })
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        setGeneratedImages(imageData.images || []);
        setShowGeneratedImages(true);
        alert(`${imageData.images?.length || 0}개의 골드톤 이미지가 생성되었습니다!`);
      } else {
        throw new Error('골드톤 이미지 생성 실패');
      }
    } catch (error) {
      console.error('골드톤 이미지 생성 오류:', error);
      alert('골드톤 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingGoldToneImages(false);
    }
  };

  // 10월 8일 버전 프롬프트 생성
  const generateOctober8Prompts = async () => {
    if (!post.content) {
      alert('콘텐츠가 없습니다.');
      return;
    }

    setIsGeneratingParagraphImages(true);
    try {
      const response = await fetch('/api/generate-paragraph-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          brandStrategy: selectedPromptConfig ? selectedPromptConfig.brandStrategy : {
            persona: 'tech_enthusiast',
            customerChannel: 'online',
            brandWeight: '중간',
            audienceTemperature: 'cold',
            audienceWeight: '중간'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setParagraphPrompts(data.prompts || []);
        setShowParagraphPromptPreview(true);
        alert(`${data.prompts?.length || 0}개의 10월 8일 버전 프롬프트가 생성되었습니다!`);
      } else {
        throw new Error('10월 8일 버전 프롬프트 생성 실패');
      }
    } catch (error) {
      console.error('10월 8일 버전 프롬프트 생성 오류:', error);
      alert('10월 8일 버전 프롬프트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingParagraphImages(false);
    }
  };

  // 갤러리 관련 함수들
  const loadAllImages = async () => {
    try {
      const response = await fetch('/api/admin/all-images');
      if (response.ok) {
        const data = await response.json();
        return data.images || [];
      }
    } catch (error) {
      console.error('이미지 로드 오류:', error);
    }
    return [];
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const handleImageInsert = (image) => {
    if (editorInstance) {
      const imageHtml = `<img src="${image.url || image.original_url}" alt="${image.alt_text || ''}" style="max-width: 100%; height: auto;" />`;
      editorInstance.commands.insertContent(imageHtml);
    }
    setShowImageModal(false);
    setShowInlineGalleryModal(false);
  };

  const handleImageEnlarge = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  const getPreferredVersionUrl = (image) => {
    return image.url || image.original_url || image.thumbnail_url;
  };

  // SEO 최적화 함수들
  const generateAIExcerpt = async () => {
    if (!post.content) {
      alert('콘텐츠가 없습니다.');
      return;
    }

    setIsGeneratingExcerpt(true);
    try {
      const response = await fetch('/api/blog/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: post.content,
          title: post.title
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPost({...post, excerpt: data.summary});
        alert('AI 요약이 생성되었습니다!');
      } else {
        throw new Error('요약 생성 실패');
      }
    } catch (error) {
      console.error('요약 생성 오류:', error);
      alert('요약 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingExcerpt(false);
    }
  };

  const generateAIMetaTitle = async () => {
    if (!post.title) {
      alert('제목이 없습니다.');
      return;
    }

    setIsGeneratingMetaTitle(true);
    try {
      const response = await fetch('/api/blog/generate-metatags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          content: post.content
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPost({...post, meta_title: data.metaTitle});
        alert('AI 메타 제목이 생성되었습니다!');
      } else {
        throw new Error('메타 제목 생성 실패');
      }
    } catch (error) {
      console.error('메타 제목 생성 오류:', error);
      alert('메타 제목 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingMetaTitle(false);
    }
  };

  const generateAIMetaDescription = async () => {
    if (!post.content) {
      alert('콘텐츠가 없습니다.');
      return;
    }

    setIsGeneratingMetaDescription(true);
    try {
      const response = await fetch('/api/blog/generate-metatags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          content: post.content
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPost({...post, meta_description: data.metaDescription});
        alert('AI 메타 설명이 생성되었습니다!');
      } else {
        throw new Error('메타 설명 생성 실패');
      }
    } catch (error) {
      console.error('메타 설명 생성 오류:', error);
      alert('메타 설명 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingMetaDescription(false);
    }
  };

  const generateAIMetaKeywords = async () => {
    if (!post.content) {
      alert('콘텐츠가 없습니다.');
      return;
    }

    setIsGeneratingMetaKeywords(true);
    try {
      const response = await fetch('/api/blog/generate-metatags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          content: post.content
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPost({...post, meta_keywords: data.metaKeywords});
        alert('AI 메타 키워드가 생성되었습니다!');
      } else {
        throw new Error('메타 키워드 생성 실패');
      }
    } catch (error) {
      console.error('메타 키워드 생성 오류:', error);
      alert('메타 키워드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingMetaKeywords(false);
    }
  };

  const analyzeSEOQuality = async () => {
    if (!post.title || !post.content) {
      alert('제목과 콘텐츠가 필요합니다.');
      return;
    }

    setIsAnalyzingSEO(true);
    try {
      const response = await fetch('/api/validate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          metaTitle: post.meta_title,
          metaDescription: post.meta_description,
          metaKeywords: post.meta_keywords
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSeoAnalysis(data);
        setSeoQualityResult(data.qualityScore);
        setSeoAnalysisSuggestions(data.suggestions || []);
        alert(`SEO 분석 완료! 점수: ${data.qualityScore}/100`);
      } else {
        throw new Error('SEO 분석 실패');
      }
    } catch (error) {
      console.error('SEO 분석 오류:', error);
      alert('SEO 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzingSEO(false);
    }
  };

  const generateAllSEO = async () => {
    if (!post.content) {
      alert('콘텐츠가 없습니다.');
      return;
    }

    setIsGeneratingAllSEO(true);
    try {
      // 요약 생성
      await generateAIExcerpt();
      
      // 메타데이터 생성
      await generateAIMetaTitle();
      await generateAIMetaDescription();
      await generateAIMetaKeywords();
      
      alert('모든 SEO 요소가 생성되었습니다!');
    } catch (error) {
      console.error('SEO 생성 오류:', error);
      alert('SEO 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingAllSEO(false);
    }
  };

  // 프롬프트 설정 관리 함수들
  const savePromptConfig = () => {
    if (!newConfigName.trim()) {
      alert('설정 이름을 입력해주세요.');
      return;
    }

    const newConfig = {
      id: Date.now().toString(),
      name: newConfigName,
      description: newConfigDescription,
      brandStrategy: {
        persona: selectedPersona,
        customerChannel: 'online',
        brandWeight: selectedBrandWeight,
        audienceTemperature: audienceTemperature,
        audienceWeight: '중간'
      },
      createdAt: new Date().toISOString()
    };

    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    promptConfigManager.saveToStorage(updatedConfigs);
    
    setNewConfigName('');
    setNewConfigDescription('');
    setShowConfigModal(false);
    alert('프롬프트 설정이 저장되었습니다!');
  };

  const deletePromptConfig = (configId) => {
    if (!confirm('이 설정을 삭제하시겠습니까?')) return;
    
    const updatedConfigs = savedConfigs.filter(config => config.id !== configId);
    setSavedConfigs(updatedConfigs);
    promptConfigManager.saveToStorage(updatedConfigs);
    alert('프롬프트 설정이 삭제되었습니다!');
  };

  const applyPromptConfig = (config) => {
    setSelectedPromptConfig(config);
    setSelectedPersona(config.brandStrategy.persona);
    setSelectedBrandWeight(config.brandStrategy.brandWeight);
    setAudienceTemperature(config.brandStrategy.audienceTemperature);
    alert(`"${config.name}" 설정이 적용되었습니다!`);
  };

  // 허브 데이터 로드 함수
  const loadHubData = async (hubId: string) => {
    try {
      console.log('🔍 허브 데이터 로드 중...', hubId);
      
      // 허브 상태 초기화
      setHubData(null);
      setIsHubMode(false);
      
      const response = await fetch(`/api/admin/content-calendar-hub?id=${hubId}`);
      const data = await response.json();
      
      if (response.ok && data.data && data.data.length > 0) {
        const hubContent = data.data[0]; // 첫 번째 항목이 해당 허브 콘텐츠
        console.log('✅ 허브 데이터 로드 성공:', hubContent);
        setHubData({
          id: hubContent.id,
          hubId: hubContent.id,
          title: hubContent.title,
          summary: hubContent.summary
        });
        setIsHubMode(true);
      } else {
        console.log('❌ 허브 데이터 없음, 일반 편집 모드');
        setIsHubMode(false);
        setHubData(null);
      }
    } catch (error) {
      console.error('❌ 허브 데이터 로드 오류:', error);
      setIsHubMode(false);
      setHubData(null);
    }
  };

  // 포스트 데이터 로드 함수
  const loadPostForEdit = useCallback(async (postId: string) => {
    try {
      console.log('🔍 포스트 로드 중:', postId);
      const response = await fetch(`/api/admin/blog/${postId}`);
      
      if (response.ok) {
        const data = await response.json();
        const postData = data.post;
        console.log('✅ 포스트 로드 성공:', postData);
        
        // 포스트 데이터 설정
        setPost(postData);
        
        // 🔥 formData 설정 추가 (이전 소스 방식)
        setFormData({
          title: postData.title || '',
          excerpt: postData.excerpt || '',
          content: postData.content || '', // 이 부분이 누락되어 있었음!
          category: postData.category || '골프 정보',
          status: postData.status || 'draft',
          meta_title: postData.meta_title || '',
          meta_description: postData.meta_description || '',
          meta_keywords: postData.meta_keywords || '',
        });
        
        // 게시물 이미지 로드
        await loadPostImages(postId);
        
        // 🔄 허브 데이터 로드 (개선된 로직)
        console.log('🔍 post.calendar_id:', postData.calendar_id);
        
        if (postData.calendar_id) {
          console.log('🔗 허브 모드 감지, 허브 데이터 로드 중...', postData.calendar_id);
          await loadHubData(postData.calendar_id);
        } else {
          console.log('❌ 허브 연결 없음, 일반 편집 모드');
          setIsHubMode(false);
          setHubData(null);
        }
        
      } else {
        throw new Error('포스트 로드 실패');
      }
    } catch (error) {
      console.error('❌ 포스트 로드 오류:', error);
      alert('포스트 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 게시물 이미지 로드 함수
  const loadPostImages = async (postId: string) => {
    try {
      const response = await fetch(`/api/images?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setPostImages(data.images || []);
      }
    } catch (error) {
      console.error('이미지 로드 오류:', error);
    }
  };

  // 이미지 삭제 함수
  const handleImageDelete = async (imageId: string) => {
    if (!confirm('이미지를 삭제하시겠습니까?')) return;
    
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setPostImages(prev => prev.filter(img => img.id !== imageId));
        alert('이미지가 삭제되었습니다.');
      } else {
        alert('이미지 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      alert('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 대표 이미지 설정 함수
  const handleSetFeaturedImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured_image_id: imageId })
      });
      
      if (response.ok) {
        alert('대표 이미지가 설정되었습니다.');
        // 게시물 데이터 새로고침
        await loadPostForEdit(id as string);
      } else {
        alert('대표 이미지 설정에 실패했습니다.');
      }
    } catch (error) {
      console.error('대표 이미지 설정 오류:', error);
      alert('대표 이미지 설정 중 오류가 발생했습니다.');
    }
  };

  // 허브 동기화 함수
  const handleHubSync = async (post) => {
    try {
      // 동기화 모달 표시
      setSyncModalData({
        isOpen: true,
        blogPost: post,
        hubId: post.calendar_id
      });
    } catch (error) {
      console.error('동기화 모달 오류:', error);
      alert('동기화 모달을 열 수 없습니다.');
    }
  };

  // AI 동기화 함수
  const handleHubSyncWithAI = async (blogPost, hubId) => {
    try {
      setIsSyncing(true);
      
      const response = await fetch('/api/blog/sync-to-hub-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogPostId: blogPost.id,
          hubContentId: hubId,
          title: blogPost.title,
          content: blogPost.content,
          excerpt: blogPost.excerpt
        })
      });
      
      if (response.ok) {
        alert('🤖 AI로 허브 콘텐츠가 최적화되어 동기화되었습니다!');
        setSyncModalData({ isOpen: false, blogPost: null, hubId: null });
        // 포스트 데이터 새로고침
        await loadPostForEdit(blogPost.id);
      } else {
        throw new Error('AI 동기화 실패');
      }
    } catch (error) {
      console.error('AI 동기화 오류:', error);
      alert('AI 동기화에 실패했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 직접 동기화 함수
  const handleHubSyncDirect = async (blogPost, hubId) => {
    try {
      setIsSyncing(true);
      
      const response = await fetch('/api/blog/sync-to-hub-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogPostId: blogPost.id,
          hubContentId: hubId,
          title: blogPost.title,
          content: blogPost.content,
          excerpt: blogPost.excerpt
        })
      });
      
      if (response.ok) {
        alert('⚡ 직접 허브 콘텐츠가 동기화되었습니다!');
        setSyncModalData({ isOpen: false, blogPost: null, hubId: null });
        // 포스트 데이터 새로고침
        await loadPostForEdit(blogPost.id);
      } else {
        throw new Error('직접 동기화 실패');
      }
    } catch (error) {
      console.error('직접 동기화 오류:', error);
      alert('직접 동기화에 실패했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  // AI 제목 생성 함수 (원본 소스에서 추가)
  const generateAITitle = async () => {
    if (!contentSource.trim()) {
      alert('콘텐츠 소스를 입력해주세요.');
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
        setGeneratedTitles(data.titles || []);
        setShowTitleOptions(true);
        alert('AI가 제목을 생성했습니다!');
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

  // 고급 콘텐츠 분석 함수 (원본 소스에서 추가)
  const analyzeContentAdvanced = async () => {
    if (!contentSource.trim()) {
      alert('콘텐츠 소스를 입력해주세요.');
      return;
    }

    setIsAnalyzingContent(true);
    try {
      const response = await fetch('/api/analyze-content-advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSource: contentSource,
          contentType: formData.category || '골프 정보'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setContentAnalysisResult(data);
        setShowAnalysisResult(true);
        alert('고급 콘텐츠 분석이 완료되었습니다!');
      } else {
        throw new Error('콘텐츠 분석 실패');
      }
    } catch (error) {
      console.error('고급 콘텐츠 분석 오류:', error);
      alert('콘텐츠 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzingContent(false);
    }
  };

  // 생성된 제목 선택 함수 (원본 소스에서 추가)
  const selectGeneratedTitle = (title) => {
    setFormData(prev => ({
      ...prev,
      title: title,
      meta_title: title
    }));
    setShowTitleOptions(false);
    alert('제목이 선택되었습니다!');
  };

  // 편집 폼 제출 함수
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          category: formData.category,
          status: formData.status
        })
      });

      if (response.ok) {
        alert('게시물이 수정되었습니다.');
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

  // 포스트 데이터 로드
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadPostForEdit(id);
    }
  }, [id, loadPostForEdit]);

  // 프롬프트 설정 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const configs = promptConfigManager.loadConfigs();
      setSavedConfigs(configs);
    }
  }, []);

  // 로딩 중
  if (loading) {
    return (
      <>
        <Head>
          <title>게시물 편집 - MASGOLF</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">게시물을 불러오는 중...</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 포스트가 없는 경우
  if (!post) {
    return (
      <>
        <Head>
          <title>게시물을 찾을 수 없음 - MASGOLF</title>
        </Head>
        <div className="min-h-screen bg-gray-50">
          <AdminNav />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">게시물을 찾을 수 없습니다</h1>
              <p className="text-gray-600 mb-8">요청하신 게시물이 존재하지 않거나 삭제되었습니다.</p>
              <Link href="/admin/blog" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                블로그 목록으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>게시물 편집 - {post.title} - MASGOLF</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">게시물 편집</h1>
                <p className="mt-2 text-gray-600">게시물을 수정하세요</p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/admin/blog"
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  ← 목록으로 돌아가기
                </Link>
              </div>
            </div>
          </div>

          {/* 허브 연동 정보 표시 */}
          {(() => {
            console.log('🔍 허브 연동 정보 표시 조건:', {
              isEditMode: isEditMode(),
              isHubMode,
              hubData,
              post,
              activeTab: 'edit'
            });
            return isEditMode() && isHubMode && hubData;
          })() && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-lg">🎯</span>
                <h3 className="text-lg font-semibold text-blue-800">허브 콘텐츠 연동</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <span className="text-sm font-medium text-gray-700 w-16">허브 ID:</span>
                  <span className="text-sm text-gray-900 font-mono">{hubData.id}</span>
                </div>
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
                    onClick={() => handleHubSync(post)}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    🔄 허브 동기화
                  </button>
                  <span className="text-xs text-gray-500">
                    초안 저장 시 자동으로 허브 상태가 동기화됩니다.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* AI 생성 기능 섹션 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🤖 AI 생성 기능</h2>
            
            {/* 브랜드 전략 선택 */}
            <div className="mb-6">
              <BrandStrategySelector
                onApplyStrategy={handleBrandStrategyApply}
                isApplying={isApplyingBrandStrategy}
              />
            </div>

            {/* 이미지 생성 섹션 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🎨 이미지 생성</h3>
              
              {/* 이미지 생성 개수 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">생성할 이미지 개수</label>
                <select
                  value={imageGenerationCount}
                  onChange={(e) => setImageGenerationCount(parseInt(e.target.value) as 1 | 2 | 3 | 4)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1개</option>
                  <option value={2}>2개</option>
                  <option value={3}>3개</option>
                  <option value={4}>4개</option>
                </select>
              </div>

              {/* AI 프리셋 선택 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">AI 프리셋</label>
                <select
                  value={aiPreset}
                  onChange={(e) => setAiPreset(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="creative">창의적</option>
                  <option value="balanced">균형</option>
                  <option value="precise">정확</option>
                  <option value="ultra_precise">초정확</option>
                </select>
              </div>

              {/* 이미지 생성 버튼들 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <button
                  type="button"
                  onClick={generateAIImage}
                  disabled={isGeneratingImages}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGeneratingImages ? '생성 중...' : 'AI 이미지 생성'}
                </button>
                
                <button
                  type="button"
                  onClick={generateFALAIImage}
                  disabled={isGeneratingImages}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isGeneratingImages ? '생성 중...' : 'FAL AI 이미지'}
                </button>
                
                <button
                  type="button"
                  onClick={generateOctober8Prompts}
                  disabled={isGeneratingParagraphImages}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isGeneratingParagraphImages ? '생성 중...' : '10월 8일 버전'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowInlineGalleryModal(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  📁 갤러리 열기
                </button>
              </div>

              {/* 단락별 이미지 생성 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <button
                  type="button"
                  onClick={generateParagraphPrompts}
                  disabled={isGeneratingParagraphImages}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isGeneratingParagraphImages ? '생성 중...' : '단락별 프롬프트 미리보기 (블랙톤)'}
                </button>
                
                <button
                  type="button"
                  onClick={handleGenerateParagraphImages}
                  disabled={isGeneratingParagraphImages}
                  className="px-4 py-2 bg-indigo-700 text-white rounded hover:bg-indigo-800 disabled:opacity-50"
                >
                  {isGeneratingParagraphImages ? '생성 중...' : '단락별 이미지 일괄생성 (블랙톤)'}
                </button>
                
                <button
                  type="button"
                  onClick={generateGoldTonePrompts}
                  disabled={isGeneratingGoldToneImages}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isGeneratingGoldToneImages ? '생성 중...' : '단락별 프롬프트 미리보기 (골드톤)'}
                </button>
                
                <button
                  type="button"
                  onClick={handleGenerateGoldToneImages}
                  disabled={isGeneratingGoldToneImages}
                  className="px-4 py-2 bg-yellow-700 text-white rounded hover:bg-yellow-800 disabled:opacity-50"
                >
                  {isGeneratingGoldToneImages ? '생성 중...' : '단락별 이미지 일괄생성 (골드톤)'}
                </button>
              </div>
            </div>

            {/* SEO 최적화 섹션 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">🔍 SEO 최적화</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={generateAIExcerpt}
                  disabled={isGeneratingExcerpt}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {isGeneratingExcerpt ? '생성 중...' : 'AI 요약 생성'}
                </button>
                
                <button
                  type="button"
                  onClick={generateAIMetaTitle}
                  disabled={isGeneratingMetaTitle}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGeneratingMetaTitle ? '생성 중...' : '메타 제목 생성'}
                </button>
                
                <button
                  type="button"
                  onClick={generateAIMetaDescription}
                  disabled={isGeneratingMetaDescription}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isGeneratingMetaDescription ? '생성 중...' : '메타 설명 생성'}
                </button>
                
                <button
                  type="button"
                  onClick={generateAllSEO}
                  disabled={isGeneratingAllSEO}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  {isGeneratingAllSEO ? '생성 중...' : '전체 SEO 생성'}
                </button>
              </div>
            </div>

            {/* 프롬프트 설정 관리 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">⚙️ 프롬프트 설정 관리</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + 새 설정
                </button>
                
                {savedConfigs.map((config) => (
                  <div key={config.id} className="flex items-center gap-2 bg-gray-100 rounded px-3 py-2">
                    <span className="text-sm">{config.name}</span>
                    <button
                      type="button"
                      onClick={() => applyPromptConfig(config)}
                      className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                    >
                      ✅ 적용
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePromptConfig(config.id)}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 러프 콘텐츠 입력 섹션 - 원본 소스에서 추가 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">📝</span>
              <h2 className="text-xl font-semibold text-gray-900">콘텐츠 소스 & 글감</h2>
              <span className="text-sm text-gray-500">AI가 이를 바탕으로 SEO 최적화된 콘텐츠를 생성합니다</span>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 콘텐츠 소스 & 글감
              </label>
              <textarea
                value={contentSource}
                onChange={(e) => setContentSource(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="블로그 글감, 정리되지 않은 데이터, 관련 정보, 키워드 등을 자유롭게 입력하세요. AI가 이를 바탕으로 SEO 최적화된 제목을 생성합니다."
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 예시: "골프 드라이버, 비거리 향상, 50대 골퍼, 맞춤 피팅, 군산 지역, 고객 후기, 25m 증가, 시크리트포스 PRO3, 조병섭 교수님, 신성대학교"
              </p>
            </div>
            
            {/* AI 제목 생성 및 고급 콘텐츠 분석 버튼 */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={generateAITitle}
                disabled={isGeneratingTitle}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isGeneratingTitle ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    AI 제목 생성 중...
                  </>
                ) : (
                  <>
                    🤖 AI 제목 생성
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={analyzeContentAdvanced}
                disabled={isAnalyzingContent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isAnalyzingContent ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    고급 분석 중...
                  </>
                ) : (
                  <>
                    🔍 고급 콘텐츠 분석
                  </>
                )}
              </button>
              {generatedTitles.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTitleOptions(!showTitleOptions)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  📋 생성된 제목 보기 ({generatedTitles.length}개)
                </button>
              )}
            </div>

            {/* 생성된 제목 옵션들 */}
            {showTitleOptions && generatedTitles.length > 0 && (
              <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="text-sm font-medium text-purple-800 mb-3">🎯 AI가 생성한 SEO 최적화 제목들</h4>
                <div className="space-y-2">
                  {generatedTitles.map((title, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-white border border-purple-200 rounded">
                      <span className="text-xs text-purple-600 font-medium w-8">{index + 1}.</span>
                      <span className="flex-1 text-sm text-gray-800">{title}</span>
                      <button
                        type="button"
                        onClick={() => selectGeneratedTitle(title)}
                        className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                      >
                        선택
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowTitleOptions(false)}
                    className="text-xs text-purple-600 hover:text-purple-800"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}

            {/* 고급 콘텐츠 분석 결과 */}
            {showAnalysisResult && contentAnalysisResult && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-3">🔍 고급 콘텐츠 분석 결과</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h5 className="text-xs font-medium text-blue-700 mb-2">분류 정보</h5>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">카테고리:</span>
                        <span className="font-medium text-blue-600">{contentAnalysisResult.category}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">신뢰도:</span>
                        <span className="font-medium text-green-600">{(contentAnalysisResult.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-xs font-medium text-blue-700 mb-2">추출된 키워드</h5>
                    <div className="flex flex-wrap gap-1">
                      {contentAnalysisResult.keywords?.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h5 className="text-xs font-medium text-blue-700 mb-2">분석 추론</h5>
                  <p className="text-xs text-gray-700 bg-white p-2 rounded border">
                    {contentAnalysisResult.reasoning}
                  </p>
                </div>
                
                <div className="mb-3">
                  <h5 className="text-xs font-medium text-blue-700 mb-2">개선 제안</h5>
                  <ul className="space-y-1">
                    {contentAnalysisResult.suggestions?.map((suggestion, index) => (
                      <li key={index} className="flex items-start text-xs">
                        <span className="text-green-500 mr-1">•</span>
                        <span className="text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAnalysisResult(false)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 편집 폼 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="게시물 제목을 입력하세요"
                  required
                />
              </div>

              {/* 요약 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">요약</label>
                <textarea
                  value={formData.excerpt || ''}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="게시물 요약을 입력하세요"
                  rows={3}
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
                <div className="border border-gray-300 rounded-md">
                  <TipTapEditor
                    initialContent={formData.content || ''}
                    onContentChange={(content) => setFormData({...formData, content})}
                    placeholder="게시물 내용을 입력하세요"
                  />
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select
                  value={formData.category || 'blog'}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blog">블로그</option>
                  <option value="고객 후기">고객 후기</option>
                  <option value="골프 정보">골프 정보</option>
                  <option value="제품 소개">제품 소개</option>
                </select>
              </div>

              {/* 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={formData.status || 'draft'}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">초안</option>
                  <option value="published">발행</option>
                  <option value="archived">보관</option>
                </select>
              </div>

              {/* SEO 메타데이터 */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 SEO 메타데이터</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">메타 제목</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={formData.meta_title || ''}
                        onChange={(e) => setFormData({...formData, meta_title: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="SEO 최적화된 제목"
                      />
                      <button
                        type="button"
                        onClick={generateAIMetaTitle}
                        disabled={isGeneratingMetaTitle}
                        className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isGeneratingMetaTitle ? '생성 중...' : 'AI 생성'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">메타 설명</label>
                    <div className="flex">
                      <textarea
                        value={formData.meta_description || ''}
                        onChange={(e) => setFormData({...formData, meta_description: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="SEO 최적화된 설명"
                        rows={2}
                      />
                      <button
                        type="button"
                        onClick={generateAIMetaDescription}
                        disabled={isGeneratingMetaDescription}
                        className="px-3 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700 disabled:opacity-50"
                      >
                        {isGeneratingMetaDescription ? '생성 중...' : 'AI 생성'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">메타 키워드</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={formData.meta_keywords || ''}
                      onChange={(e) => setFormData({...formData, meta_keywords: e.target.value})}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="관련 키워드 (쉼표로 구분)"
                    />
                    <button
                      type="button"
                      onClick={generateAIMetaKeywords}
                      disabled={isGeneratingMetaKeywords}
                      className="px-3 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 disabled:opacity-50"
                    >
                      {isGeneratingMetaKeywords ? '생성 중...' : 'AI 생성'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={analyzeSEOQuality}
                    disabled={isAnalyzingSEO}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    {isAnalyzingSEO ? '분석 중...' : 'SEO 품질 분석'}
                  </button>
                  
                  {seoQualityResult && (
                    <div className="text-sm">
                      <span className="font-medium">SEO 점수: </span>
                      <span className={`font-bold ${seoQualityResult >= 80 ? 'text-green-600' : seoQualityResult >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {seoQualityResult}/100
                      </span>
                    </div>
                  )}
                </div>

                {seoAnalysisSuggestions.length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">SEO 개선 제안</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {seoAnalysisSuggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 이미지 관리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이미지 관리</label>
                <div className="border border-gray-300 rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-700">게시물 이미지</h4>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowImageGallery(true)}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        📁 갤러리에서 추가
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowImageUpload(true)}
                        className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        📤 새 이미지 업로드
                      </button>
                    </div>
                  </div>
                  
                  {postImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {postImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url || image.original_url}
                            alt={image.alt_text || '게시물 이미지'}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                              <button
                                onClick={() => handleSetFeaturedImage(image.id)}
                                className="bg-white text-gray-800 px-2 py-1 rounded text-xs"
                                title="대표 이미지로 설정"
                              >
                                ⭐
                              </button>
                              <button
                                onClick={() => handleImageDelete(image.id)}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                                title="이미지 삭제"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>등록된 이미지가 없습니다.</p>
                      <p className="text-sm">갤러리에서 추가하거나 새로 업로드하세요.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-3">
                <Link
                  href="/admin/blog"
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  취소
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 허브 동기화 모달 */}
      {syncModalData.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">허브 콘텐츠 동기화</h3>
              <button
                onClick={() => setSyncModalData({ isOpen: false, blogPost: null, hubId: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>블로그:</strong> {syncModalData.blogPost?.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>허브 ID:</strong> {syncModalData.hubId}
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => handleHubSyncWithAI(syncModalData.blogPost, syncModalData.hubId)}
                disabled={isSyncing}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSyncing ? '🔄 동기화 중...' : '🤖 AI 동기화'}
              </button>
              
              <button
                onClick={() => handleHubSyncDirect(syncModalData.blogPost, syncModalData.hubId)}
                disabled={isSyncing}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSyncing ? '🔄 동기화 중...' : '⚡ 직접 동기화'}
              </button>
            </div>
            
            <div className="mt-4 text-xs text-gray-500">
              <p><strong>AI 동기화:</strong> 허브용으로 최적화된 요약/개요 생성</p>
              <p><strong>직접 동기화:</strong> 현재 블로그 내용을 그대로 복사</p>
            </div>
          </div>
        </div>
      )}

      {/* 생성된 이미지 갤러리 모달 */}
      {showGeneratedImages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">생성된 이미지</h3>
              <button
                onClick={() => setShowGeneratedImages(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image.url || image.original_url}
                    alt={`생성된 이미지 ${index + 1}`}
                    className="w-full h-48 object-cover rounded border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedGeneratedImage(image.url || image.original_url);
                          setShowGeneratedImageModal(true);
                        }}
                        className="bg-white text-gray-800 px-3 py-2 rounded text-sm"
                      >
                        🔍 확대
                      </button>
                      <button
                        onClick={() => {
                          if (editorInstance) {
                            const imageHtml = `<img src="${image.url || image.original_url}" alt="생성된 이미지" style="max-width: 100%; height: auto;" />`;
                            editorInstance.commands.insertContent(imageHtml);
                          }
                          setShowGeneratedImages(false);
                        }}
                        className="bg-blue-500 text-white px-3 py-2 rounded text-sm"
                      >
                        📝 삽입
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {showGeneratedImageModal && selectedGeneratedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">이미지 확대</h3>
              <button
                onClick={() => setShowGeneratedImageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <img
              src={selectedGeneratedImage}
              alt="확대된 이미지"
              className="w-full h-auto rounded"
            />
          </div>
        </div>
      )}

      {/* 단락별 프롬프트 미리보기 모달 */}
      {showParagraphPromptPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">단락별 프롬프트 미리보기 (블랙톤)</h3>
              <button
                onClick={() => setShowParagraphPromptPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {paragraphPrompts.map((prompt, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">단락 {index + 1}</h4>
                  <p className="text-sm text-gray-600 mb-3">{prompt}</p>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/generate-paragraph-images-with-prompts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            content: post.content,
                            prompts: [prompt]
                          })
                        });

                        if (response.ok) {
                          const data = await response.json();
                          setGeneratedImages(data.images || []);
                          setShowGeneratedImages(true);
                          setShowParagraphPromptPreview(false);
                          alert('이미지가 생성되었습니다!');
                        } else {
                          throw new Error('이미지 생성 실패');
                        }
                      } catch (error) {
                        console.error('이미지 생성 오류:', error);
                        alert('이미지 생성 중 오류가 발생했습니다.');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    수정된 프롬프트로 이미지 생성
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 골드톤 프롬프트 미리보기 모달 */}
      {showGoldTonePrompts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">단락별 프롬프트 미리보기 (골드톤)</h3>
              <button
                onClick={() => setShowGoldTonePrompts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {goldTonePrompts.map((prompt, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">단락 {index + 1}</h4>
                  <p className="text-sm text-gray-600 mb-3">{prompt}</p>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/generate-paragraph-images-with-prompts', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            content: post.content,
                            prompts: [prompt]
                          })
                        });

                        if (response.ok) {
                          const data = await response.json();
                          setGeneratedImages(data.images || []);
                          setShowGeneratedImages(true);
                          setShowGoldTonePrompts(false);
                          alert('골드톤 이미지가 생성되었습니다!');
                        } else {
                          throw new Error('골드톤 이미지 생성 실패');
                        }
                      } catch (error) {
                        console.error('골드톤 이미지 생성 오류:', error);
                        alert('골드톤 이미지 생성 중 오류가 발생했습니다.');
                      }
                    }}
                    className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                  >
                    수정된 프롬프트로 골드톤 이미지 생성
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 프롬프트 설정 모달 */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">새 프롬프트 설정</h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설정 이름</label>
                <input
                  type="text"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="설정 이름을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설정 설명</label>
                <textarea
                  value={newConfigDescription}
                  onChange={(e) => setNewConfigDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="설정 설명을 입력하세요"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  onClick={savePromptConfig}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 갤러리 피커 모달 */}
      {showInlineGalleryModal && (
        <GalleryPicker
          isOpen={showInlineGalleryModal}
          onClose={() => setShowInlineGalleryModal(false)}
          onSelect={handleImageInsert}
        />
      )}
    </>
  );
}
