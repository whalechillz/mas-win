import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
const TipTapEditor = dynamic(() => import('../../components/admin/TipTapEditor'), { ssr: false });
const GalleryPicker = dynamic(() => import('../../components/admin/GalleryPicker'), { ssr: false });
import Head from 'next/head';
import AdminNav from '../../components/admin/AdminNav';
import { useRouter } from 'next/router';
import { CONTENT_STRATEGY, CUSTOMER_PERSONAS, CUSTOMER_CHANNELS } from '../../lib/masgolf-brand-data';
import PostList from '../../components/admin/PostList';
import PostGrid from '../../components/admin/PostGrid';

export default function BlogAdmin() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('published_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // 이미지 저장 상태 관리 (확대 모달에서는 더 이상 사용하지 않음)
  const [imageSavingStates, setImageSavingStates] = useState<{[key: number]: 'idle' | 'saving' | 'saved' | 'error'}>({});

  // 이미지 생성 개수 선택
  const [imageGenerationCount, setImageGenerationCount] = useState<1 | 2 | 3 | 4>(1);

  // AI 프리셋 설정
  const [aiPreset, setAiPreset] = useState<'creative' | 'balanced' | 'precise' | 'ultra_precise'>('creative');

  // AI 프리셋 상수 정의
  const AI_PRESETS = {
    creative: {
      name: "창의적 변형",
      description: "다양하고 창의적인 이미지 - 골퍼 사진에 적합",
      guidance_scale: 7.5,
      num_inference_steps: 20
    },
    balanced: {
      name: "균형 변형",
      description: "창의성과 정확성의 균형 - 일반적인 용도",
      guidance_scale: 5.0,
      num_inference_steps: 30
    },
    precise: {
      name: "정밀 변형",
      description: "원본에 충실한 정확한 변형 - 제품 사진에 적합",
      guidance_scale: 3.0,
      num_inference_steps: 40
    },
    ultra_precise: {
      name: "초정밀 변형",
      description: "인물/배경/구도/색감 완전 유지 - 동일 인물 보장",
      guidance_scale: 2.5,
      num_inference_steps: 50
    }
  };

  // 브랜드 전략 1단계: 필수 설정 상태 (콘텐츠 유형, 페르소나) + 자동 브랜드 강도
  const [brandPersona, setBrandPersona] = useState<'high_rebound_enthusiast' | 'health_conscious_senior' | 'competitive_maintainer' | 'returning_60plus' | 'distance_seeking_beginner'>('competitive_maintainer');
  const [brandContentType, setBrandContentType] = useState<'골프 정보' | '튜토리얼' | '고객 후기' | '고객 스토리' | '이벤트'>('골프 정보');

  // SEO 최적화: 한국어 제목을 영어 슬러그로 변환
  const generateSlug = (title) => {
    const slugMap = {
      // 골프 기법 관련
      '골프 드라이버 스윙 기법': 'golf-driver-swing-technique',
      '골프 아이언 스윙 방법': 'golf-iron-swing-method',
      '골프 퍼터 자세': 'golf-putter-stance',
      '골프 그립 잡는 법': 'golf-grip-technique',
      '골프 스탠스 자세': 'golf-stance-position',
      
      // 골프장 관련
      '서울 골프장 리뷰': 'seoul-golf-course-review',
      '경기 골프장 추천': 'gyeonggi-golf-course-recommendation',
      '인천 골프장 가이드': 'incheon-golf-course-guide',
      '부산 골프장 정보': 'busan-golf-course-info',
      
      // 골프 장비 관련
      '골프 드라이버 추천': 'golf-driver-recommendation',
      '골프 아이언 세트': 'golf-iron-set',
      '골프 퍼터 선택': 'golf-putter-selection',
      '골프 백 추천': 'golf-bag-recommendation',
      '골프 공 종류': 'golf-ball-types',
      
      // 골프 용품 관련
      '골프 장갑 추천': 'golf-glove-recommendation',
      '골프 신발 선택': 'golf-shoes-selection',
      '골프 의류 브랜드': 'golf-clothing-brands',
      '골프 모자 스타일': 'golf-hat-style',
      
      // 골프 레슨 관련
      '골프 초보자 가이드': 'golf-beginner-guide',
      '골프 레슨 추천': 'golf-lesson-recommendation',
      '골프 연습 방법': 'golf-practice-method',
      '골프 실력 향상': 'golf-skill-improvement',
      
      // 골프 룰 관련
      '골프 룰 정리': 'golf-rules-guide',
      '골프 에티켓': 'golf-etiquette',
      '골프 핸디캡': 'golf-handicap',
      '골프 스코어 계산': 'golf-score-calculation'
    };
    
    // 매핑된 슬러그가 있으면 사용
    if (slugMap[title]) {
      return slugMap[title];
    }
    
    // 매핑이 없으면 자동 변환
    return title
      .toLowerCase()
      .replace(/[가-힣]/g, '') // 한글 제거
      .replace(/\s+/g, '-')    // 공백을 하이픈으로
      .replace(/[^a-z0-9-]/g, '') // 특수문자 제거
      .replace(/-+/g, '-')     // 연속 하이픈 제거
      .replace(/^-|-$/g, '')   // 앞뒤 하이픈 제거
      .substring(0, 50);       // 길이 제한
  };
  const getBrandWeight = (ct: typeof brandContentType): 'low' | 'medium' | 'high' => {
    const strategy = (CONTENT_STRATEGY as any)[ct];
    return (strategy?.brandWeight as 'low' | 'medium' | 'high') || 'medium';
  };

  // 오디언스 온도 상태
  const [audienceTemperature, setAudienceTemperature] = useState<'cold' | 'warm' | 'hot' | 'pre_customer_inquiry_phone' | 'pre_customer_inquiry_kakao' | 'pre_customer_inquiry_website' | 'pre_customer_test_booking' | 'customer_purchase_lt_1y' | 'customer_purchase_1_2y' | 'customer_purchase_2_5y' | 'customer_purchase_gte_5y'>('warm');
  
  // 오디언스 온도 가중치 계산
  const getAudienceWeight = (temp: typeof audienceTemperature): number => {
    const weights = {
      cold: 0,
      warm: 1,
      hot: 2,
      pre_customer_inquiry_phone: 1,
      pre_customer_inquiry_kakao: 1,
      pre_customer_inquiry_website: 1,
      pre_customer_test_booking: 2,
      customer_purchase_lt_1y: 3,
      customer_purchase_1_2y: 2,
      customer_purchase_2_5y: 1,
      customer_purchase_gte_5y: 0
    };
    return weights[temp] ?? 0;
  };

  // 페르소나별 추천 오디언스 온도
  const getRecommendedAudience = (persona: typeof brandPersona): typeof audienceTemperature => {
    switch (persona) {
      case 'competitive_maintainer': return 'pre_customer_test_booking';
      case 'high_rebound_enthusiast': return 'hot';
      case 'health_conscious_senior': return 'warm';
      case 'returning_60plus': return 'warm';
      case 'distance_seeking_beginner': return 'cold';
      default: return 'warm';
    }
  };

  // 이미지 관리 관련 상태
  const [postImages, setPostImages] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showImageGroupModal, setShowImageGroupModal] = useState(false);
  const [selectedImageGroup, setSelectedImageGroup] = useState([]);
  const [totalImagesCount, setTotalImagesCount] = useState(0);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [imagesPerPage] = useState(20); // 페이지당 20개 이미지
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  
  // 갤러리 아코디언 상태
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState('all'); // 'all', 'featured', 'search'
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [pendingEditorImageInsert, setPendingEditorImageInsert] = useState<null | ((url: string) => void)>(null);
  const [showLargeImageModal, setShowLargeImageModal] = useState(false);
  const [largeImageUrl, setLargeImageUrl] = useState('');
  const [showSelectFromGalleryModal, setShowSelectFromGalleryModal] = useState(false);
  const [showUnifiedPicker, setShowUnifiedPicker] = useState(false);
  const [galleryPickerFilter, setGalleryPickerFilter] = useState<'all' | 'webp' | 'medium' | 'thumb'>('all');
  const [galleryPickerAlt, setGalleryPickerAlt] = useState('');
  const [galleryPickerTitle, setGalleryPickerTitle] = useState('');
  const [galleryPickerQuery, setGalleryPickerQuery] = useState('');
  const [galleryInsertPreference, setGalleryInsertPreference] = useState<'auto' | 'original' | 'webp' | 'medium' | 'thumb'>('auto');
  const galleryRecommendedTags = ['golf', 'driver', 'club', 'swing', 'masgolf', 'green', 'fairway'];

  // 이미지 버전 우선 삽입 URL 계산
  const getPreferredVersionUrl = (img: any): string => {
    const name: string = img?.name || '';
    const url: string = img?.url || '';
    const base = name
      .replace(/_thumb\.(webp|jpg|jpeg|png|gif)$/i, '.')
      .replace(/_medium\.(webp|jpg|jpeg|png|gif)$/i, '.')
      .replace(/\.webp$/i, '.');
    const matchBase = (candidate: any) => candidate && typeof candidate.name === 'string' && candidate.name.startsWith(base.split('.')[0]);
    const findBy = (predicate: (n: string) => boolean) => {
      const found = allImages.find((it: any) => matchBase(it) && predicate(it.name));
      return found?.url;
    };
    const pref = galleryInsertPreference;
    if (pref === 'original') return forceHttps(url);
    if (pref === 'webp') return forceHttps(findBy(n => /\.webp$/i.test(n)) || url);
    if (pref === 'medium') return forceHttps(findBy(n => /_medium\./i.test(n)) || url);
    if (pref === 'thumb') return forceHttps(findBy(n => /_thumb\./i.test(n) || /_thumb\.webp$/i.test(n)) || url);
    // auto: 선호 순서 webp -> medium -> original
    return forceHttps(findBy(n => /\.webp$/i.test(n)) || findBy(n => /_medium\./i.test(n)) || url);
  };

  // HTTP URL을 HTTPS로 강제 변환
  const forceHttps = (url: string): string => {
    if (!url) return url;
    if (url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  // 대표 이미지인지 확인하는 함수
  const isFeaturedImage = (imageUrl: string): boolean => {
    return formData.featured_image === forceHttps(imageUrl);
  };

  // 대표 이미지 상태 표시 함수
  const getFeaturedImageStatus = (imageUrl: string): string => {
    if (isFeaturedImage(imageUrl)) {
      return '⭐ 대표 이미지';
    }
    return '';
  };

  // 갤러리 삽입 시 메타데이터 저장
  const saveImageMetadata = async (img: any, altText: string) => {
    try {
      await fetch('/api/admin/image-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageName: img?.name,
          imageUrl: img?.url,
          customAltText: altText,
        })
      });
    } catch (e) {
      console.warn('메타데이터 저장 실패:', e);
    }
  };

  const updateImageMetadata = async (imageName: string, data: { altText?: string; keywords?: string[]; seoTitle?: string; description?: string }) => {
    try {
      const res = await fetch('/api/admin/image-metadata', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName, ...data })
      });
      if (!res.ok) throw new Error('메타데이터 업데이트 실패');
      return true;
    } catch (e) {
      console.warn('메타데이터 업데이트 실패:', e);
      return false;
    }
  };

  // AI 콘텐츠 개선 관련 상태
  const [simpleAIRequest, setSimpleAIRequest] = useState('');
  const [isImprovingContent, setIsImprovingContent] = useState(false);
  const [improvementProcess, setImprovementProcess] = useState('');
  const [improvedContent, setImprovedContent] = useState('');
  const [showImprovedContent, setShowImprovedContent] = useState(false);
  
  // 이미지 변형 관련 상태
  const [selectedBaseImage, setSelectedBaseImage] = useState('');
  const [variationStrength, setVariationStrength] = useState(0.7);
  const [isGeneratingVariation, setIsGeneratingVariation] = useState(false);
  
  // 기존 이미지 변형 관련 상태
  const [showExistingImageModal, setShowExistingImageModal] = useState(false);
  const [selectedExistingImage, setSelectedExistingImage] = useState('');
  const [isGeneratingExistingVariation, setIsGeneratingExistingVariation] = useState(false);
  
  // 간단 AI 이미지 개선 관련 상태
  const [simpleAIImageRequest, setSimpleAIImageRequest] = useState('');
  const [selectedImageForImprovement, setSelectedImageForImprovement] = useState('');
  const [isImprovingImage, setIsImprovingImage] = useState(false);
  
  // 저장된 프롬프트 관리 상태
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [expandedPromptId, setExpandedPromptId] = useState(null);
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [editingKoreanPrompt, setEditingKoreanPrompt] = useState('');
  
  // 네이버 블로그 마이그레이션 관련 상태
  const [showNaverMigration, setShowNaverMigration] = useState(false);
  const [naverBlogUrl, setNaverBlogUrl] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState('');
  const [migratedPosts, setMigratedPosts] = useState([]);

  // 고급 기능 관련 상태
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [isOptimizingSEO, setIsOptimizingSEO] = useState(false);
  const [seoOptimizationResult, setSeoOptimizationResult] = useState('');

  // 제목/슬러그 AI 관련 상태
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [showTitleOptions, setShowTitleOptions] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category: '고객 후기',
    tags: [],
    status: 'published',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    view_count: 0,
    is_featured: false,
    is_scheduled: false,
    scheduled_at: null,
    author: '마쓰구골프'
  });

  // 게시물 목록 불러오기
  const fetchPosts = useCallback(async (currentSortBy = sortBy, currentSortOrder = sortOrder) => {
    try {
      setLoading(true);
      console.log('🔍 게시물 목록 불러오는 중...');
      
      const sortParams = new URLSearchParams({
        sortBy: currentSortBy,
        sortOrder: currentSortOrder
      });
      
      const response = await fetch(`/api/admin/blog?${sortParams}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ 게시물 목록 로드 성공:', data.posts?.length || 0, '개');
        setPosts(data.posts || []);
      } else {
        console.error('❌ 게시물 목록 로드 실패:', data.error);
        alert('게시물을 불러올 수 없습니다: ' + data.error);
      }
    } catch (error) {
      console.error('❌ 게시물 목록 로드 에러:', error);
      alert('게시물을 불러올 수 없습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      category: '고객 후기',
      tags: [],
      status: 'published',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      view_count: 0,
      is_featured: false,
      is_scheduled: false,
      scheduled_at: null,
      author: '마쓰구골프'
    });
    setEditingPost(null);
    setShowForm(false);
  };

  // 게시물 저장/수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isSubmitting) {
      setIsSubmitting(true);
    
    try {
      console.log('📝 게시물 저장 중...');
      
      if (editingPost) {
        // 수정
        const response = await fetch(`/api/admin/blog/${editingPost.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            alert('게시물이 수정되었습니다!');
          fetchPosts();
          resetForm();
        } else {
          const error = await response.json();
          alert('수정 실패: ' + error.error);
        }
      } else {
        // 새 게시물 생성
        const response = await fetch('/api/admin/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          alert('게시물이 생성되었습니다!');
          fetchPosts();
          resetForm();
        } else {
          const error = await response.json();
          alert('생성 실패: ' + error.error);
        }
      }
    } catch (error) {
      console.error('❌ 게시물 저장 에러:', error);
      alert('저장 실패: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // 게시물 삭제
  const handleDelete = async (id) => {
    if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;
    
    try {
      console.log('🗑️ 게시물 삭제 중...');
      
      const response = await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('게시물이 삭제되었습니다!');
        fetchPosts();
      } else {
        const error = await response.json();
        alert('삭제 실패: ' + error.error);
      }
    } catch (error) {
      console.error('❌ 게시물 삭제 에러:', error);
      alert('삭제 실패: ' + error.message);
    }
  };

  // 체크박스 선택/해제
  const handlePostSelect = (postId) => {
    const id = Array.isArray(postId) ? postId[0] : postId;
    setSelectedPosts(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  // 모두 선택/해제
  const handleSelectAll = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(post => post.id));
    }
  };

  // 선택된 게시물 삭제
  const handleSelectedDelete = async () => {
    if (selectedPosts.length === 0) {
      alert('삭제할 게시물을 선택해주세요.');
      return;
    }

    const selectedPostTitles = selectedPosts
      .map(id => posts.find(post => post.id === id)?.title)
      .filter(Boolean)
      .slice(0, 5);

    const confirmMessage = `선택된 ${selectedPosts.length}개의 게시물을 삭제하시겠습니까?\n\n삭제될 게시물:\n${selectedPostTitles.join('\n')}${selectedPosts.length > 5 ? '\n...' : ''}\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      console.log('🗑️ 선택된 게시물 삭제 중...', selectedPosts);
      
      const deletePromises = selectedPosts.map(id => 
        fetch(`/api/admin/blog/${id}`, {
          method: 'DELETE'
        })
      );
      
      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(response => !response.ok);
      
      if (failedDeletes.length === 0) {
        alert(`${selectedPosts.length}개 게시물이 삭제되었습니다!`);
        setSelectedPosts([]);
        fetchPosts();
      } else {
        alert(`${selectedPosts.length - failedDeletes.length}개 삭제 성공, ${failedDeletes.length}개 삭제 실패`);
        setSelectedPosts([]);
        fetchPosts();
      }
    } catch (error) {
      console.error('선택된 게시물 삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 게시물 수정 모드로 전환
  const handleEdit = useCallback(async (post) => {
    try {
      console.log('📝 게시물 수정 모드 시작:', post.id);
      
    setEditingPost(post);
    setFormData({
        title: post.title || '',
        slug: post.slug || '',
          excerpt: post.excerpt || '',
          content: post.content || '',
        featured_image: post.featured_image || '',
        category: post.category || '고객 후기',
        tags: Array.isArray(post.tags) ? post.tags : [],
        status: post.status || 'draft',
        meta_title: post.meta_title || '',
        meta_description: post.meta_description || '',
        meta_keywords: post.meta_keywords || '',
        view_count: post.view_count || 0,
        is_featured: post.is_featured || false,
        is_scheduled: post.is_scheduled || false,
        scheduled_at: post.scheduled_at || null,
        author: post.author || '마쓰구골프'
      });
      
    setShowForm(true);
          setActiveTab('create');
    } catch (error) {
      console.error('❌ 게시물 수정 모드 오류:', error);
      alert('게시물 수정 모드 진입 중 오류가 발생했습니다.');
    }
  }, []);

  // generateSlug 함수는 위에서 이미 정의됨 (SEO 최적화된 버전 사용)

  // AI 슬러그 생성
  const generateAISlug = async () => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }
    try {
      const response = await fetch('/api/generate-slug', {
        method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title })
          });
        if (response.ok) {
        const { slug } = await response.json();
        setFormData({ ...formData, slug });
      } else {
        alert('AI 슬러그 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('AI 슬러그 생성 에러:', error);
      alert('AI 슬러그 생성 중 오류가 발생했습니다.');
    }
  };

  // AI 제목 5개 생성
  const generateAITitle = async () => {
    // 러프 소스가 있는 경우 우선 사용: 없으면 요약/제목으로 대체
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
          contentSource,
          contentType: formData.category,
          customerPersona: brandPersona,
          customerChannel: 'local_customers',
          brandWeight: getBrandWeight(brandContentType)
        })
      });
      if (!response.ok) throw new Error('제목 생성 실패');
      const data = await response.json();
      setGeneratedTitles(Array.isArray(data.titles) ? data.titles : []);
      setShowTitleOptions(true);
    } catch (error: any) {
      console.error('AI 제목 생성 오류:', error);
      alert(`AI 제목 생성 실패: ${error.message}`);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const selectGeneratedTitle = (title: string) => {
        setFormData({
          ...formData,
      title,
      slug: generateSlug(title),
      meta_title: title
    });
    setShowTitleOptions(false);
  };

  // 제목 추천 모달
  const TitleSelectModal = () => {
    if (!showTitleOptions) return null;
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-xl">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">추천 제목 선택</h3>
            <button type="button" className="text-gray-500" onClick={() => setShowTitleOptions(false)}>✕</button>
          </div>
          <div className="p-4 space-y-2 max-h-[60vh] overflow-auto">
            {generatedTitles.length === 0 && (
              <div className="text-sm text-gray-500">추천 제목이 없습니다.</div>
            )}
            {generatedTitles.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectGeneratedTitle(t)}
                className="w-full text-left p-3 border rounded hover:bg-gray-50"
              >
                {t}
              </button>
            ))}
          </div>
          <div className="p-4 border-t flex justify-end">
            <button type="button" onClick={() => setShowTitleOptions(false)} className="px-4 py-2 bg-gray-600 text-white rounded">닫기</button>
          </div>
        </div>
      </div>
    );
  };

  // 본문 단락별 이미지 일괄 생성 → TipTap에 순차 삽입
  const [isGeneratingParagraphImages, setIsGeneratingParagraphImages] = useState(false);
  const [paragraphPrompts, setParagraphPrompts] = useState([]); // 단락별 프롬프트 배열
  const [showParagraphPromptPreview, setShowParagraphPromptPreview] = useState(false);
  
  // 단락별 프롬프트 미리 생성
  const generateParagraphPrompts = async () => {
    if (!formData.content || formData.content.trim().length < 30) {
      alert('본문을 먼저 작성해주세요. (최소 30자)');
      return;
    }
    
    if (isGeneratingParagraphImages) {
      alert('이미 생성 중입니다. 잠시만 기다려주세요.');
      return;
    }
    
    try {
      setImageGenerationStep('단락 분석 및 프롬프트 생성 중...');
      
      const res = await fetch('/api/generate-paragraph-prompts', {
        method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: formData.content,
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: formData.category,
          imageCount: imageGenerationCount, // 생성할 이미지 개수 전달
          brandStrategy: { 
            customerPersona: brandPersona, 
            customerChannel: 'local_customers', 
            brandWeight: getBrandWeight(brandContentType),
            audienceTemperature,
            audienceWeight: getAudienceWeight(audienceTemperature)
          }
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '프롬프트 생성 실패');
      }
      
      const data = await res.json();
      console.log('📝 API 응답 데이터:', data);
      console.log('📝 받은 프롬프트 개수:', data.prompts?.length || 0);
      console.log('📝 프롬프트 내용:', data.prompts?.map((p, i) => `단락 ${i+1}: ${p.prompt.substring(0, 50)}...`));
      
      setParagraphPrompts(data.prompts || []);
      setShowParagraphPromptPreview(true);
      setImageGenerationStep('');
      
    } catch (e: any) {
      console.error('단락 프롬프트 생성 오류:', e);
      alert('단락 프롬프트 생성 중 오류가 발생했습니다: ' + e.message);
      setImageGenerationStep('');
    }
  };
  
  // 수정된 프롬프트로 이미지 생성
  const handleGenerateParagraphImagesWithCustomPrompts = async () => {
    if (!paragraphPrompts.length) {
      alert('수정된 프롬프트가 없습니다.');
      return;
    }
    
    if (isGeneratingParagraphImages) {
      alert('이미 생성 중입니다. 잠시만 기다려주세요.');
      return;
    }
    
    try {
      setIsGeneratingParagraphImages(true);
      setShowGenerationProcess(true);
      setImageGenerationModel('FAL AI (단락별)');
      setImageGenerationStep('수정된 프롬프트로 이미지 생성 중...');
      
      const res = await fetch('/api/generate-paragraph-images-with-prompts', {
        method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompts: paragraphPrompts,
          blogPostId: editingPost?.id || null
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '이미지 생성 실패');
      }
      
      setImageGenerationStep('본문에 삽입 중...');
      const data = await res.json();
      console.log('📷 단락별 이미지 생성 API 응답:', data);
      
      const urls: string[] = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);
      console.log('📷 생성된 이미지 URL 개수:', urls.length);
      console.log('📷 이미지 URL들:', urls);
      
      if (!urls.length) {
        alert('생성된 이미지가 없습니다.');
        return;
      }
      
      // 생성된 이미지를 갤러리에 추가 (자동 삽입 없이)
      setGeneratedImages(prev => [...prev, ...urls]);
      setShowGeneratedImages(true);
      
      setImageGenerationStep('완료!');
      alert(`${urls.length}개의 이미지가 수정된 프롬프트로 생성되어 갤러리에 추가되었습니다. 필요시 갤러리에서 본문에 삽입하세요.`);
      
    } catch (e: any) {
      console.error('단락 이미지 생성 오류:', e);
      alert('단락 이미지 생성 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setIsGeneratingParagraphImages(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };
  
  const handleGenerateParagraphImages = async () => {
    if (!formData.content || formData.content.trim().length < 30) {
      alert('본문을 먼저 작성해주세요. (최소 30자)');
      return;
    }

    if (isGeneratingParagraphImages) {
      alert('이미 생성 중입니다. 잠시만 기다려주세요.');
      return;
    }
    
    try {
      setIsGeneratingParagraphImages(true);
      setShowGenerationProcess(true);
      setImageGenerationModel('FAL AI (단락별)');
      setImageGenerationStep('단락 분석 중...');
      
      const res = await fetch('/api/generate-paragraph-images', {
        method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: formData.content,
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: formData.category,
          imageCount: imageGenerationCount, // 생성할 이미지 개수 전달
          blogPostId: editingPost?.id || null,
          brandStrategy: { 
            customerPersona: brandPersona, 
            customerChannel: 'local_customers', 
            brandWeight: getBrandWeight(brandContentType),
            audienceTemperature,
            audienceWeight: getAudienceWeight(audienceTemperature)
          },
          preset: aiPreset
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '이미지 생성 실패');
      }
      
      setImageGenerationStep('이미지 생성 중...');
      const data = await res.json();
      const urls: string[] = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);
      
      if (!urls.length) {
        alert('생성된 이미지가 없습니다.');
      return;
    }

      setImageGenerationStep('본문에 삽입 중...');
      
      // 생성된 이미지를 갤러리에 추가 (자동 삽입 없이)
      setGeneratedImages(prev => [...prev, ...urls]);
      setShowGeneratedImages(true);
      
      setImageGenerationStep('완료!');
      alert(`${urls.length}개의 이미지가 생성되어 갤러리에 추가되었습니다. 필요시 갤러리에서 본문에 삽입하세요.`);
      
    } catch (e: any) {
      console.error('단락 이미지 생성 오류:', e);
      alert('단락 이미지 생성 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setIsGeneratingParagraphImages(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // AI 이미지 생성 함수들
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
      
      // 1단계: 프롬프트 준비 (수정본 우선)
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
              customerPersona: brandPersona,
              customerChannel: '',
              brandWeight: getBrandWeight(brandContentType),
              audienceTemperature,
              audienceWeight: getAudienceWeight(audienceTemperature)
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
          contentType: formData.category,
          brandStrategy: {
            contentType: formData.category,
            customerPersona: brandPersona,
            customerChannel: '',
            brandWeight: getBrandWeight(brandContentType),
            audienceTemperature,
            audienceWeight: getAudienceWeight(audienceTemperature)
          },
          imageCount: count,
          customPrompt: smartPrompt
        })
      });

      if (response.ok) {
        const { imageUrls, metadata } = await response.json();
        
        // 3단계: 생성된 이미지를 Supabase에 저장
        setImageGenerationStep('3단계: 이미지를 Supabase에 저장 중...');
        const savedImages = [];
        
        for (let i = 0; i < imageUrls.length; i++) {
          try {
            const saveResponse = await fetch('/api/save-generated-image', {
        method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: imageUrls[i],
                fileName: `dalle3-${Date.now()}-${i + 1}.png`,
                blogPostId: editingPost?.id || null
              })
            });
            
            if (saveResponse.ok) {
              const { storedUrl } = await saveResponse.json();
              savedImages.push(storedUrl);
              console.log(`✅ 이미지 ${i + 1} 저장 완료:`, storedUrl);
      } else {
              console.warn(`⚠️ 이미지 ${i + 1} 저장 실패, 원본 URL 사용:`, imageUrls[i]);
              savedImages.push(imageUrls[i]);
      }
    } catch (error) {
            console.warn(`⚠️ 이미지 ${i + 1} 저장 중 오류:`, error);
            savedImages.push(imageUrls[i]);
          }
        }
        
        // 4단계: 이미지 생성 완료
        setImageGenerationStep('4단계: 이미지 생성 및 저장 완료!');
        
        // 5단계: 자동 메타데이터 생성 및 적용
        if (savedImages.length > 0) {
          setImageGenerationStep('5단계: 메타데이터 자동 생성 중...');
          try {
            const metadataItems = savedImages.map((url, index) => ({
              name: `dalle3-${Date.now()}-${index + 1}.png`,
              url: url,
              alt_text: '',
              title: '',
              description: '',
              keywords: [],
              category: formData.category || 'general'
            }));
            
            const metadataResponse = await fetch('/api/admin/generate-alt-batch', {
          method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                items: metadataItems, 
                mode: 'apply',
                context: {
                  title: formData.title,
                  excerpt: formData.excerpt,
                  category: formData.category,
                  prompt: smartPrompt
                }
              })
            });
            
            if (metadataResponse.ok) {
              console.log('✅ 메타데이터 자동 생성 완료');
      } else {
              console.warn('⚠️ 메타데이터 생성 실패, 수동 입력 필요');
      }
    } catch (error) {
            console.warn('⚠️ 메타데이터 생성 중 오류:', error);
          }
        }
        
        // 저장된 이미지들을 상태에 저장
        setGeneratedImages(savedImages);
        setShowGeneratedImages(true);
        
        console.log('✅ ChatGPT + DALL-E 3 이미지 생성 완료:', imageUrls.length, '개');
        alert(`${imageUrls.length}개의 ChatGPT + DALL-E 3 이미지가 생성되었습니다! 원하는 이미지를 선택하세요.`);
      } else {
        const error = await response.json();
        console.error('DALL-E 3 이미지 생성 실패:', error);
        setImageGenerationStep('❌ 이미지 생성 실패');
        alert('DALL-E 3 이미지 생성에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('ChatGPT + DALL-E 3 이미지 생성 에러:', error);
      setImageGenerationStep('❌ 이미지 생성 에러');
      alert('이미지 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsGeneratingImages(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // FAL AI 이미지 생성
  const generateFALAIImage = async (count = 4, customPromptOverride?: string) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('🎨 FAL AI 이미지 생성 시작...', count, '개');
      setIsGeneratingImages(true);
    setShowGenerationProcess(true);
      setImageGenerationModel('ChatGPT + FAL AI');

      // 1단계: 프롬프트 준비 (수정본 우선)
      let smartPrompt = customPromptOverride || imageGenerationPrompt;
      if (!smartPrompt) {
        setImageGenerationStep('1단계: ChatGPT로 프롬프트 생성 중...');
        const promptResponse = await fetch('/api/generate-smart-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
            contentType: formData.category,
          brandStrategy: {
              contentType: formData.category,
              customerPersona: brandPersona,
              customerChannel: '',
              brandWeight: getBrandWeight(brandContentType),
              audienceTemperature,
              audienceWeight: getAudienceWeight(audienceTemperature)
            },
            model: 'fal'
          })
        });

        if (!promptResponse.ok) {
          throw new Error('ChatGPT 프롬프트 생성 실패');
        }

        const resp = await promptResponse.json();
        smartPrompt = resp.prompt;
        setImageGenerationPrompt(smartPrompt);
      }
      
      setImageGenerationStep('2단계: FAL AI로 이미지 생성 중...');
      const response = await fetch('/api/generate-blog-image-fal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: formData.category,
          brandStrategy: {
            contentType: formData.category,
            customerPersona: brandPersona,
            customerChannel: '',
            brandWeight: getBrandWeight(brandContentType),
            audienceTemperature,
            audienceWeight: getAudienceWeight(audienceTemperature)
          },
          imageCount: count,
          customPrompt: smartPrompt,
          preset: aiPreset
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ FAL AI 이미지 생성 완료:', result.imageUrls.length, '개');
        setImageGenerationStep('3단계: FAL AI 이미지 생성 완료!');
        
        // 생성된 이미지들을 자동으로 Supabase에 저장
        const savedImages = [];
        for (let i = 0; i < result.imageUrls.length; i++) {
          try {
            const saveResponse = await fetch('/api/save-generated-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: result.imageUrls[i],
                fileName: `fal-ai-image-${Date.now()}-${i + 1}.png`,
                blogPostId: editingPost?.id || null
              })
            });
            
            if (saveResponse.ok) {
              const saveResult = await saveResponse.json();
              savedImages.push(saveResult.storedUrl);
      } else {
              savedImages.push(result.imageUrls[i]); // 저장 실패 시 원본 URL 사용
            }
          } catch (saveError) {
            console.error('이미지 저장 오류:', saveError);
            savedImages.push(result.imageUrls[i]); // 저장 실패 시 원본 URL 사용
          }
        }
        
        // 4단계: 자동 메타데이터 생성 및 적용
        if (savedImages.length > 0) {
          setImageGenerationStep('4단계: 메타데이터 자동 생성 중...');
          try {
            const metadataItems = savedImages.map((url, index) => ({
              name: `fal-ai-image-${Date.now()}-${index + 1}.png`,
              url: url,
              alt_text: '',
              title: '',
              description: '',
              keywords: [],
              category: formData.category || 'general'
            }));
            
            const metadataResponse = await fetch('/api/admin/generate-alt-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
                items: metadataItems, 
                mode: 'apply',
                context: {
          title: formData.title,
          excerpt: formData.excerpt,
                  category: formData.category,
                  prompt: smartPrompt
                }
        })
      });

            if (metadataResponse.ok) {
              console.log('✅ 메타데이터 자동 생성 완료');
            } else {
              console.warn('⚠️ 메타데이터 생성 실패, 수동 입력 필요');
            }
          } catch (error) {
            console.warn('⚠️ 메타데이터 생성 중 오류:', error);
          }
        }
        
        // 저장된 이미지들을 상태에 추가
        setGeneratedImages(prev => [...prev, ...savedImages]);
        setShowGeneratedImages(true);
        
        alert(`${savedImages.length}개의 FAL AI 이미지가 생성되고 Supabase에 자동 저장되었습니다!`);
      } else {
        const error = await response.json();
        console.error('FAL AI 이미지 생성 실패:', error);
        setImageGenerationStep('❌ FAL AI 이미지 생성 실패');
        alert('FAL AI 이미지 생성에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('FAL AI 이미지 생성 에러:', error);
      setImageGenerationStep('❌ FAL AI 이미지 생성 에러');
      alert('FAL AI 이미지 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsGeneratingImages(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // Google AI 이미지 생성
  const generateGoogleAIImage = async (count = 4, customPromptOverride?: string) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('🎨 Google AI 이미지 생성 시작...', count, '개');
      setIsGeneratingImages(true);
      setShowGenerationProcess(true);
      setImageGenerationModel('ChatGPT + Google AI');
      
      // 1단계: 프롬프트 준비 (수정본 우선)
      let smartPrompt = customPromptOverride || imageGenerationPrompt;
      if (!smartPrompt) {
        setImageGenerationStep('1단계: ChatGPT로 프롬프트 생성 중...');
      const promptResponse = await fetch('/api/generate-smart-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
            contentType: formData.category,
            brandStrategy: {
              contentType: formData.category,
              customerPersona: brandPersona,
              customerChannel: '',
              brandWeight: getBrandWeight(brandContentType),
              audienceTemperature,
              audienceWeight: getAudienceWeight(audienceTemperature)
            },
            model: 'google'
        })
      });

      if (!promptResponse.ok) {
        throw new Error('ChatGPT 프롬프트 생성 실패');
      }

        const resp = await promptResponse.json();
        smartPrompt = resp.prompt;
      setImageGenerationPrompt(smartPrompt);
      }
      
      setImageGenerationStep('2단계: Google AI로 이미지 생성 중...');
      const response = await fetch('/api/generate-blog-image-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: formData.category,
          brandStrategy: {
            contentType: formData.category,
            customerPersona: brandPersona,
            customerChannel: '',
            brandWeight: getBrandWeight(brandContentType),
            audienceTemperature,
            audienceWeight: getAudienceWeight(audienceTemperature)
          },
          imageCount: count,
          customPrompt: smartPrompt
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Google AI 이미지 생성 완료:', result.imageUrls.length, '개');
        setImageGenerationStep('3단계: Google AI 이미지 생성 완료!');
        
        // 생성된 이미지들을 자동으로 Supabase에 저장
        const savedImages = [];
        for (let i = 0; i < result.imageUrls.length; i++) {
          try {
            const saveResponse = await fetch('/api/save-generated-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageUrl: result.imageUrls[i],
                fileName: `google-ai-image-${Date.now()}-${i + 1}.png`,
                blogPostId: editingPost?.id || null
              })
            });
            
            if (saveResponse.ok) {
              const saveResult = await saveResponse.json();
              savedImages.push(saveResult.storedUrl);
            } else {
              savedImages.push(result.imageUrls[i]); // 저장 실패 시 원본 URL 사용
            }
          } catch (saveError) {
            console.error('이미지 저장 오류:', saveError);
            savedImages.push(result.imageUrls[i]); // 저장 실패 시 원본 URL 사용
          }
        }
        
        // 4단계: 자동 메타데이터 생성 및 적용
        if (savedImages.length > 0) {
          setImageGenerationStep('4단계: 메타데이터 자동 생성 중...');
          try {
            const metadataItems = savedImages.map((url, index) => ({
              name: `google-ai-image-${Date.now()}-${index + 1}.png`,
              url: url,
              alt_text: '',
              title: '',
              description: '',
              keywords: [],
              category: formData.category || 'general'
            }));
            
            const metadataResponse = await fetch('/api/admin/generate-alt-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
                items: metadataItems, 
                mode: 'apply',
                context: {
          title: formData.title,
          excerpt: formData.excerpt,
                  category: formData.category,
                  prompt: smartPrompt
          }
        })
      });

            if (metadataResponse.ok) {
              console.log('✅ 메타데이터 자동 생성 완료');
            } else {
              console.warn('⚠️ 메타데이터 생성 실패, 수동 입력 필요');
            }
          } catch (error) {
            console.warn('⚠️ 메타데이터 생성 중 오류:', error);
          }
        }
        
        // 저장된 이미지들을 상태에 추가
        setGeneratedImages(prev => [...prev, ...savedImages]);
        setShowGeneratedImages(true);
        
        alert(`${savedImages.length}개의 Google AI 이미지가 생성되고 Supabase에 자동 저장되었습니다!`);
      } else {
        const error = await response.json();
        console.error('Google AI 이미지 생성 실패:', error);
        setImageGenerationStep('❌ Google AI 이미지 생성 실패');
        alert('Google AI 이미지 생성에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('Google AI 이미지 생성 에러:', error);
      setImageGenerationStep('❌ Google AI 이미지 생성 에러');
      alert('Google AI 이미지 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsGeneratingImages(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // 생성된 이미지 선택
  const selectGeneratedImage = (imageUrl) => {
    setFormData({ ...formData, featured_image: forceHttps(imageUrl) });
    // setShowGeneratedImages(false); // 갤러리를 닫지 않음 - 수정 상태 유지
    alert('선택한 이미지가 대표 이미지로 설정되었습니다!');
  };

  // 이미지 URL 복사
  const copyImageUrl = async (imageUrl) => {
    try {
      const httpsUrl = forceHttps(imageUrl);
      await navigator.clipboard.writeText(httpsUrl);
      alert('이미지 URL이 클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('복사 실패:', error);
      alert('복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  };

  // 이미지를 내용에 삽입
  const insertImageToContent = (imageUrl) => {
      const httpsUrl = forceHttps(imageUrl);
      const imageMarkdown = `\n\n![이미지](${httpsUrl})\n\n`;
      setFormData({ 
        ...formData, 
        content: formData.content + imageMarkdown 
      });
    alert('이미지가 내용에 삽입되었습니다!');
  };

  // 이미지 관리 관련 함수들
  const fetchImageGallery = async (page = 1, reset = false) => {
    try {
      setIsLoadingImages(true);
      const offset = (page - 1) * imagesPerPage;
      const response = await fetch(`/api/admin/all-images?limit=${imagesPerPage}&offset=${offset}`);
      const data = await response.json();
      
      if (response.ok) {
        if (reset || page === 1) {
          setAllImages(data.images || []);
      } else {
          setAllImages(prev => [...prev, ...(data.images || [])]);
        }
        setTotalImagesCount(data.total || 0);
        setCurrentPage(page);
        console.log('✅ 이미지 갤러리 로드 성공:', data.images?.length || 0, '개 (페이지', page, ')');
      } else {
        console.error('❌ 이미지 갤러리 로드 실패:', data.error);
      }
    } catch (error) {
      console.error('❌ 이미지 갤러리 로드 에러:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // 갤러리 토글 함수
  const toggleGallery = () => {
    if (!isGalleryOpen) {
      // 갤러리를 열 때만 이미지 로드
      fetchImageGallery(1, true);
    }
    setIsGalleryOpen(!isGalleryOpen);
  };

  // 필터링된 이미지 목록
  const getFilteredImages = () => {
    let filtered = allImages;
    
    if (galleryFilter === 'featured') {
      filtered = allImages.filter(img => isFeaturedImage(img.url));
    } else if (galleryFilter === 'search' && gallerySearchQuery.trim()) {
      const query = gallerySearchQuery.trim().toLowerCase();
      filtered = allImages.filter(img => 
        img.name.toLowerCase().includes(query) || 
        img.url.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const handleImageSelect = (imageName) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageName)) {
        newSet.delete(imageName);
      } else {
        newSet.add(imageName);
      }
      return newSet;
    });
  };

  // 페이지네이션 관련 함수들
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchImageGallery(newPage, true);
  };

  const handleLoadMore = () => {
    fetchImageGallery(currentPage + 1, false);
  };

  const totalPages = Math.ceil(totalImagesCount / imagesPerPage);
  const hasMorePages = currentPage < totalPages;

  const handleSelectAllImages = () => {
    if (selectedImages.size === allImages.length) {
      setSelectedImages(new Set());
      } else {
      setSelectedImages(new Set(allImages.map(img => img.name)));
    }
  };

  const deleteImage = async (imageName) => {
    if (!confirm(`정말로 "${imageName}" 이미지를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      const response = await fetch('/api/admin/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName })
      });

      if (response.ok) {
        alert('이미지가 삭제되었습니다!');
        
        // 로컬 상태에서도 제거
        setAllImages(prev => prev.filter(img => img.name !== imageName));
        setPostImages(prev => prev.filter(img => img.name !== imageName));
        
        // 대표 이미지가 삭제된 경우 초기화
        if (formData.featured_image && formData.featured_image.includes(imageName)) {
          setFormData(prev => ({ ...prev, featured_image: '' }));
        }
        
        // 선택 상태에서도 제거
        setSelectedImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(imageName);
          return newSet;
        });
      } else {
        alert('이미지 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      alert('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  const deleteSelectedImages = async () => {
    if (selectedImages.size === 0) {
      alert('삭제할 이미지를 선택해주세요.');
      return;
    }

    const confirmMessage = `선택된 ${selectedImages.size}개의 이미지를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const imageName of Array.from(selectedImages)) {
        try {
          const response = await fetch('/api/admin/delete-image', {
            method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageName })
          });

          if (response.ok) {
            successCount++;
            // 로컬 상태에서 제거
            setAllImages(prev => prev.filter(img => img.name !== imageName));
            setPostImages(prev => prev.filter(img => img.name !== imageName));
            
            // 대표 이미지가 삭제된 경우 초기화
            if (formData.featured_image && formData.featured_image.includes(imageName as string)) {
              setFormData(prev => ({ ...prev, featured_image: '' }));
            }
    } else {
            failCount++;
          }
        } catch (error) {
          console.error(`이미지 ${imageName} 삭제 오류:`, error);
          failCount++;
        }
      }

      // 선택 상태 초기화
      setSelectedImages(new Set());
      
      // 결과 알림
      if (successCount > 0 && failCount === 0) {
        alert(`✅ ${successCount}개의 이미지가 성공적으로 삭제되었습니다!`);
      } else if (successCount > 0 && failCount > 0) {
        alert(`⚠️ ${successCount}개 성공, ${failCount}개 실패했습니다.`);
      } else {
        alert(`❌ 이미지 삭제에 실패했습니다.`);
      }

    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      alert('일괄 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleImageGroupClick = (imageGroup) => {
    setSelectedImageGroup(imageGroup);
    setShowImageGroupModal(true);
  };

  // TipTap 갤러리 선택 모달 열기
  const openGalleryPicker = (insertCb: (url: string) => void) => {
    setPendingEditorImageInsert(() => insertCb);
    setShowUnifiedPicker(true);
  };

  // 이미지 그룹화 함수 (4개 버전을 하나의 그룹으로 묶기)
  const groupImagesByBaseName = (images) => {
    const groups = {};
    
    images.forEach(image => {
      // 파일명에서 기본 이름 추출 (버전 접미사 제거)
      let baseName = image.name;
      
      // 모든 버전 접미사 제거 (더 포괄적으로)
      baseName = baseName.replace(/_thumb\.(webp|jpg|jpeg|png|gif)$/i, '');
      baseName = baseName.replace(/_medium\.(webp|jpg|jpeg|png|gif)$/i, '');
      baseName = baseName.replace(/\.webp$/i, '');
      
      // 타임스탬프 제거 (13자리 숫자)
      baseName = baseName.replace(/-\d{13}$/, '');
      
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      groups[baseName].push(image);
    });
    
    return groups;
  };

  // 그룹화된 이미지에서 대표 이미지 선택 (원본 우선)
  const getRepresentativeImage = (imageGroup) => {
    if (!imageGroup || !Array.isArray(imageGroup) || imageGroup.length === 0) {
      return null;
    }
    
    // 원본 이미지 우선
    const original = imageGroup.find(img => 
      img && img.name && 
      !img.name.includes('_thumb') && 
      !img.name.includes('_medium') && 
      !img.name.endsWith('.webp')
    );
    if (original) return original;
    
    // 미디움 버전
    const medium = imageGroup.find(img => img && img.name && img.name.includes('_medium'));
    if (medium) return medium;
    
    // 첫 번째 이미지
    return imageGroup[0] || null;
  };

  // 이미지 버전 정보 가져오기 함수
  const getImageVersionInfo = (imageName) => {
    if (!imageName) return '🖼️ 이미지 정보 없음';
    
    if (imageName.includes('_thumb.webp')) {
      return '🖼️ WebP 썸네일 (300x300)';
    } else if (imageName.includes('_thumb.')) {
      return '🖼️ 썸네일 (300x300)';
    } else if (imageName.includes('_medium.')) {
      return '🖼️ 미디움 (800x600)';
    } else if (imageName.endsWith('.webp')) {
      return '🖼️ WebP 버전';
      } else {
      return '🖼️ 원본 이미지';
    }
  };

  // AI 콘텐츠 개선 함수들
  const improveAIContent = async (type) => {
    if (!simpleAIRequest.trim()) {
      alert('개선 요청사항을 입력해주세요.');
      return;
    }

    setIsImprovingContent(true);
    setImprovementProcess('AI가 콘텐츠를 분석하고 개선 중입니다...');
    
    try {
      const response = await fetch('/api/improve-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: formData.content,
          request: simpleAIRequest,
          type: type
        })
      });

      if (response.ok) {
      const data = await response.json();
        setImprovedContent(data.improvedContent);
        setShowImprovedContent(true);
        setImprovementProcess('콘텐츠 개선이 완료되었습니다!');
      } else {
        throw new Error('콘텐츠 개선에 실패했습니다.');
      }
    } catch (error) {
      console.error('콘텐츠 개선 오류:', error);
      alert('콘텐츠 개선 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsImprovingContent(false);
    }
  };

  const applySimpleAIImprovement = async () => {
    if (!simpleAIRequest.trim()) {
      alert('개선 요청사항을 입력해주세요.');
      return;
    }

    setIsImprovingContent(true);
    setImprovementProcess('간단 AI 개선을 적용 중입니다...');

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
        setImprovedContent(data.improvedContent);
        setShowImprovedContent(true);
        setImprovementProcess('간단 AI 개선이 완료되었습니다!');
      } else {
        throw new Error('간단 AI 개선에 실패했습니다.');
      }
    } catch (error) {
      console.error('간단 AI 개선 오류:', error);
      alert('간단 AI 개선 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsImprovingContent(false);
    }
  };

  const applyImprovedContent = () => {
    setFormData({ ...formData, content: improvedContent });
    setShowImprovedContent(false);
    setImprovedContent('');
    setSimpleAIRequest('');
    alert('개선된 콘텐츠가 적용되었습니다!');
  };

  // 갤러리 이미지 목록 상태
  const [galleryImages, setGalleryImages] = useState([]);
  const [showGallerySelection, setShowGallerySelection] = useState(false);
  
  // 기존 이미지 변형 모달 탭 상태
  const [activeImageTab, setActiveImageTab] = useState<'upload' | 'gallery' | 'url'>('upload');

  // 갤러리 이미지 목록 가져오기
  const fetchGalleryImages = async () => {
    try {
      const response = await fetch('/api/admin/all-images');
      if (response.ok) {
        const data = await response.json();
        setGalleryImages(data.images || []);
        setShowGallerySelection(true);
      } else {
        alert('갤러리 이미지를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('갤러리 이미지 로드 오류:', error);
      alert('갤러리 이미지를 불러오는데 오류가 발생했습니다.');
    }
  };

  // 기존 이미지 변형 관련 함수들
  const handleLoadExistingImageAndPromptWithPrompt = async (improvedPrompt) => {
    if (!selectedExistingImage) {
      alert('변형할 이미지를 선택해주세요.');
      return;
    }

    setIsGeneratingExistingVariation(true);
    setImageGenerationStep('FAL AI로 이미지 변형 중...');
    setImageGenerationModel('FAL AI (기존 이미지 변형)');
      setShowGenerationProcess(true);

    try {
      // 변형 생성
      const response = await fetch('/api/vary-existing-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: selectedExistingImage,
          prompt: improvedPrompt,
          title: editingPost?.title || '이미지 변형',
          excerpt: editingPost?.excerpt || '이미지 변형을 위한 프롬프트',
          contentType: editingPost?.content_type || 'blog',
          brandStrategy: editingPost?.brand_strategy || 'professional',
          preset: aiPreset
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.imageUrl) {
          // 변형된 이미지를 갤러리에 추가
          setGeneratedImages(prev => [result.imageUrl, ...prev]);
          setShowGeneratedImages(true);
          
          setImageGenerationStep('완료!');
          alert('기존 이미지 변형이 완료되었습니다!');
        } else {
          throw new Error('변형된 이미지가 생성되지 않았습니다.');
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || '이미지 변형에 실패했습니다.');
      }
    } catch (error) {
      console.error('기존 이미지 변형 오류:', error);
      alert('기존 이미지 변형 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsGeneratingExistingVariation(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // 파일 업로드 처리 함수 (HEIC 변환 및 Supabase 업로드)
  const handleFileUpload = async (file) => {
    try {
      let processedFile = file;
      
      // HEIC 파일인 경우 JPG로 변환
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        console.log('🔄 HEIC 파일 변환 중...');
        
        // 동적 import로 heic2any 로드
        const heic2any = (await import('heic2any')).default;
        
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8
        });
        processedFile = new File([convertedBlob[0]], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
          type: 'image/jpeg'
        });
        console.log('✅ HEIC → JPG 변환 완료');
      }

      // Supabase에 업로드
      console.log('🔄 Supabase 업로드 중...');
      const formData = new FormData();
      formData.append('file', processedFile);
      
      const uploadResponse = await fetch('/api/upload-image-supabase', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error(`업로드 실패: ${uploadResponse.status}`);
      }
      
      const uploadData = await uploadResponse.json();
      const supabaseUrl = uploadData.url;
      
      console.log('✅ Supabase 업로드 완료:', supabaseUrl);
      
      // 선택된 이미지로 설정
      setSelectedExistingImage(supabaseUrl);
      
    } catch (error) {
      console.error('❌ 파일 업로드 오류:', error);
      alert('파일 업로드 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const handleLoadExistingImageAndPrompt = async () => {
    if (!selectedExistingImage) {
      alert('불러올 이미지를 선택해주세요.');
      return;
    }

    setIsGeneratingExistingVariation(true);
    setImageGenerationStep('이미지와 프롬프트 불러오는 중...');
    setImageGenerationModel('이미지 불러오기');
      setShowGenerationProcess(true);

    try {
      // 기존 이미지의 프롬프트가 있는지 확인
      let prompt = '';
      try {
        const promptResponse = await fetch('/api/get-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: selectedExistingImage })
        });
        
        if (promptResponse.ok) {
          const promptData = await promptResponse.json();
          prompt = promptData.prompt || '';
        }
      } catch (error) {
        console.warn('기존 프롬프트 조회 실패, AI로 생성:', error);
      }

      // 프롬프트가 없으면 AI로 생성
      if (!prompt) {
        setImageGenerationStep('이미지 분석 및 프롬프트 생성 중...');
        const analysisResponse = await fetch('/api/analyze-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            imageUrl: selectedExistingImage,
            title: editingPost?.title || '이미지 변형',
            excerpt: editingPost?.excerpt || '이미지 변형을 위한 프롬프트'
        })
      });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          prompt = analysisData.prompt || '';
        }
      }

      // 프롬프트 미리보기에 표시 (한글 개선 가능)
      setImageGenerationPrompt(prompt);
      
      // 선택된 이미지를 "생성된 이미지" 섹션에 추가
      setGeneratedImages(prev => [selectedExistingImage, ...prev]);
      setShowGeneratedImages(true);
      
      // 모달 닫고 상태 초기화
      setShowExistingImageModal(false);
      setSelectedExistingImage('');
      setActiveImageTab('upload');
      setImageGenerationStep('');
      setIsGeneratingExistingVariation(false);
      setShowGenerationProcess(false);
      
      alert('✅ 이미지와 프롬프트가 불러와졌습니다!\n\n📸 "생성된 이미지" 섹션에서 이미지 확인\n✏️ "프롬프트 미리보기"에서 프롬프트 수정 가능\n🎨 AI 이미지 생성 버튼으로 변형 시작');
      return;
    } catch (error) {
      console.error('이미지 불러오기 오류:', error);
      alert('이미지 불러오기 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsGeneratingExistingVariation(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };

  // 이미지 변형 관련 함수들
  const generateImageVariation = async (model) => {
    if (!selectedBaseImage) {
      alert('변형할 기본 이미지를 선택해주세요.');
      return;
    }

    setIsGeneratingVariation(true);
    setImageGenerationStep(`${model}로 이미지 변형 중...`);
    setImageGenerationModel(model);
      setShowGenerationProcess(true);

    try {
      let apiEndpoint = '';
      let requestBody = {
        title: editingPost?.title || '이미지 변형',
        excerpt: editingPost?.excerpt || '이미지 변형을 위한 프롬프트',
        contentType: editingPost?.content_type || 'blog',
        brandStrategy: editingPost?.brand_strategy || 'professional',
        baseImageUrl: selectedBaseImage,
        variationStrength: variationStrength,
        variationCount: 1
      };

      switch (model) {
        case 'FAL AI':
          apiEndpoint = '/api/generate-blog-image-fal-variation';
          break;
        case 'Replicate Flux':
          apiEndpoint = '/api/generate-blog-image-replicate-flux';
          break;
        case 'Stability AI':
          apiEndpoint = '/api/generate-blog-image-stability';
          break;
        default:
          throw new Error('지원하지 않는 모델입니다.');
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.images && result.images.length > 0) {
          // 변형된 이미지들을 Supabase에 저장
          const savedImages = [];
          for (let i = 0; i < result.images.length; i++) {
            try {
              const saveResponse = await fetch('/api/save-generated-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: result.images[i].originalUrl || result.images[i],
                  fileName: `${model.toLowerCase().replace(' ', '-')}-variation-${Date.now()}-${i + 1}.png`,
                  blogPostId: editingPost?.id || null
                })
              });
              
              if (saveResponse.ok) {
                const { storedUrl } = await saveResponse.json();
                savedImages.push(storedUrl);
              } else {
                savedImages.push(result.images[i].originalUrl || result.images[i]);
              }
            } catch (error) {
              console.warn(`이미지 ${i + 1} 저장 실패:`, error);
              savedImages.push(result.images[i].originalUrl || result.images[i]);
            }
          }
          
          setGeneratedImages(savedImages);
          setShowGeneratedImages(true);
          
          // 프롬프트 저장
          if (result.prompt) {
          const newPrompt = {
              id: Date.now().toString(),
              prompt: result.prompt,
              koreanPrompt: result.koreanPrompt || '한글 프롬프트가 없습니다.',
              model: model,
            createdAt: new Date().toISOString(),
              originalImage: selectedBaseImage,
              baseImage: selectedBaseImage,
              imageUrls: savedImages
          };
          setSavedPrompts(prev => [newPrompt, ...prev]);
          }
          
          alert(`${model} 변형이 완료되었습니다! ${savedImages.length}개의 이미지가 생성되었습니다.`);
        } else {
          throw new Error('변형된 이미지가 생성되지 않았습니다.');
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || '이미지 변형에 실패했습니다.');
      }
    } catch (error) {
      console.error(`${model} 이미지 변형 오류:`, error);
      alert(`${model} 이미지 변형 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsGeneratingVariation(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };

  const selectBaseImage = (imageUrl) => {
    setSelectedBaseImage(imageUrl);
    alert('기본 이미지가 선택되었습니다!');
  };

  // 간단 AI 이미지 개선 함수들
  const applySimpleAIImageImprovement = async (model) => {
    if (!selectedImageForImprovement) {
      alert('개선할 이미지를 선택해주세요.');
      return;
    }

    if (!simpleAIImageRequest.trim()) {
      alert('개선 요청사항을 입력해주세요.');
      return;
    }

    setIsImprovingImage(true);
    setImageGenerationStep(`${model}로 이미지 개선 중...`);
    setImageGenerationModel(model);
      setShowGenerationProcess(true);

    try {
      const response = await fetch('/api/simple-ai-image-improvement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: selectedImageForImprovement,
          request: simpleAIImageRequest,
          model: model
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.images && data.images.length > 0) {
          // 개선된 이미지들을 Supabase에 저장
        const savedImages = [];
          for (let i = 0; i < data.images.length; i++) {
          try {
            const saveResponse = await fetch('/api/save-generated-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  imageUrl: data.images[i],
                  fileName: `${model.toLowerCase().replace(' ', '-')}-improved-${Date.now()}-${i + 1}.png`,
                blogPostId: editingPost?.id || null
              })
            });
            
            if (saveResponse.ok) {
              const { storedUrl } = await saveResponse.json();
              savedImages.push(storedUrl);
            } else {
                savedImages.push(data.images[i]);
            }
          } catch (error) {
              console.warn(`이미지 ${i + 1} 저장 실패:`, error);
              savedImages.push(data.images[i]);
          }
        }
        
        setGeneratedImages(savedImages);
        setShowGeneratedImages(true);
        
          // 프롬프트 저장
          if (data.prompt || data.editPrompt) {
            const newPrompt = {
              id: Date.now().toString(),
              prompt: data.prompt || data.editPrompt || '프롬프트가 없습니다.',
              koreanPrompt: data.koreanPrompt || simpleAIImageRequest,
              model: model,
              createdAt: new Date().toISOString(),
              originalImage: selectedImageForImprovement,
              baseImage: selectedImageForImprovement,
              imageUrls: savedImages
            };
            setSavedPrompts(prev => [newPrompt, ...prev]);
          }
          
          alert(`${model} 이미지 개선이 완료되었습니다! ${savedImages.length}개의 이미지가 생성되었습니다.`);
        } else {
          throw new Error('개선된 이미지가 생성되지 않았습니다.');
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || '이미지 개선에 실패했습니다.');
      }
    } catch (error) {
      console.error(`${model} 이미지 개선 오류:`, error);
      alert(`${model} 이미지 개선 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsImprovingImage(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
      }, 2000);
    }
  };

  const selectImageForImprovement = (imageUrl) => {
    setSelectedImageForImprovement(imageUrl);
    alert('개선할 이미지가 선택되었습니다!');
  };

  // 네이버 블로그 마이그레이션 함수들
  const migrateNaverBlog = async () => {
    if (!naverBlogUrl.trim()) {
      alert('네이버 블로그 URL을 입력해주세요.');
      return;
    }

    // 네이버 블로그 URL 형식 검증
    if (!naverBlogUrl.includes('blog.naver.com')) {
      alert('올바른 네이버 블로그 URL을 입력해주세요. (예: https://blog.naver.com/username)');
      return;
    }

    setIsMigrating(true);
    setMigrationProgress('네이버 블로그를 분석하고 포스트를 가져오는 중...');
    setMigratedPosts([]);
      
    try {
      const response = await fetch('/api/migrate-naver-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          blogUrl: naverBlogUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
          setMigratedPosts(data.posts);
          setMigrationProgress(`✅ ${data.posts.length}개의 포스트를 성공적으로 가져왔습니다!`);
          alert(`${data.posts.length}개의 네이버 블로그 포스트를 가져왔습니다. 아래에서 확인하고 저장하세요.`);
        } else {
          setMigrationProgress('❌ 가져올 수 있는 포스트가 없습니다.');
          alert('가져올 수 있는 포스트가 없습니다. 블로그 URL을 확인해주세요.');
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || '네이버 블로그 마이그레이션에 실패했습니다.');
      }
    } catch (error) {
      console.error('네이버 블로그 마이그레이션 오류:', error);
      setMigrationProgress('❌ 마이그레이션 중 오류가 발생했습니다.');
      alert('네이버 블로그 마이그레이션 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const saveMigratedPost = async (post) => {
    try {
      const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: post.title,
          slug: post.slug,
          content: post.content,
          excerpt: post.excerpt,
          featured_image: post.featured_image,
          category: post.category || 'migrated',
          tags: post.tags || [],
          status: 'draft',
          meta_title: post.meta_title,
          meta_description: post.meta_description,
          published_at: null
        })
      });

      if (response.ok) {
        const savedPost = await response.json();
        alert(`"${post.title}" 포스트가 성공적으로 저장되었습니다!`);
        
        // 저장된 포스트를 목록에서 제거
        setMigratedPosts(prev => prev.filter(p => p.id !== post.id));
        
        // 포스트 목록 새로고침
        fetchPosts();
        } else {
        throw new Error('포스트 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('포스트 저장 오류:', error);
      alert('포스트 저장 중 오류가 발생했습니다: ' + error.message);
    }
  };

  const saveAllMigratedPosts = async () => {
    if (migratedPosts.length === 0) {
      alert('저장할 포스트가 없습니다.');
      return;
    }

    if (!confirm(`${migratedPosts.length}개의 포스트를 모두 저장하시겠습니까?`)) {
      return;
    }

    setIsMigrating(true);
    setMigrationProgress('모든 포스트를 저장하는 중...');

    try {
      let successCount = 0;
      let failCount = 0;

      for (const post of migratedPosts) {
        try {
          const response = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
              title: post.title,
              slug: post.slug,
              content: post.content,
              excerpt: post.excerpt,
              featured_image: post.featured_image,
              category: post.category || 'migrated',
              tags: post.tags || [],
              status: 'draft',
              meta_title: post.meta_title,
              meta_description: post.meta_description,
              published_at: null
        })
      });

      if (response.ok) {
            successCount++;
        } else {
            failCount++;
      }
    } catch (error) {
          console.error(`포스트 "${post.title}" 저장 오류:`, error);
          failCount++;
        }
      }

      setMigrationProgress(`✅ ${successCount}개 성공, ${failCount}개 실패`);
      setMigratedPosts([]);
      
      if (successCount > 0) {
        alert(`${successCount}개의 포스트가 성공적으로 저장되었습니다!`);
        fetchPosts(); // 포스트 목록 새로고침
      }
      
      if (failCount > 0) {
        alert(`${failCount}개의 포스트 저장에 실패했습니다.`);
      }
    } catch (error) {
      console.error('일괄 저장 오류:', error);
      alert('일괄 저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  // 고급 기능 함수들

  const optimizeSEO = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 먼저 입력해주세요.');
      return;
    }

    setIsOptimizingSEO(true);
    setSeoOptimizationResult('SEO를 최적화하는 중...');
      
    try {
      const response = await fetch('/api/optimize-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          content: formData.content,
          category: formData.category,
          excerpt: formData.excerpt
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSeoOptimizationResult(data.optimization || 'SEO 최적화 결과가 없습니다.');
        
        // SEO 최적화 결과를 폼에 적용
        if (data.suggestions) {
          setFormData(prev => ({
            ...prev,
            meta_title: data.suggestions.meta_title || prev.meta_title,
            meta_description: data.suggestions.meta_description || prev.meta_description,
            slug: data.suggestions.slug || prev.slug
          }));
        }
        
        alert('SEO 최적화가 완료되었습니다!');
        } else {
        throw new Error('SEO 최적화에 실패했습니다.');
      }
    } catch (error) {
      console.error('SEO 최적화 오류:', error);
      setSeoOptimizationResult('SEO 최적화 중 오류가 발생했습니다: ' + error.message);
      alert('SEO 최적화 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsOptimizingSEO(false);
    }
  };


  // 필터링된 게시물 목록
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchTerm || 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || post.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 카테고리 목록
  const categories = Array.from(new Set(posts.map(post => post.category))).filter(Boolean);

  // 초기 로드
  useEffect(() => {
    fetchPosts();
  }, []);

  // 페이지 전체 드래그앤드롭 방지
  useEffect(() => {
    const preventDragDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // 페이지 전체에 드래그앤드롭 이벤트 방지
    document.addEventListener('dragover', preventDragDrop);
    document.addEventListener('dragenter', preventDragDrop);
    document.addEventListener('drop', preventDragDrop);

    return () => {
      document.removeEventListener('dragover', preventDragDrop);
      document.removeEventListener('dragenter', preventDragDrop);
      document.removeEventListener('drop', preventDragDrop);
    };
  }, []);

  // TipTap 에디터에서 대표 이미지 설정 이벤트 리스너
  useEffect(() => {
    const handleSetFeaturedImage = (event: CustomEvent) => {
      const { url } = event.detail;
      if (url) {
        const httpsUrl = forceHttps(url);
        if (isFeaturedImage(httpsUrl)) {
          setFormData({ ...formData, featured_image: '' });
          alert('대표 이미지가 해제되었습니다!');
        } else {
          setFormData({ ...formData, featured_image: httpsUrl });
          alert('대표 이미지로 설정되었습니다!');
        }
      }
    };

    window.addEventListener('tiptap:set-featured-image', handleSetFeaturedImage as EventListener);
    return () => {
      window.removeEventListener('tiptap:set-featured-image', handleSetFeaturedImage as EventListener);
    };
  }, [formData]);

  // 확대 모달 포커스 관리
  useEffect(() => {
    if (showGeneratedImageModal) {
      // 모달이 열릴 때 포커스 설정
      const modalElement = document.querySelector('[data-modal="image-viewer"]');
      if (modalElement) {
        (modalElement as HTMLElement).focus();
      }
    }
  }, [showGeneratedImageModal]);

  // 정렬 옵션 변경 시 새로고침
  useEffect(() => {
    if (posts.length > 0) {
      fetchPosts(sortBy, sortOrder);
    }
  }, [sortBy, sortOrder]);

  return (
    <>
      <AdminNav />
      <Head>
        <title>블로그 관리자 - MAS Golf</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">블로그 관리</h1>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-8">
            <nav className="flex space-x-8">
            <button
                onClick={() => {
                  setActiveTab('list');
                  setShowForm(false);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 블로그 목록
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
                ✍️ 새 게시물 작성
              </button>
              {/* AI 관리는 상단 AdminNav의 단일 진입점으로 통합되어 이 영역에서는 제거 */}
            </nav>
          </div>

          {/* 탭별 콘텐츠 */}
          {activeTab === 'list' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* 검색 및 필터 */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                    <input
                    type="text"
                    placeholder="게시물 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                <div className="sm:w-48">
                      <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">모든 카테고리</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                      </select>
                    </div>
                    </div>

              {/* 정렬 및 뷰 모드 */}
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                      <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="published_at">발행일</option>
                    <option value="title">제목</option>
                    <option value="category">카테고리</option>
                    <option value="view_count">조회수</option>
                      </select>
                      <select 
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="desc">내림차순</option>
                    <option value="asc">오름차순</option>
                      </select>
                </div>

                    <div className="flex gap-2">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      viewMode === 'list'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                    📋 목록
                  </button>
                        <button
                    onClick={() => setViewMode('card')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      viewMode === 'card'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🎴 카드
                        </button>
                      </div>
                    </div>
                    
              {/* 일괄 작업 */}
              {selectedPosts.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">
                      {selectedPosts.length}개 게시물 선택됨
                                      </span>
                          <button 
                      onClick={handleSelectedDelete}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
                          >
                      🗑️ 선택된 게시물 삭제
                          </button>
                      </div>
                    </div>
              )}

              {/* 게시물 목록 */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <p className="mt-2 text-gray-500">게시물을 불러오는 중...</p>
              </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">게시물이 없습니다.</p>
                </div>
                    ) : (
                      <>
                  {viewMode === 'list' ? (
                    <PostList
                      posts={filteredPosts}
                      selectedPosts={selectedPosts}
                      onPostSelect={handlePostSelect}
                      onSelectAll={handleSelectAll}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ) : (
                    <PostGrid
                      posts={filteredPosts}
                      selectedPosts={selectedPosts}
                      onPostSelect={handlePostSelect}
                      onSelectAll={handleSelectAll}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* 새 게시물 작성/수정 폼 */}
          {activeTab === 'create' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                {editingPost ? '게시물 수정' : '새 게시물 작성'}
              </h2>
                <p className="text-gray-600 mt-1">
                  {editingPost ? '게시물을 수정하세요.' : '새로운 게시물을 작성하세요.'}
                  </p>
                </div>
                    
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 제목 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목 *</label>
                  <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.title}
                      onChange={(e) => setFormData({
                        ...formData,
                        title: e.target.value,
                        slug: generateSlug(e.target.value)
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

                {/* 슬러그 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">슬러그</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="url-friendly-slug"
                    />
                          <button
                            type="button"
                      onClick={generateAISlug}
                      className="px-3 py-2 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                      title="AI로 SEO 최적화된 슬러그 생성"
                          >
                      🤖 AI
                          </button>
                        </div>
                    </div>


                {/* 요약 */}
                      <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    요약
            </label>
                    <textarea 
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="게시물 요약을 입력하세요"
            />
                      </div>
                      
                {/* 대표 프리뷰를 요약과 내용 사이로 이동 */}
                {/* 대표 이미지 프리뷰 (요약 아래) */}
                <div className="mb-6">
                  <div className="bg-white border rounded-lg p-4 flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex items-center justify-center border">
                      {formData.featured_image ? (
                        <img src={formData.featured_image} alt="대표 이미지" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-xs text-gray-400">대표 이미지 없음</span>
                      )}
                        </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-700 font-medium">대표 이미지</div>
                      <div className="text-xs text-gray-500 break-all">{formData.featured_image || '미설정'}</div>
                      </div>
                    <div className="flex items-center gap-2">
                      <button type="button" className="px-3 py-2 bg-blue-500 text-white rounded" onClick={()=>setShowUnifiedPicker(true)}>변경</button>
                      {formData.featured_image && (
                        <button type="button" className="px-3 py-2 bg-gray-200 rounded" onClick={()=>setFormData({...formData, featured_image: ''})}>해제</button>
                      )}
                    </div>
                    </div>
                    </div>
                    
                {/* 내용 - TipTap 에디터로 교체 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용 *</label>
                  {/* @ts-ignore */}
                  <TipTapEditor
                    valueMarkdown={formData.content}
                    onChangeMarkdown={(md) => setFormData({ ...formData, content: md })}
                    onRequestImageFromGallery={(insert) => openGalleryPicker(insert)}
                  />
                </div>

                {/* 마쓰구 브랜드 전략 섹션 */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">🎯 마쓰구 브랜드 전략</h3>
                    <span className="text-sm text-gray-500">페르소나와 오디언스 온도에 맞춘 맞춤형 콘텐츠 생성</span>
                </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 콘텐츠 유형 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">콘텐츠 유형</label>
                      <select 
                        value={brandContentType}
                        onChange={(e) => setBrandContentType(e.target.value as typeof brandContentType)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="골프 정보">골프 정보</option>
                        <option value="튜토리얼">튜토리얼</option>
                        <option value="고객 후기">고객 후기</option>
                        <option value="고객 스토리">고객 스토리</option>
                        <option value="이벤트">이벤트</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">브랜드 강도: {getBrandWeight(brandContentType)}</p>
                    </div>

                    {/* 고객 페르소나 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">고객 페르소나</label>
                      <select 
                        value={brandPersona}
                        onChange={(e) => {
                          const newPersona = e.target.value as typeof brandPersona;
                          setBrandPersona(newPersona);
                          // 페르소나 변경 시 추천 오디언스 온도 자동 설정
                          setAudienceTemperature(getRecommendedAudience(newPersona));
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="high_rebound_enthusiast">고반발 드라이버 선호 상급 골퍼</option>
                        <option value="health_conscious_senior">건강을 고려한 비거리 증가 시니어 골퍼</option>
                        <option value="competitive_maintainer">경기력을 유지하고 싶은 중상급 골퍼</option>
                        <option value="returning_60plus">최근 골프를 다시 시작한 60대 이상 골퍼</option>
                        <option value="distance_seeking_beginner">골프 입문자를 위한 비거리 향상 초급 골퍼</option>
                      </select>
                    </div>

                    {/* 오디언스 온도 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">오디언스 온도</label>
                      <select 
                        value={audienceTemperature}
                        onChange={(e) => setAudienceTemperature(e.target.value as typeof audienceTemperature)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <optgroup label="기본 온도">
                          <option value="cold">Cold (관심 낮음)</option>
                          <option value="warm">Warm (관심 보통)</option>
                          <option value="hot">Hot (관심 높음)</option>
                        </optgroup>
                        <optgroup label="문의 단계">
                          <option value="pre_customer_inquiry_phone">전화 문의</option>
                          <option value="pre_customer_inquiry_kakao">카카오 문의</option>
                          <option value="pre_customer_inquiry_website">홈페이지 문의</option>
                          <option value="pre_customer_test_booking">시타 예약</option>
                        </optgroup>
                        <optgroup label="구매 고객">
                          <option value="customer_purchase_lt_1y">구매 1년 이내</option>
                          <option value="customer_purchase_1_2y">구매 1-2년</option>
                          <option value="customer_purchase_2_5y">구매 2-5년</option>
                          <option value="customer_purchase_gte_5y">구매 5년 이상</option>
                        </optgroup>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">온도 가중치: {getAudienceWeight(audienceTemperature)}</p>
                    </div>

                    {/* 브랜드 강도 표시 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">브랜드 강도</label>
                      <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {getBrandWeight(brandContentType) === 'low' ? '낮음 (순수 정보)' :
                             getBrandWeight(brandContentType) === 'medium' ? '보통 (브랜드 언급)' :
                             '높음 (강력한 브랜딩)'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getBrandWeight(brandContentType) === 'low' ? '0' :
                             getBrandWeight(brandContentType) === 'medium' ? '1' : '2'}
                          </span>
                    </div>
                    </div>
                    </div>
                    </div>
                  </div>
                  
                {/* AI 이미지 생성 섹션 */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">🎨 AI 이미지 생성</h3>
                    <span className="text-sm text-gray-500">제목과 내용을 바탕으로 AI가 이미지를 생성합니다</span>
                  </div>

                  {/* 프롬프트 미리보기 */}
                  <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="mb-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">프롬프트 미리보기</span>
                      <button 
                        type="button"
                          onClick={async () => {
                            try {
                              // 기본 프롬프트 재생성: 제목/요약/콘텐츠유형/브랜드전략 기반
                              setImageGenerationStep('프롬프트 초기화 중...');
                              const res = await fetch('/api/preview-image-prompt', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  title: formData.title,
                                  excerpt: formData.excerpt || formData.content?.slice(0, 200) || '',
                                  contentType: brandContentType,
                                  brandStrategy: {
                                    brandPersona,
                                    brandContentType,
                                    brandWeight: getBrandWeight(brandContentType),
                                    audienceTemperature,
                                    audienceWeight: getAudienceWeight(audienceTemperature)
                                  }
                                })
                              });
                              if (res.ok) {
                                const data = await res.json();
                                setImageGenerationPrompt(data.prompt || '');
                                setEditedPrompt('');
                                setGeneratedImages([]);
                                setSelectedGeneratedImage('');
                                alert('프롬프트가 초기화되었습니다. 새로 이미지를 생성해보세요.');
                              } else {
                                alert('프롬프트 초기화에 실패했습니다.');
                              }
                            } catch (e) {
                              console.error(e);
                              alert('프롬프트 초기화 중 오류가 발생했습니다.');
                            } finally {
                              setImageGenerationStep('');
                            }
                          }}
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          ↺ 프롬프트 리셋
                      </button>
                    </div>
                    </div>
                    <div className="text-xs text-gray-600 break-words whitespace-pre-wrap">
                      {imageGenerationPrompt || '아직 생성된 프롬프트가 없습니다. 먼저 한 번 생성하세요.'}
                  </div>

                    {/* 한글 수정사항 입력 */}
                    {imageGenerationPrompt && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          한글 수정사항 (예: 배경을 여름 낮으로 변경, 더 밝게 만들어주세요)
                        </label>
                        <textarea
                          className="w-full h-16 text-xs px-2 py-1 border border-gray-300 rounded"
                          value={editedPrompt}
                          onChange={(e) => setEditedPrompt(e.target.value)}
                          placeholder="한글로 수정사항을 입력하세요. 예: 배경을 여름 낮으로 변경, 더 밝게 만들어주세요"
                        />
                        {editedPrompt && (
                          <div className="mt-2 flex gap-2">
                      <button 
                        type="button"
                              onClick={async () => {
                                if (isImprovingPrompt) return;
                                setIsImprovingPrompt(true);
                                try {
                                  const response = await fetch('/api/improve-prompt', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      originalPrompt: imageGenerationPrompt,
                                      userImprovements: editedPrompt,
                                      brandStrategy: {
                                        brandPersona,
                                        brandContentType,
                                        brandWeight: getBrandWeight(brandContentType),
                                        audienceTemperature,
                                        audienceWeight: getAudienceWeight(audienceTemperature)
                                      }
                                    })
                                  });
                                  
                                  if (response.ok) {
                                    const result = await response.json();
                                    setImageGenerationPrompt(result.improvedPrompt);
                                    setEditedPrompt('');
                                    
                                    // 기존 이미지 변형 모드인지 확인
                                    if (selectedExistingImage && showExistingImageModal === false) {
                                      // 기존 이미지 변형 모드: 개선된 프롬프트로 변형 실행
                                      alert('프롬프트가 개선되었습니다! 기존 이미지 변형을 시작합니다.');
                                      handleLoadExistingImageAndPromptWithPrompt(result.improvedPrompt);
                                    } else {
                                      // 일반 모드: 재생성 안내
                                      alert('프롬프트가 개선되었습니다! 원하는 모델로 재생성하세요.');
                                    }
                                  } else {
                                    alert('프롬프트 개선에 실패했습니다.');
                                  }
                                } catch (error) {
                                  console.error('프롬프트 개선 오류:', error);
                                  alert('프롬프트 개선 중 오류가 발생했습니다.');
                                } finally { setIsImprovingPrompt(false); }
                              }}
                              disabled={isImprovingPrompt}
                              className={`px-3 py-1 text-xs rounded text-white ${isImprovingPrompt ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
                            >
                              {isImprovingPrompt ? '개선 중...' : '🔄 프롬프트 개선'}
                      </button>
                      <button 
                        type="button"
                              onClick={() => setEditedPrompt('')}
                              className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              취소
                      </button>
                    </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AI 생성 모드 선택 */}
                  <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-purple-800 mb-3">
                      이미지 생성 모드
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(AI_PRESETS).map(([key, preset]) => (
                        <label key={key} className="flex items-start gap-3 cursor-pointer hover:bg-purple-100 p-2 rounded">
                          <input
                            type="radio"
                            name="aiPreset"
                            value={key}
                            checked={aiPreset === key}
                            onChange={(e) => setAiPreset(e.target.value as 'creative' | 'balanced' | 'precise' | 'ultra_precise')}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-gray-800">{preset.name}</div>
                            <div className="text-xs text-gray-600">{preset.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 이미지 생성 개수 선택 */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      생성할 이미지 개수
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setImageGenerationCount(count as 1 | 2 | 3 | 4)}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            imageGenerationCount === count
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {count}개
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI 이미지 생성 버튼 */}
                  <div className="mb-6">
                    <button 
                      type="button"
                      onClick={() => generateFALAIImage(imageGenerationCount)}
                      disabled={isGeneratingImages}
                      className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGeneratingImages && imageGenerationModel === 'ChatGPT + FAL AI' ? (
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <span>🎨</span>
                      )}
                      ChatGPT + FAL AI
                    </button>
                  </div>

                  {/* 단락별 프롬프트 미리보기 */}
                  {showParagraphPromptPreview && paragraphPrompts.length > 0 && (
                    <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-700">
                          단락별 프롬프트 미리보기 ({paragraphPrompts.length}개)
                        </h4>
                    <button 
                      type="button"
                          onClick={() => setShowParagraphPromptPreview(false)}
                          className="text-gray-500 hover:text-gray-700"
                    >
                          ✕
                    </button>
                  </div>
                      <div className="space-y-4">
                        {paragraphPrompts.map((item, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600">단락 {index + 1}</span>
                              <span className="text-xs text-gray-500">{item.paragraph}</span>
                        </div>
                            <textarea
                              className="w-full h-20 text-xs px-2 py-1 border border-gray-300 rounded"
                              value={item.prompt}
                              onChange={(e) => {
                                const newPrompts = [...paragraphPrompts];
                                newPrompts[index].prompt = e.target.value;
                                setParagraphPrompts(newPrompts);
                              }}
                              placeholder="프롬프트를 수정하세요..."
                                  />
                                </div>
                        ))}
                        <div className="flex gap-2">
                                    <button
                            type="button"
                            onClick={() => {
                              setShowParagraphPromptPreview(false);
                              // 수정된 프롬프트로 이미지 생성
                              handleGenerateParagraphImagesWithCustomPrompts();
                            }}
                            className="px-3 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                          >
                            📷 수정된 프롬프트로 이미지 생성
                                    </button>
                                    <button
                            type="button"
                            onClick={() => setShowParagraphPromptPreview(false)}
                            className="px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                          >
                            취소
                                    </button>
                                  </div>
                          </div>
                    </div>
                  )}

                  {/* 단락별 이미지 일괄 생성 버튼들 */}
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                        type="button"
                        onClick={generateParagraphPrompts}
                        disabled={isGeneratingParagraphImages}
                        className={`px-4 py-3 rounded-lg text-sm font-medium ${
                          isGeneratingParagraphImages 
                            ? 'bg-gray-300 text-white cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        title="본문의 단락별 프롬프트를 미리 생성하여 확인하고 수정할 수 있습니다"
                      >
                        {isGeneratingParagraphImages ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            분석 중...
                                      </span>
                        ) : (
                          '🔍 단락별 프롬프트 미리보기'
                        )}
                            </button>
                      
                                    <button 
                        type="button"
                        onClick={handleGenerateParagraphImages}
                        disabled={isGeneratingParagraphImages}
                        className={`px-4 py-3 rounded-lg text-sm font-medium ${
                          isGeneratingParagraphImages 
                            ? 'bg-emerald-300 text-white cursor-not-allowed' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                        title="본문의 주요 단락에 어울리는 이미지를 일괄 생성하여 에디터에 순차 삽입"
                      >
                        {isGeneratingParagraphImages ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            생성 중...
                          </span>
                        ) : (
                          '📷 단락별 이미지 일괄 생성'
                        )}
                                    </button>
                      
                                        <button
                        type="button"
                        onClick={() => setShowExistingImageModal(true)}
                        disabled={isGeneratingExistingVariation}
                        className={`px-4 py-3 rounded-lg text-sm font-medium ${
                          isGeneratingExistingVariation 
                            ? 'bg-gray-300 text-white cursor-not-allowed' 
                            : 'bg-purple-600 text-white hover:bg-purple-700'
                        }`}
                        title="기존 이미지(갤러리/파일/URL)를 선택하여 비슷한 변형 이미지를 생성합니다"
                      >
                        {isGeneratingExistingVariation ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            변형 중...
                          </span>
                        ) : (
                          '🔄 기존 이미지 변형'
                        )}
                      </button>
                                </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      먼저 프롬프트를 미리보기하고 수정한 후 이미지를 생성하거나, 바로 이미지를 생성할 수 있습니다<br/>
                      <span className="text-blue-600 font-medium">생성할 이미지 개수: {imageGenerationCount}개</span> (단락 수와 연동)<br/>
                      <span className="text-purple-600 font-medium">기존 이미지 변형:</span> 갤러리/파일/URL에서 이미지를 선택하여 비슷한 변형 생성
                                  </p>
                                </div>

                  {/* 이미지 생성 과정 표시 */}
                  {showGenerationProcess && imageGenerationStep && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        🤖 {imageGenerationModel} 이미지 생성 과정
                    </h4>
                      <div className="text-sm text-blue-700">
                        {imageGenerationStep}
                          </div>
                        </div>
                      )}
                      
                  {/* 생성된 이미지 갤러리 */}
                  {showGeneratedImages && generatedImages.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">생성된 이미지</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {generatedImages.map((imageUrl, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={forceHttps(imageUrl)}
                              alt={`생성된 이미지 ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:border-blue-500 transition-colors"
                                  onClick={() => {
                                    setSelectedGeneratedImage(imageUrl);
                                    setShowGeneratedImageModal(true);
                                  }}
                                    onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-image.jpg';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-wrap gap-1 justify-center p-2">
                                  <button
                                      type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                        if (confirm('이 이미지를 삭제하시겠습니까?')) {
                                          setGeneratedImages(prev => prev.filter((_, i) => i !== index));
                                        }
                                    }}
                                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                      title="삭제"
                                  >
                                      🗑️
                                  </button>
                                  <button
                                      type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                        setSelectedGeneratedImage(imageUrl);
                                        setShowGeneratedImageModal(true);
                                    }}
                                      className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-800"
                                      title="확대"
                                  >
                                      🔍
                                  </button>
                      <button 
                        type="button"
                                      disabled={isGeneratingVariation}
                                      onClick={async (e) => {
                                      e.stopPropagation();
                                        if (isGeneratingVariation) return;
                                        setSelectedBaseImage(imageUrl);
                                        await generateImageVariation('Replicate Flux');
                                    }}
                                      className={`px-2 py-1 text-xs rounded ${isGeneratingVariation ? 'bg-purple-300 text-white cursor-not-allowed' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
                                      title="변형"
                                  >
                                      {isGeneratingVariation ? '…' : '🎨'}
                                  </button>
                                </div>
                            </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>

                {/* AI 콘텐츠 개선 섹션 */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">🤖 AI 콘텐츠 개선</h3>
                    <span className="text-sm text-gray-500">AI로 콘텐츠를 분석하고 개선할 수 있습니다</span>
                    </div>

                  <div className="space-y-4">
                    {/* 개선 요청 입력 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        개선 요청사항
                      </label>
                      <textarea 
                        value={simpleAIRequest}
                        onChange={(e) => setSimpleAIRequest(e.target.value)}
                        placeholder="예: 더 매력적인 제목으로 바꿔주세요, SEO를 고려한 내용으로 개선해주세요, 더 읽기 쉽게 만들어주세요..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    {/* AI 개선 버튼들 */}
                    <div className="flex flex-wrap gap-3">
                      <button 
                        type="button"
                        onClick={() => improveAIContent('comprehensive')}
                        disabled={isImprovingContent || !simpleAIRequest.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {isImprovingContent ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>AI 콘텐츠 개선 중...</span>
                          </>
                        ) : (
                          <>
                            <span>🤖</span>
                            <span>AI 콘텐츠 개선</span>
                          </>
                        )}
                      </button>

                      <button 
                        type="button"
                        onClick={applySimpleAIImprovement}
                        disabled={isImprovingContent || !simpleAIRequest.trim()}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {isImprovingContent ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>간단 AI 개선 중...</span>
                          </>
                        ) : (
                          <>
                            <span>⚡</span>
                            <span>간단 AI 개선</span>
                          </>
                        )}
                    </button>
                    </div>

                    {/* 개선 과정 표시 */}
                    {isImprovingContent && improvementProcess && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">
                          🤖 AI 콘텐츠 개선 과정
                    </h4>
                        <div className="text-sm text-blue-700">
                        {improvementProcess}
                            </div>
                            </div>
                  )}
                          </div>
                        </div>

                {/* 간단 AI 이미지 개선 섹션 - 제거됨 (생성된 이미지 변형 버튼으로 대체) */}
                {/* 이미지 변형 시스템 섹션 - 제거됨 (생성된 이미지 변형 버튼으로 대체) */}

                {/* 네이버 블로그 마이그레이션 섹션 */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">📦 네이버 블로그 마이그레이션</h3>
                      <span className="text-sm text-gray-500">기존 네이버 블로그 포스트를 이 시스템으로 가져올 수 있습니다</span>
                                  </div>
                                  <button
                        type="button"
                      onClick={() => setShowNaverMigration(!showNaverMigration)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                      >
                      {showNaverMigration ? '숨기기' : '마이그레이션 시작'}
                                  </button>
                                </div>
                        
                  {showNaverMigration && (
                    <div className="space-y-6">
                      {/* 네이버 블로그 URL 입력 */}
                          <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                          네이버 블로그 URL
                      </label>
                        <div className="flex space-x-3">
                      <input 
                            type="url"
                            value={naverBlogUrl}
                            onChange={(e) => setNaverBlogUrl(e.target.value)}
                            placeholder="https://blog.naver.com/username"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                                  <button
                        type="button"
                            onClick={migrateNaverBlog}
                            disabled={isMigrating || !naverBlogUrl.trim()}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {isMigrating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>마이그레이션 중...</span>
                              </>
                            ) : (
                              <>
                                <span>📦</span>
                                <span>가져오기</span>
                              </>
                            )}
                                  </button>
                                </div>
                        <p className="text-xs text-gray-500 mt-1">
                          예: https://blog.naver.com/username 또는 https://blog.naver.com/username/PostList.nhn
                                  </p>
                            </div>

                      {/* 마이그레이션 진행 상태 */}
                      {migrationProgress && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-sm text-blue-700">
                            {migrationProgress}
                          </div>
                      </div>
                                )}
                      
                      {/* 마이그레이션된 포스트 목록 */}
                      {migratedPosts.length > 0 && (
                          <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-md font-medium text-gray-900">
                              가져온 포스트 ({migratedPosts.length}개)
                            </h4>
                        <button 
                          type="button"
                              onClick={saveAllMigratedPosts}
                              disabled={isMigrating}
                              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                              {isMigrating ? '저장 중...' : '모두 저장'}
                        </button>
                    </div>

                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {migratedPosts.map((post) => (
                              <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 mb-2">{post.title}</h5>
                                    <div className="text-sm text-gray-600 mb-2">
                                      <p className="line-clamp-2">{post.excerpt || '요약이 없습니다.'}</p>
                  </div>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <span>카테고리: {post.category || 'migrated'}</span>
                                      <span>태그: {post.tags ? post.tags.join(', ') : '없음'}</span>
                                      {post.featured_image && (
                                        <span className="text-green-600">이미지 포함</span>
                        )}
                      </div>
                    </div>

                                  <div className="flex flex-col space-y-2 ml-4">
                      <button 
                        type="button"
                                      onClick={() => saveMigratedPost(post)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                                      💾 저장
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                                        if (confirm('이 포스트를 제거하시겠습니까?')) {
                                          setMigratedPosts(prev => prev.filter(p => p.id !== post.id));
                  }
                        }}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                      >
                                      🗑️ 제거
                      </button>
                    </div>
                  </div>
                      </div>
                    ))}
                      </div>
                    </div>
                  )}
                  
                      {/* 사용 안내 */}
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">📋 사용 안내</h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>• 네이버 블로그의 공개된 포스트만 가져올 수 있습니다</li>
                          <li>• 가져온 포스트는 초안 상태로 저장됩니다</li>
                          <li>• 이미지가 포함된 포스트는 이미지 URL이 함께 저장됩니다</li>
                          <li>• 개별 포스트를 선택하여 저장하거나 모두 저장할 수 있습니다</li>
                        </ul>
                      </div>
                    </div>
                  )}
        </div>

                {/* 고급 기능 섹션 */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">🚀 고급 기능</h3>
                      <span className="text-sm text-gray-500">SEO 최적화 등 고급 기능을 제공합니다</span>
                                  </div>
                                    <button 
                  type="button"
                      onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                      className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
              >
                      {showAdvancedFeatures ? '숨기기' : '고급 기능 열기'}
                                    </button>
                                  </div>
                  
                  {showAdvancedFeatures && (
                    <div className="space-y-8">
              
                      {/* SEO 최적화 기능 */}
                      <div className="border border-gray-200 rounded-lg p-6">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">📈 SEO 최적화</h4>
                        
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h5 className="text-sm font-medium text-blue-800 mb-2">📋 SEO 최적화 안내</h5>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li>• 제목과 내용을 기반으로 SEO 최적화 제안</li>
                              <li>• 메타 제목, 메타 설명, 슬러그 자동 생성</li>
                              <li>• 검색 엔진 최적화를 위한 키워드 제안</li>
                              <li>• 최적화된 내용을 자동으로 폼에 적용</li>
                            </ul>
                    </div>
                    
                                        <button
                        type="button"
                            onClick={optimizeSEO}
                            disabled={isOptimizingSEO || !formData.title || !formData.content}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {isOptimizingSEO ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>SEO 최적화 중...</span>
                          </>
                        ) : (
                          <>
                                <span>📈</span>
                                <span>SEO 최적화 시작</span>
                          </>
                        )}
                      </button>

                          {/* SEO 최적화 결과 */}
                          {seoOptimizationResult && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <h5 className="text-sm font-medium text-blue-800 mb-2">📈 SEO 최적화 결과</h5>
                              <div className="text-sm text-blue-700 whitespace-pre-wrap">
                                {seoOptimizationResult}
                                    </div>
                                  </div>
                                )}
                                        </div>
                                        </div>

                      {/* 고급 기능 안내 */}
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-800 mb-2">💡 고급 기능 안내</h4>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>• <strong>SEO 최적화:</strong> 검색 엔진 최적화를 위한 메타데이터와 키워드를 자동 생성합니다</li>
                          <li>• <strong>자동 적용:</strong> 최적화된 결과를 자동으로 폼에 적용하여 편리하게 사용할 수 있습니다</li>
                          <li>• <strong>실시간 피드백:</strong> 최적화 과정을 실시간으로 확인할 수 있습니다</li>
                        </ul>
                                    </div>
                                  </div>
                                )}
                              </div>

                {/* 기존 이미지 변형 모달 */}
                {showExistingImageModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">🔄 기존 이미지 변형</h3>
                        <button
                          type="button"
                          onClick={() => {
                            setShowExistingImageModal(false);
                            setSelectedExistingImage('');
                            setActiveImageTab('upload');
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                </div>

                      <div className="space-y-6">
                        {/* 이미지 선택 탭 */}
                        <div className="flex space-x-4 border-b border-gray-200">
                                <button
                            type="button"
                            onClick={() => setActiveImageTab('upload')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                              activeImageTab === 'upload'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                            }`}
                                >
                            📁 파일 업로드
                                </button>
                                <button
                            type="button"
                            onClick={() => {
                              setActiveImageTab('gallery');
                              fetchGalleryImages();
                            }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                              activeImageTab === 'gallery'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                            }`}
                                >
                            🖼️ 갤러리에서 선택
                                </button>
                      <button
                        type="button"
                            onClick={() => setActiveImageTab('url')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                              activeImageTab === 'url'
                                ? 'text-blue-600 border-blue-600'
                                : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
                            }`}
                      >
                            🔗 URL 입력
                      </button>
                    </div>
                        
                        {/* 파일 업로드 섹션 */}
                        {activeImageTab === 'upload' && (
          <div className="space-y-4">
                          <div 
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                                    e.stopPropagation();
                              const files = e.dataTransfer.files;
                              if (files.length > 0) {
                                await handleFileUpload(files[0]);
                              }
                            }}
                          >
              <div className="space-y-4">
                              <div className="text-gray-500">
                                <label htmlFor="file-upload" className="cursor-pointer">
                                  <svg className="mx-auto h-12 w-12 text-gray-400 hover:text-blue-500 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </label>
                                              </div>
                              <div>
                                <label htmlFor="file-upload" className="cursor-pointer">
                                  <span className="mt-2 block text-sm font-medium text-gray-900">
                                    이미지 파일을 선택하거나 드래그하세요
                      </span>
                                  <span className="mt-1 block text-sm text-gray-500">
                                    PNG, JPG, GIF, HEIC 파일 지원
                                  </span>
                                </label>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*,.heic,.heif"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      await handleFileUpload(file);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        )}
                        
                        {/* URL 입력 섹션 */}
                        {activeImageTab === 'url' && (
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            이미지 URL
                          </label>
                          <input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => {
                              const url = e.target.value;
                              if (url) {
                                // 로컬 파일 경로 차단
                                if (url.startsWith('file://')) {
                                  alert('로컬 파일 경로는 지원되지 않습니다. 웹 URL을 입력하거나 파일 업로드를 사용해주세요.');
                                  e.target.value = '';
                                  return;
                                }
                                setSelectedExistingImage(url);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (selectedExistingImage) {
                                  setShowExistingImageModal(false);
                                  handleLoadExistingImageAndPrompt();
                              } else {
                                  alert('먼저 이미지 URL을 입력해주세요.');
                                }
                              }
                            }}
                          />
              </div>
            )}
            
                        {/* 선택된 이미지 미리보기 */}
                        {selectedExistingImage && (
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-700">선택된 이미지</h4>
                            <div className="flex items-center space-x-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                              <img
                                src={selectedExistingImage}
                                alt="선택된 이미지"
                                className="w-24 h-24 object-cover rounded-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder-image.jpg';
                                }}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">이미지가 선택되었습니다</p>
                                <p className="text-xs text-gray-600 truncate">{selectedExistingImage}</p>
          </div>
                <button
                  type="button"
                                onClick={() => setSelectedExistingImage('')}
                                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                                선택 해제
              </button>
                      </div>
              </div>
            )}
            
                        {/* 액션 버튼들 */}
                        <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                              setShowExistingImageModal(false);
                              setSelectedExistingImage('');
                              setActiveImageTab('upload');
                            }}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            취소
              </button>
              <button
                type="button"
                onClick={() => {
                              if (selectedExistingImage) {
                                setShowExistingImageModal(false);
                                handleLoadExistingImageAndPrompt();
                              } else {
                                alert('불러올 이미지를 선택해주세요.');
                              }
                            }}
                            disabled={!selectedExistingImage || isGeneratingExistingVariation}
                            className={`px-4 py-2 text-sm font-medium rounded-lg ${
                              selectedExistingImage && !isGeneratingExistingVariation
                                ? 'bg-purple-600 text-white hover:bg-purple-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {isGeneratingExistingVariation ? '불러오는 중...' : '이미지 불러오기'}
              </button>
          </div>
            </div>
          </div>
                </div>
                )}

                {/* 갤러리 선택 모달 */}
                {showGallerySelection && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">🖼️ 갤러리에서 이미지 선택</h3>
                                  <button
                          type="button"
                          onClick={() => {
                            setShowGallerySelection(false);
                            setGalleryImages([]);
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                                  </button>
                                </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {galleryImages.map((image, index) => (
                          <div
                            key={index}
                            className="relative group cursor-pointer"
                            onClick={() => {
                              setSelectedExistingImage(image.url);
                              setShowGallerySelection(false);
                              setGalleryImages([]);
                            }}
                          >
                            <img
                              src={image.url}
                              alt={image.alt_text || `갤러리 이미지 ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-transparent group-hover:border-blue-500 transition-colors"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-image.jpg';
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                선택
                              </span>
                          </div>
                        </div>
                      ))}
                    </div>
                      
                      {galleryImages.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          갤러리에 이미지가 없습니다.
              </div>
                      )}
                      
                      <div className="flex justify-end mt-6">
                      <button
                        type="button"
                                onClick={() => {
                            setShowGallerySelection(false);
                            setGalleryImages([]);
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          취소
                        </button>
                              </div>
                              </div>
                              </div>
                )}

                {/* 이미지 갤러리 섹션 - 아코디언 */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">🖼️ 이미지 갤러리</h3>
                      <span className="text-sm text-gray-500">전체 이미지를 관리하고 선택할 수 있습니다</span>
                            </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href="/admin/gallery"
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 text-sm"
                      >
                        📚 갤러리 관리
                      </Link>
                <button
                  type="button"
                        onClick={toggleGallery}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                                  >
                        {isGalleryOpen ? '📁 갤러리 닫기' : '📂 갤러리 열기'}
                                </button>
                      {totalImagesCount > 0 && (
                        <span className="text-sm text-gray-600">
                          총 {totalImagesCount}개
                        </span>
                      )}
              </div>
                  </div>
                  
                  {/* 갤러리 내용 - 아코디언 */}
                  {isGalleryOpen && (
                    <div className="space-y-4">
                      {/* 갤러리 필터 및 검색 */}
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">필터:</span>
                      <button
                        type="button"
                              className={`px-3 py-1 rounded text-sm ${
                                galleryFilter === 'all' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-white text-gray-700 border'
                              }`}
                              onClick={() => setGalleryFilter('all')}
                            >
                              전체
                      </button>
                            <button
                              type="button"
                              className={`px-3 py-1 rounded text-sm ${
                                galleryFilter === 'featured' 
                                  ? 'bg-yellow-500 text-white' 
                                  : 'bg-white text-gray-700 border'
                              }`}
                              onClick={() => setGalleryFilter('featured')}
                            >
                              ⭐ 대표 이미지만
                            </button>
                      <button
                        type="button"
                              className={`px-3 py-1 rounded text-sm ${
                                galleryFilter === 'search' 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-white text-gray-700 border'
                              }`}
                              onClick={() => setGalleryFilter('search')}
                            >
                              🔍 검색
                      </button>
                    </div>
                          <button
                            type="button"
                            onClick={() => fetchImageGallery(1, true)}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                  >
                            🔄 새로고침
                          </button>
                        </div>
                        
                        {galleryFilter === 'search' && (
                          <div className="flex items-center space-x-2">
          <input
                              type="text"
                              value={gallerySearchQuery}
                              onChange={(e) => setGallerySearchQuery(e.target.value)}
                              placeholder="이미지 이름으로 검색..."
                              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <button
                      type="button"
                              onClick={() => setGallerySearchQuery('')}
                              className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                              >
                              지우기
                    </button>
                  </div>
                            )}
                </div>
                
                      {/* 이미지 갤러리 컨트롤 */}
                      {getFilteredImages().length > 0 && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                                  checked={getFilteredImages().length > 0 && selectedImages.size === getFilteredImages().length}
                          onChange={handleSelectAllImages}
                                  className="rounded border-gray-300"
                        />
                                <span className="text-sm text-gray-700">
                                  전체 선택 ({selectedImages.size}/{getFilteredImages().length}개 표시)
                          </span>
            </label>
                      </div>
                    {selectedImages.size > 0 && (
                        <button
                          type="button"
                                onClick={deleteSelectedImages}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                              >
                                🗑️ 선택된 이미지 삭제 ({selectedImages.size}개)
                        </button>
                    )}
                  </div>
                            </div>
                      )}

                      {/* 이미지 그룹 갤러리 */}
                      {getFilteredImages().length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {Object.entries(groupImagesByBaseName(getFilteredImages())).map(([baseName, imageGroup]) => {
                        const group = imageGroup as any[];
                        const representativeImage = getRepresentativeImage(group);
                        if (!representativeImage) return null;
                        
                        return (
                          <div key={baseName} className="relative group">
                            <div
                              className={`cursor-pointer border-2 rounded-lg overflow-hidden transition-colors ${
                                isFeaturedImage(representativeImage.url) 
                                  ? 'border-yellow-400 bg-yellow-50' 
                                  : 'border-gray-200 hover:border-blue-500'
                              }`}
                              onClick={() => handleImageGroupClick(group)}
                              >
                                <img
                                src={forceHttps(representativeImage.url)}
                                alt={representativeImage.name}
                                className="w-full h-32 object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-image.jpg';
                              }}
                            />
                              <div className="p-2 bg-white">
                                <div className="text-xs text-gray-600 truncate" title={baseName}>
                                  {baseName}
                            </div>
                                <div className="text-[11px] text-gray-500 flex items-center justify-between gap-2">
                                  <span className="truncate">ALT: {representativeImage.altText || representativeImage.name.replace(/\.(jpg|jpeg|png|gif|webp)$/i,'').split(/[-_.]/).slice(0,2).join(' ') || '미지정'}</span>
                                  <button
                                    type="button"
                                    title="빠른 수정"
                                    onClick={(e) => { e.stopPropagation(); const newAlt = window.prompt('ALT 텍스트를 입력하세요', representativeImage.altText || representativeImage.name); if (newAlt !== null) updateImageMetadata(representativeImage.name, { altText: newAlt }); }}
                                    className="px-1 py-0.5 text-[11px] bg-gray-100 hover:bg-gray-200 rounded"
                                  >✎ 수정</button>
                          </div>
                                <div className="text-[11px] text-gray-400 flex items-center justify-between">
                                  <span>버전 {group.length}</span>
                                  {isFeaturedImage(representativeImage.url) && (
                                    <span className="px-1 py-0.5 bg-yellow-500 text-white text-[10px] rounded">
                                      ⭐ 대표
                                </span>
                                  )}
                              </div>
                          </div>
                        </div>
                  
                            {/* 개별 이미지 선택 체크박스 */}
                            <div className="absolute top-2 left-2">
                              <input
                                type="checkbox"
                                checked={group.some((img: any) => selectedImages.has(img.name))}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    group.forEach((img: any) => {
                                      setSelectedImages(prev => new Set([...Array.from(prev), img.name]));
                                    });
                        } else {
                                    group.forEach((img: any) => {
                                      setSelectedImages(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete(img.name);
                                        return newSet;
                                      });
                                    });
                                  }
                                }}
                                className="rounded border-gray-300"
                                onClick={(e) => e.stopPropagation()}
                    />
            </div>
                  
                            {/* 호버 액션 */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-wrap gap-1 justify-center">
                    <button
                      type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isFeaturedImage(representativeImage.url)) {
                                      setFormData({ ...formData, featured_image: '' });
                                      alert('대표 이미지가 해제되었습니다!');
                        } else {
                                      setFormData({ ...formData, featured_image: forceHttps(representativeImage.url) });
                                      alert('대표 이미지로 설정되었습니다!');
                                    }
                      }}
                                  className={`px-2 py-1 text-white text-xs rounded ${
                                    isFeaturedImage(representativeImage.url) 
                                      ? 'bg-yellow-500 hover:bg-yellow-600' 
                                      : 'bg-blue-500 hover:bg-blue-600'
                                  }`}
                    >
                                  {isFeaturedImage(representativeImage.url) ? '⭐ 해제' : '⭐ 대표'}
                    </button>
                    <button
                      type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const preferredUrl = forceHttps(representativeImage.url);
                                    if (typeof window !== 'undefined') {
                                      window.dispatchEvent(new CustomEvent('tiptap:insert-image', { detail: { url: preferredUrl, alt: representativeImage.name } }));
                                    } else {
                                      insertImageToContent(preferredUrl);
                                    }
                                  }}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                >
                                  ➕ 삽입
                    </button>
                    <button
                      type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyImageUrl(forceHttps(representativeImage.url));
                                  }}
                                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                >
                                  📋 복사
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectBaseImage(forceHttps(representativeImage.url));
                                  }}
                                  className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                                >
                                  🎨 변형
                                </button>
                                  <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectImageForImprovement(forceHttps(representativeImage.url));
                                    }}
                                    className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                                  >
                                  ✨ 개선
                                  </button>
            </div>
          </div>
              </div>
                          );
                        })}
            </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <div className="text-4xl mb-4">🖼️</div>
                            <p className="text-lg mb-2">
                              {galleryFilter === 'featured' ? '대표 이미지가 없습니다' : 
                               galleryFilter === 'search' ? '검색 결과가 없습니다' : 
                               '이미지가 없습니다'}
                            </p>
                            <p className="text-sm">
                              {galleryFilter === 'featured' ? '다른 이미지를 대표 이미지로 설정하세요' :
                               galleryFilter === 'search' ? '다른 검색어를 시도해보세요' :
                               '위의 AI 이미지 생성 기능을 사용하거나 이미지를 업로드하세요'}
                </p>
                </div>
                        )}

                      {/* 페이지네이션 컨트롤 */}
                      {getFilteredImages().length > 0 && galleryFilter === 'all' && (
                    <div className="mt-6 flex items-center justify-center space-x-4">
                      <button
                        type="button"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        첫 페이지
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        이전
                      </button>
                    
                      <div className="flex items-center space-x-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          return (
                      <button
                              key={pageNum}
                        type="button"
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-2 text-sm border rounded-lg ${
                                currentPage === pageNum
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                      </button>
                          );
                        })}
                    </div>

                        <button
                          type="button"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        다음
                        </button>
                        <button
                          type="button"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        마지막 페이지
                        </button>
        </div>
                  )}

                      {/* 로딩 상태 표시 */}
                      {isLoadingImages && (
                        <div className="text-center py-4">
                          <div className="inline-flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            <span className="text-sm text-gray-600">이미지 로딩 중...</span>
                        </div>
                            </div>
                          )}
                        </div>
                      )}
        </div>

                {/* 카테고리 */}
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      카테고리
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="고객 후기">고객 후기</option>
                    <option value="제품 정보">제품 정보</option>
                    <option value="골프 팁">골프 팁</option>
                    <option value="이벤트">이벤트</option>
                    <option value="공지사항">공지사항</option>
                    </select>
                  </div>

                {/* 상태 */}
                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                      상태
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">초안</option>
                    <option value="published">발행</option>
                    <option value="archived">보관</option>
                    </select>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    취소
                  </button>
                    <button
                      type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                    {isSubmitting && (
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                      {editingPost ? '수정' : '저장'}
                    </button>
                </div>
              </form>
            </div>
          )}
              </div>
                        </div>
                        
      {/* AI 생성 이미지 확대 보기 모달 */}
      {showGeneratedImageModal && selectedGeneratedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          data-modal="image-viewer"
          onKeyDown={(e) => {
            if (generatedImages.length > 1) {
              if (e.key === 'ArrowLeft') {
                const currentIndex = generatedImages.indexOf(selectedGeneratedImage);
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : generatedImages.length - 1;
                setSelectedGeneratedImage(generatedImages[prevIndex]);
              } else if (e.key === 'ArrowRight') {
                const currentIndex = generatedImages.indexOf(selectedGeneratedImage);
                const nextIndex = currentIndex < generatedImages.length - 1 ? currentIndex + 1 : 0;
                setSelectedGeneratedImage(generatedImages[nextIndex]);
              } else if (e.key === 'Escape') {
                setShowGeneratedImageModal(false);
              }
            }
          }}
          tabIndex={0}
        >
          <div className="bg-white rounded-lg max-w-6xl max-h-[95vh] w-full overflow-hidden flex flex-col">
            {/* 모달 헤더 */}
            <div className="p-4 border-b bg-orange-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-orange-800">🎨 AI 생성 이미지 확대 보기</h3>
                  {generatedImages.length > 1 && (
                    <div className="flex items-center gap-2">
                          <button
                        onClick={() => {
                          const currentIndex = generatedImages.indexOf(selectedGeneratedImage);
                          const prevIndex = currentIndex > 0 ? currentIndex - 1 : generatedImages.length - 1;
                          setSelectedGeneratedImage(generatedImages[prevIndex]);
                        }}
                        className="px-2 py-1 bg-orange-200 text-orange-800 rounded hover:bg-orange-300 text-sm"
                        title="이전 이미지"
                      >
                        ←
                          </button>
                      <span className="text-sm text-orange-700">
                        {generatedImages.indexOf(selectedGeneratedImage) + 1} / {generatedImages.length}
                      </span>
                          <button
                        onClick={() => {
                          const currentIndex = generatedImages.indexOf(selectedGeneratedImage);
                          const nextIndex = currentIndex < generatedImages.length - 1 ? currentIndex + 1 : 0;
                          setSelectedGeneratedImage(generatedImages[nextIndex]);
                        }}
                        className="px-2 py-1 bg-orange-200 text-orange-800 rounded hover:bg-orange-300 text-sm"
                        title="다음 이미지"
                      >
                        →
                          </button>
                        </div>
                  )}
                </div>
                          <button
                  onClick={() => setShowGeneratedImageModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                          >
                  ×
                          </button>
                        </div>
                      </div>
                      
            {/* 이미지 영역 - 원본 비율 유지하며 위아래 잘림 방지 */}
            <div className="flex-1 p-4 flex items-center justify-center bg-gray-100 overflow-auto">
              <div className="relative max-w-full max-h-full">
                <img
                  src={selectedGeneratedImage}
                  alt="AI 생성 이미지"
                  className="max-w-full max-h-full object-contain rounded shadow-lg"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 'calc(95vh - 200px)', // 헤더와 버튼 영역 제외
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-image.jpg';
                  }}
                />
                            </div>
                          </div>
            
            {/* 이미지 정보 - 간소화 */}
            <div className="p-4 border-t bg-gray-50 flex-shrink-0">
              <div className="text-sm text-gray-600">
                <div><strong>원본 URL:</strong> 
                  <a 
                    href={selectedGeneratedImage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 ml-1 break-all"
                  >
                    {selectedGeneratedImage}
                  </a>
                          </div>
                        </div>
                      </div>
            
            {/* 액션 버튼들 */}
            <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center flex-shrink-0 gap-3">
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {/* 삭제 버튼 */}
                                    <button
                                      onClick={() => {
                    if (confirm('이 이미지를 삭제하시겠습니까?')) {
                      // 생성된 이미지 목록에서 제거
                      setGeneratedImages(prev => prev.filter(img => img !== selectedGeneratedImage));
                      setShowGeneratedImageModal(false);
                      alert('이미지가 삭제되었습니다.');
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 whitespace-nowrap"
                >
                  🗑️ 삭제
                                    </button>
              </div>
                                    <button
                onClick={() => setShowGeneratedImageModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 whitespace-nowrap"
                                    >
                닫기
                                    </button>
                                  </div>
                                </div>
                  </div>
                    )}

      {/* 이미지 그룹 모달 */}
      {showImageGroupModal && selectedImageGroup.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl max-h-[95vh] w-full overflow-hidden">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                🖼️ 이미지 그룹 상세 보기
              </h3>
              <button
                onClick={() => setShowImageGroupModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            {/* 이미지 그룹 내용 */}
            <div className="p-4 max-h-[70vh] overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedImageGroup.map((image, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="relative">
                    <img
                      src={forceHttps(image.url)}
                      alt={image.name}
                        className="w-full h-40 object-cover cursor-zoom-in"
                        onClick={() => {
                          setLargeImageUrl(forceHttps(image.url));
                          setShowLargeImageModal(true);
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
                        {getImageVersionInfo(image.name)}
                      </span>
                    </div>
                  </div>
                    <div className="p-3">
                      <div className="text-sm font-medium text-gray-900 truncate" title={image.name}>
                    {image.name}
                  </div>
                      <div className="text-xs text-gray-500 mt-1">크기: {image.size ? `${(image.size / 1024).toFixed(1)}KB` : '알 수 없음'}</div>
                      {/* ALT/태그 간단 편집 */}
                      <div className="mt-2 space-y-2">
                        <input
                          placeholder="ALT 텍스트(SEO)"
                          defaultValue={image.altText || ''}
                          className="w-full px-2 py-1 border rounded text-xs"
                          onBlur={async (e) => {
                            const ok = await updateImageMetadata(image.name, { altText: e.target.value });
                            if (ok) e.currentTarget.classList.add('border-green-400');
                          }}
                        />
                        <input
                          placeholder="키워드(쉼표로 구분)"
                          defaultValue={(image.keywords || []).join(', ')}
                          className="w-full px-2 py-1 border rounded text-xs"
                          onBlur={async (e) => {
                            const keywords = e.target.value.split(',').map(s=>s.trim()).filter(Boolean);
                            await updateImageMetadata(image.name, { keywords });
                          }}
                        />
                      </div>
                      <div className="flex gap-1 flex-wrap mt-2">
                    <button
                      type="button"
                      onClick={() => {
                            if (isFeaturedImage(image.url)) {
                              setFormData({ ...formData, featured_image: '' });
                              alert('대표 이미지가 해제되었습니다!');
                        } else {
                              setFormData({ ...formData, featured_image: forceHttps(image.url) });
                              alert('대표 이미지로 설정되었습니다!');
                            }
                          }}
                          className={`px-2 py-1 text-white text-xs rounded ${
                            isFeaturedImage(image.url) 
                              ? 'bg-yellow-500 hover:bg-yellow-600' 
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          {isFeaturedImage(image.url) ? '⭐ 해제' : '⭐ 대표'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                            insertImageToContent(forceHttps(image.url));
                      }}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                          ➕ 삽입
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                            copyImageUrl(forceHttps(image.url));
                      }}
                          className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                    >
                      📋 복사
                    </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteImage(image.name);
                            setShowImageGroupModal(false);
                          }}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        >
                          🗑️ 삭제
                    </button>
                      </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setShowImageGroupModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개선된 콘텐츠 미리보기 모달 */}
      {showImprovedContent && improvedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                🤖 AI 개선된 콘텐츠 미리보기
              </h3>
              <button
                onClick={() => setShowImprovedContent(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            {/* 개선된 콘텐츠 내용 */}
            <div className="p-4 max-h-[60vh] overflow-auto">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {improvedContent}
            </div>
              </div>
            </div>
            
            {/* 액션 버튼들 */}
            <div className="flex justify-end gap-3 p-4 border-t">
                <button
                onClick={() => setShowImprovedContent(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                취소
                </button>
                <button
                onClick={applyImprovedContent}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                ✅ 개선된 콘텐츠 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 확대 보기 모달 */}
      {showLargeImageModal && largeImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4" onClick={() => setShowLargeImageModal(false)}>
          <div className="relative max-w-[95vw] max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
            <img src={largeImageUrl} alt="확대 이미지" className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl bg-white" />
            <button onClick={() => setShowLargeImageModal(false)} className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full w-8 h-8 shadow flex items-center justify-center">✕</button>
              </div>
            </div>
      )}

      {/* 통합 GalleryPicker 모달 */}
      {showUnifiedPicker && (
        <GalleryPicker
          isOpen={showUnifiedPicker}
          onClose={() => setShowUnifiedPicker(false)}
          featuredUrl={formData.featured_image}
          onSelect={(url) => {
            const preferredUrl = forceHttps(url);
            if (pendingEditorImageInsert) (pendingEditorImageInsert as any)(preferredUrl, {});
            setShowUnifiedPicker(false);
            setPendingEditorImageInsert(null);
          }}
        />
      )}
    </>
  );
}

// 확대 이미지 모달 (공통)
// 파일 하단에 렌더링되는 기존 모달들 직후에 추가됨
// 실제 모달 렌더링
// eslint-disable-next-line @next/next/no-sync-scripts
// 아래는 페이지 컴포넌트 내부 JSX에 이미 모달들이 있으므로 동일 패턴으로 추가