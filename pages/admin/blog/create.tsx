import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import AdminNav from '../../../components/admin/AdminNav';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { CONTENT_STRATEGY, CUSTOMER_PERSONAS, CUSTOMER_CHANNELS } from '../../../lib/masgolf-brand-data';
import BrandStrategySelector from '../../../components/admin/BrandStrategySelector';
import VariationRecommendationModal from '../../../components/admin/VariationRecommendationModal';

// 동적 임포트
const TipTapEditor = dynamic(() => import('../../../components/admin/TipTapEditor'), { ssr: false });
const GalleryPicker = dynamic(() => import('../../../components/admin/GalleryPicker'), { ssr: false });

export default function CreateBlogPost() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 기본 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: '고객 후기',
    status: 'draft',
    featured_image: '',
    tags: [] as string[],
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    view_count: 0,
    is_featured: false,
    is_scheduled: false,
    scheduled_at: null as string | null,
    author: '마쓰구골프',
    // 추가 필드들
    summary: '',
    customerpersona: '',
    conversiongoal: 'homepage_visit',
    target_product: 'all',
    published_at: new Date().toISOString().slice(0, 16),
    created_at: ''
  });

  // AI 생성 관련 상태
  const [generationMode, setGenerationMode] = useState('auto'); // 'auto' | 'manual'
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
  const [annualContentCategory, setAnnualContentCategory] = useState('mixed');
  const [annualPublishFrequency, setAnnualPublishFrequency] = useState('weekly');
  const [isGeneratingAnnual, setIsGeneratingAnnual] = useState(false);
  const [showAnnualPreview, setShowAnnualPreview] = useState(false);
  const [annualGeneratedContent, setAnnualGeneratedContent] = useState(null);

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
  const [selectedExistingImage, setSelectedExistingImage] = useState('');
  const [improvedPrompt, setImprovedPrompt] = useState('');

  // 프롬프트 설정 관리 관련 상태
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigDescription, setNewConfigDescription] = useState('');
  const [selectedPromptConfig, setSelectedPromptConfig] = useState(null);
  const [savedConfigs, setSavedConfigs] = useState([]);

  // 프롬프트 설정 관리 함수들
  const promptConfigManager = {
    configs: {},
    
    init() {
      this.configs = this.loadConfigs();
    },
    
    // 설정 저장
    saveConfig(name, config) {
      this.configs[name] = config;
      localStorage.setItem('promptConfigs', JSON.stringify(this.configs));
    },
    
    // 설정 로드
    loadConfigs() {
      try {
        const saved = localStorage.getItem('promptConfigs');
        return saved ? JSON.parse(saved) : {};
      } catch (error) {
        console.error('설정 불러오기 실패:', error);
        return {};
      }
    },
    
    // 설정 삭제
    deleteConfig(name) {
      delete this.configs[name];
      localStorage.setItem('promptConfigs', JSON.stringify(this.configs));
    },
    
    // 설정 내보내기
    exportConfigs() {
      const dataStr = JSON.stringify(this.configs, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'prompt-configs.json';
      link.click();
      URL.revokeObjectURL(url);
    },
    
    // 설정 가져오기
    importConfigs(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          this.configs = { ...this.configs, ...imported };
          localStorage.setItem('promptConfigs', JSON.stringify(this.configs));
          alert('설정이 가져와졌습니다.');
        } catch (error) {
          alert('파일 형식이 올바르지 않습니다.');
        }
      };
      reader.readAsText(file);
    }
  };

  // 프롬프트 설정 저장
  const savePromptConfig = (name, description, brandStrategy) => {
    const config = {
      name,
      description,
      brandStrategy,
      createdAt: new Date().toISOString()
    };
    
    promptConfigManager.saveConfig(name, config);
    setSavedConfigs(Object.values(promptConfigManager.configs));
    alert('프롬프트 설정이 저장되었습니다.');
  };

  // 프롬프트 설정 삭제
  const deletePromptConfig = (name) => {
    if (confirm('정말로 이 설정을 삭제하시겠습니까?')) {
      promptConfigManager.deleteConfig(name);
      setSavedConfigs(Object.values(promptConfigManager.configs));
      if (selectedPromptConfig?.name === name) {
        setSelectedPromptConfig(null);
      }
    }
  };

  // 프롬프트 설정 적용
  const applyPromptConfig = (config) => {
    setSelectedPromptConfig(config);
    // 브랜드 전략 적용
    if (config.brandStrategy) {
      setCurrentBrandStrategy(config.brandStrategy);
    }
  };

  // 기존 이미지 변형 함수
  const handleExistingImageVariation = async () => {
    if (!selectedExistingImage) {
      alert('변형할 이미지를 선택해주세요.');
      return;
    }

    try {
      setIsGeneratingExistingVariation(true);
      setImageGenerationStep('기존 이미지 변형 중...');
      
      const response = await fetch('/api/vary-existing-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: selectedExistingImage,
          prompt: improvedPrompt,
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: formData.category,
          brandStrategy: currentBrandStrategy || 'professional',
          preset: aiPreset
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedImages(data.images || []);
        setShowGeneratedImages(true);
        setImageGenerationStep('기존 이미지 변형 완료!');
        setShowExistingImageModal(false);
      } else {
        throw new Error('기존 이미지 변형 실패');
      }
    } catch (error) {
      console.error('기존 이미지 변형 오류:', error);
      alert('기존 이미지 변형 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingExistingVariation(false);
      setTimeout(() => {
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);

  // URL 파라미터 처리 (허브에서 온 경우)
  useEffect(() => {
    if (router.isReady) {
      const { hub, title, content, category, status } = router.query;
      
      if (hub && title && content) {
        console.log('🔍 허브에서 온 새 포스트 생성 모드');
        setFormData(prev => ({
          ...prev,
          title: decodeURIComponent(title as string),
          content: decodeURIComponent(content as string),
          category: category as string || 'blog',
          status: status as string || 'draft'
        }));
      }
    }
  }, [router.isReady, router.query]);

  // 프롬프트 설정 초기화
  useEffect(() => {
    promptConfigManager.init();
    setSavedConfigs(Object.values(promptConfigManager.configs));
  }, []);

  // 폼 제출 함수
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('게시물이 생성되었습니다.');
        router.push('/admin/blog');
      } else {
        throw new Error('게시물 생성 실패');
      }
    } catch (error) {
      console.error('게시물 생성 오류:', error);
      alert('게시물 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 러프 콘텐츠 생성 함수
  const handleRoughContentGenerate = async () => {
    if (!roughContent.trim()) {
      alert('러프 콘텐츠를 입력해주세요.');
      return;
    }

    setIsGeneratingFromRough(true);
    try {
      const response = await fetch('/api/generate-blog-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roughContent: roughContent,
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
        setFormData(prev => ({
          ...prev,
          title: data.title || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          summary: data.summary || ''
        }));
        alert('AI가 콘텐츠를 정리했습니다!');
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

  // 브랜드 전략 적용 함수
  const handleBrandStrategyApply = async () => {
    if (!currentBrandStrategy) {
      alert('브랜드 전략을 선택해주세요.');
      return;
    }

    setIsApplyingBrandStrategy(true);
    try {
      const response = await fetch('/api/admin/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          brandStrategy: currentBrandStrategy
        })
      });

      if (response.ok) {
        const data = await response.json();
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

  // AI 이미지 생성 함수
  const generateAIImage = async (count = 4, customPromptOverride?: string) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('🎨 AI 이미지 생성 시작...', count, '개');
      setIsGeneratingImages(true);
      setShowGenerationProcess(true);
      setImageGenerationModel('ChatGPT + DALL-E 3');
      
      // 1단계: 프롬프트 준비
      let smartPrompt = customPromptOverride || imageGenerationPrompt;
      if (!smartPrompt) {
        setImageGenerationStep('1단계: ChatGPT로 스마트 프롬프트 생성 중...');
        const promptResponse = await fetch('/api/generate-smart-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: formData.title,
            excerpt: formData.excerpt,
            contentType: formData.category,
            brandStrategy: {
              contentType: formData.category,
              customerpersona: selectedPersona,
              customerChannel: '',
              brandWeight: selectedBrandWeight,
              audienceTemperature: 'cold',
              audienceWeight: 'medium'
            },
            model: 'dalle3'
          })
        });

        if (!promptResponse.ok) {
          throw new Error('ChatGPT 프롬프트 생성 실패');
        }

        const resp = await promptResponse.json();
        smartPrompt = resp.prompt;
        setImageGenerationPrompt(smartPrompt);
      }
      
      // 2단계: DALL-E 3로 이미지 생성
      setImageGenerationStep('2단계: DALL-E 3로 이미지 생성 중...');
      const response = await fetch('/api/generate-blog-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          prompt: smartPrompt,
          count: count,
          model: 'dalle3'
        })
      });

      if (!response.ok) {
        throw new Error('DALL-E 3 이미지 생성 실패');
      }

      const data = await response.json();
      setGeneratedImages(data.images || []);
      setShowGeneratedImages(true);
      setImageGenerationStep('이미지 생성 완료!');
      
      setTimeout(() => {
        setImageGenerationStep('');
      }, 2000);
      
    } catch (error) {
      console.error('AI 이미지 생성 오류:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImages(false);
      setShowGenerationProcess(false);
    }
  };

  // 단락별 이미지 생성 함수
  const handleGenerateParagraphImages = async () => {
    if (!formData.content) {
      alert('내용을 먼저 입력해주세요.');
      return;
    }

    try {
      setIsGeneratingImages(true);
      setImageGenerationStep('단락별 이미지 생성 중...');
      
      const response = await fetch('/api/generate-paragraph-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          count: imageGenerationCount
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedImages(data.images || []);
        setShowGeneratedImages(true);
        setImageGenerationStep('단락별 이미지 생성 완료!');
      } else {
        throw new Error('단락별 이미지 생성 실패');
      }
    } catch (error) {
      console.error('단락별 이미지 생성 오류:', error);
      alert('단락별 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingImages(false);
      setTimeout(() => {
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // 골드톤 시니어 매너 프롬프트 생성
  const generateGoldTonePrompts = async () => {
    if (!formData.content) {
      alert('내용을 먼저 입력해주세요.');
      return;
    }

    try {
      setIsGeneratingGoldToneImages(true);
      setImageGenerationStep('골드톤 시니어 매너 프롬프트 생성 중...');
      
      const response = await fetch('/api/generate-paragraph-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          brandStrategy: {
            contentType: formData.category,
            customerpersona: 'senior_preference',
            customerChannel: 'local_customers',
            brandWeight: 'high',
            audienceTemperature: 'warm',
            audienceWeight: 'high'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGoldTonePrompts(data.prompts || []);
        setShowGoldTonePrompts(true);
        setImageGenerationStep('골드톤 프롬프트 생성 완료!');
      } else {
        throw new Error('골드톤 프롬프트 생성 실패');
      }
    } catch (error) {
      console.error('골드톤 프롬프트 생성 오류:', error);
      alert('골드톤 프롬프트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingGoldToneImages(false);
      setTimeout(() => {
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // 블랙톤 젊은 매너 프롬프트 생성
  const generateBlackTonePrompts = async () => {
    if (!formData.content) {
      alert('내용을 먼저 입력해주세요.');
      return;
    }

    try {
      setIsGeneratingBlackToneImages(true);
      setImageGenerationStep('블랙톤 젊은 매너 프롬프트 생성 중...');
      
      const response = await fetch('/api/generate-paragraph-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          brandStrategy: {
            contentType: formData.category,
            customerpersona: 'tech_enthusiast',
            customerChannel: 'online',
            brandWeight: 'medium',
            audienceTemperature: 'cold',
            audienceWeight: 'medium'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBlackTonePrompts(data.prompts || []);
        setShowBlackTonePrompts(true);
        setImageGenerationStep('블랙톤 프롬프트 생성 완료!');
      } else {
        throw new Error('블랙톤 프롬프트 생성 실패');
      }
    } catch (error) {
      console.error('블랙톤 프롬프트 생성 오류:', error);
      alert('블랙톤 프롬프트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingBlackToneImages(false);
      setTimeout(() => {
        setImageGenerationStep('');
      }, 2000);
    }
  };

  return (
    <>
      <Head>
        <title>새 게시물 작성 - MASGOLF</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">새 게시물 작성</h1>
                <p className="mt-2 text-gray-600">새로운 게시물을 작성하세요</p>
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

          {/* 브랜드 전략 선택기 */}
          <div className="mb-8">
            <BrandStrategySelector
              onStrategySelect={setCurrentBrandStrategy}
              onApplyStrategy={handleBrandStrategyApply}
              isApplying={isApplyingBrandStrategy}
            />
          </div>

          {/* 프롬프트 설정 관리 */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">프롬프트 설정 관리</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowConfigModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    + 새 설정
                  </button>
                  <button
                    onClick={() => promptConfigManager.exportConfigs()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    📤 내보내기
                  </button>
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
                    📥 가져오기
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) promptConfigManager.importConfigs(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* 저장된 설정 목록 */}
              {savedConfigs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedConfigs.map((config, index) => (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPromptConfig?.name === config.name
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => applyPromptConfig(config)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{config.name}</h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              applyPromptConfig(config);
                            }}
                            className="text-green-600 hover:text-green-700 text-sm"
                          >
                            ✅ 적용
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePromptConfig(config.name);
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            🗑️ 삭제
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{config.description}</p>
                      <div className="text-xs text-gray-500">
                        {new Date(config.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {savedConfigs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>저장된 프롬프트 설정이 없습니다.</p>
                  <p className="text-sm">+ 새 설정 버튼을 클릭하여 설정을 저장하세요.</p>
                </div>
              )}
            </div>
          </div>

          {/* 러프 콘텐츠 입력 섹션 */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-2xl">⚡</span>
              <h2 className="text-xl font-semibold text-gray-900">러프 콘텐츠 입력</h2>
              <span className="text-sm text-gray-500">두서없이 써도 AI가 정리해드립니다</span>
            </div>
            
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
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                지우기
              </button>
            </div>
          </div>

          {/* 편집 폼 */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
                <input
                  type="text"
                  value={formData.title}
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
                  value={formData.excerpt}
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
                    content={formData.content}
                    onChange={(content) => setFormData({...formData, content})}
                    placeholder="게시물 내용을 입력하세요"
                  />
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <select
                  value={formData.category}
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
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">초안</option>
                  <option value="published">발행</option>
                  <option value="archived">보관</option>
                </select>
              </div>

              {/* 이미지 생성 섹션 */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">이미지 생성</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이미지 생성 개수</label>
                    <select
                      value={imageGenerationCount}
                      onChange={(e) => setImageGenerationCount(Number(e.target.value) as 1 | 2 | 3 | 4)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="creative">창의적</option>
                      <option value="balanced">균형</option>
                      <option value="precise">정확</option>
                      <option value="ultra_precise">초정확</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 기본 이미지 생성 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">기본 이미지 생성</h4>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => generateAIImage(imageGenerationCount)}
                        disabled={isGeneratingImages || !formData.title}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
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
                      
                      <button
                        type="button"
                        onClick={handleGenerateParagraphImages}
                        disabled={isGeneratingImages || !formData.content}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
                      >
                        {isGeneratingImages ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>생성 중...</span>
                          </>
                        ) : (
                          <>
                            <span>📝</span>
                            <span>단락별 이미지</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 톤앤매너별 이미지 생성 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">톤앤매너별 이미지 생성</h4>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={generateGoldTonePrompts}
                        disabled={isGeneratingGoldToneImages || !formData.content}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
                      >
                        {isGeneratingGoldToneImages ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>생성 중...</span>
                          </>
                        ) : (
                          <>
                            <span>🏆</span>
                            <span>골드톤 시니어</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        onClick={generateBlackTonePrompts}
                        disabled={isGeneratingBlackToneImages || !formData.content}
                        className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50 flex items-center space-x-2 text-sm"
                      >
                        {isGeneratingBlackToneImages ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>생성 중...</span>
                          </>
                        ) : (
                          <>
                            <span>⚡</span>
                            <span>블랙톤 젊은</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 기존 이미지 변형 */}
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">기존 이미지 변형</h4>
                  <button
                    type="button"
                    onClick={() => setShowExistingImageModal(true)}
                    disabled={isGeneratingExistingVariation}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2 text-sm"
                  >
                    {isGeneratingExistingVariation ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>변형 중...</span>
                      </>
                    ) : (
                      <>
                        <span>🔄</span>
                        <span>기존 이미지 변형</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 이미지 생성 진행 상황 */}
                {imageGenerationStep && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-800">{imageGenerationStep}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 생성된 이미지 갤러리 */}
              {showGeneratedImages && generatedImages.length > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">생성된 이미지</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {generatedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url || image}
                          alt={`생성된 이미지 ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <button
                            onClick={() => {
                              setSelectedGeneratedImage(image.url || image);
                              setShowGeneratedImageModal(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 px-3 py-1 rounded text-sm font-medium transition-all duration-200"
                          >
                            확대
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

      {/* 베리에이션 추천 모달 */}
      {showVariationModal && (
        <VariationRecommendationModal
          isOpen={showVariationModal}
          onClose={() => setShowVariationModal(false)}
          variations={[]} // 실제 베리에이션 데이터 전달
          onSelectVariation={(variation) => {
            // 베리에이션 선택 처리
            setFormData(prev => ({
              ...prev,
              title: variation.title,
              content: variation.content
            }));
            setShowVariationModal(false);
          }}
        />
      )}

      {/* 이미지 확대 모달 */}
      {showGeneratedImageModal && selectedGeneratedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
            
            <div className="text-center">
              <img
                src={selectedGeneratedImage}
                alt="확대된 이미지"
                className="max-w-full max-h-96 mx-auto rounded-lg"
              />
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  // 이미지를 대표 이미지로 설정
                  setFormData(prev => ({
                    ...prev,
                    featured_image: selectedGeneratedImage
                  }));
                  setShowGeneratedImageModal(false);
                  alert('대표 이미지로 설정되었습니다.');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                대표 이미지로 설정
              </button>
              <button
                onClick={() => setShowGeneratedImageModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 골드톤 프롬프트 미리보기 모달 */}
      {showGoldTonePrompts && goldTonePrompts.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-yellow-800">🏆 골드톤 시니어 매너 프롬프트</h3>
              <button
                onClick={() => setShowGoldTonePrompts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {goldTonePrompts.map((prompt, index) => (
                <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 mb-2">프롬프트 {index + 1}</h4>
                  <p className="text-sm text-gray-700">{prompt}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowGoldTonePrompts(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 블랙톤 프롬프트 미리보기 모달 */}
      {showBlackTonePrompts && blackTonePrompts.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">⚡ 블랙톤 젊은 매너 프롬프트</h3>
              <button
                onClick={() => setShowBlackTonePrompts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {blackTonePrompts.map((prompt, index) => (
                <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">프롬프트 {index + 1}</h4>
                  <p className="text-sm text-gray-700">{prompt}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowBlackTonePrompts(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프롬프트 설정 저장 모달 */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">새 프롬프트 설정 저장</h3>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="예: 골드톤 시니어 매너"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">설명</label>
                <textarea
                  value={newConfigDescription}
                  onChange={(e) => setNewConfigDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="이 설정에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowConfigModal(false);
                  setNewConfigName('');
                  setNewConfigDescription('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!newConfigName.trim()) {
                    alert('설정 이름을 입력해주세요.');
                    return;
                  }
                  
                  const brandStrategy = currentBrandStrategy || {
                    customerpersona: selectedPersona,
                    customerChannel: 'local_customers',
                    brandWeight: selectedBrandWeight,
                    audienceTemperature: 'warm',
                    audienceWeight: 'high'
                  };
                  
                  savePromptConfig(newConfigName, newConfigDescription, brandStrategy);
                  setShowConfigModal(false);
                  setNewConfigName('');
                  setNewConfigDescription('');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 기존 이미지 변형 모달 */}
      {showExistingImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">기존 이미지 변형</h3>
              <button
                onClick={() => setShowExistingImageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이미지 URL</label>
                <input
                  type="url"
                  value={selectedExistingImage}
                  onChange={(e) => setSelectedExistingImage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="변형할 이미지의 URL을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">개선된 프롬프트 (선택사항)</label>
                <textarea
                  value={improvedPrompt}
                  onChange={(e) => setImprovedPrompt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="이미지 변형을 위한 추가 프롬프트를 입력하세요"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowExistingImageModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleExistingImageVariation}
                disabled={isGeneratingExistingVariation || !selectedExistingImage}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {isGeneratingExistingVariation ? '변형 중...' : '변형 시작'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
