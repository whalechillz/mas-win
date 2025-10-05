import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Head from 'next/head';
import { marked } from 'marked';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import ImageGroupThumbnail from '../../components/ImageGroupThumbnail';
// import WysiwygEditor from '../../components/WysiwygEditor';

// React Quill을 동적으로 로드 (SSR 문제 방지 및 성능 최적화)
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">에디터 로딩 중...</div>
});
import 'react-quill/dist/quill.snow.css';

// React Quill 설정
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'align',
  'link', 'image'
];

// HTML을 마크다운으로 변환하는 함수
const convertHtmlToMarkdown = (html) => {
  if (!html) return '';
  
  // 간단한 HTML to Markdown 변환
  let markdown = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![]($1)')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br[^>]*>/gi, '\n')
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
    })
    .replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
      let counter = 1;
      return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n';
    })
    .replace(/<[^>]*>/g, '') // 남은 HTML 태그 제거
    .replace(/\n\s*\n\s*\n/g, '\n\n') // 연속된 줄바꿈 정리
    .trim();
    
  return markdown;
};

// 마크다운을 HTML로 변환하는 함수
const convertMarkdownToHtml = async (markdown) => {
  if (!markdown) return '';
  
  // 큰 콘텐츠의 경우 비동기 처리로 UI 블로킹 방지
  if (markdown.length > 10000) {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          // marked 설정
          marked.setOptions({
            breaks: true, // 줄바꿈을 <br>로 변환
            gfm: true, // GitHub Flavored Markdown 지원
          });
          
          const html = marked(markdown);
          resolve(html);
        } catch (error) {
          console.error('❌ 마크다운 변환 오류:', error);
          resolve(markdown); // 실패 시 원본 반환
        }
      }, 0); // 다음 이벤트 루프에서 실행
    });
  }
  
  // 작은 콘텐츠는 즉시 처리
  try {
    // marked 설정
    marked.setOptions({
      breaks: true, // 줄바꿈을 <br>로 변환
      gfm: true, // GitHub Flavored Markdown 지원
    });
    
    return marked(markdown);
  } catch (error) {
    console.error('❌ 마크다운 변환 오류:', error);
    return markdown; // 실패 시 원본 반환
  }
};

// 마크다운 미리보기 컴포넌트
const MarkdownPreview = ({ content }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const convertContent = async () => {
      try {
        setIsLoading(true);
        const html = await convertMarkdownToHtml(content);
        setHtmlContent(html);
      } catch (error) {
        console.error('마크다운 변환 오류:', error);
        setHtmlContent(content);
      } finally {
        setIsLoading(false);
      }
    };

    if (content) {
      convertContent();
    } else {
      setHtmlContent('');
      setIsLoading(false);
    }
  }, [content]);

  if (isLoading) {
    return <p className="text-gray-500 italic">미리보기 로딩 중...</p>;
  }

  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export default function BlogAdmin() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'migration', 'naver-scraper'
  const [selectedPosts, setSelectedPosts] = useState([]); // 선택된 게시물 ID들
  const [viewMode, setViewMode] = useState('list'); // 'list' 또는 'card'
  const [sortBy, setSortBy] = useState('published_at'); // 정렬 기준
  const [sortOrder, setSortOrder] = useState('desc'); // 정렬 순서
  const [postImages, setPostImages] = useState([]); // 게시물 이미지 목록
  const [simpleAIRequest, setSimpleAIRequest] = useState(''); // 간단 AI 개선 요청사항
  
  // 이미지 변형 관련 상태
  const [selectedBaseImage, setSelectedBaseImage] = useState(''); // 변형할 기본 이미지
  const [variationStrength, setVariationStrength] = useState(0.7); // 변형 강도
  const [isGeneratingVariation, setIsGeneratingVariation] = useState(false); // 변형 생성 중
  
  // 간단 AI 이미지 개선 관련 상태
  const [simpleAIImageRequest, setSimpleAIImageRequest] = useState(''); // 간단 AI 이미지 개선 요청사항
  const [selectedImageForImprovement, setSelectedImageForImprovement] = useState(''); // 개선할 이미지
  const [isImprovingImage, setIsImprovingImage] = useState(false); // 이미지 개선 중
  const [improvementProcess, setImprovementProcess] = useState(''); // 이미지 개선 과정 표시

  // 이미지 URL 유효성 검사 함수
  const isValidImageUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    // 삭제된 이미지나 잘못된 URL 필터링
    if (url.includes('undefined') || url.includes('null') || url === '') return false;
    return url.startsWith('http') || url.startsWith('/') || url.startsWith('data:');
  };

  // 고급 콘텐츠 분석 관련 상태
  const [isAnalyzingContent, setIsAnalyzingContent] = useState(false);
  const [contentAnalysisResult, setContentAnalysisResult] = useState(null);
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);
  
  const [editingPost, setEditingPost] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const prevContentRef = useRef('');
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

  // 디버깅용 useEffect 제거 (무한 루프 방지)
  
  // 콘텐츠 변경 시 HTML 변환 useEffect 제거 (무한 루프 방지)
  // HTML 변환은 handleEdit 함수에서 처리됨


  // 편집 포스트 디버깅 제거 (무한 루프 방지)

  // URL 파라미터 처리 (편집 모드)
  useEffect(() => {
    if (router.isReady && router.query.edit) {
      const postId = Array.isArray(router.query.edit) ? router.query.edit[0] : router.query.edit;
      console.log('편집 모드로 전환:', postId);
      
      // 포스트 데이터 로드
      const loadPostForEdit = async () => {
        try {
          const response = await fetch(`/api/admin/blog/${postId}`);
          if (response.ok) {
            const postData = await response.json();
            console.log('편집할 포스트 데이터:', postData);
            setEditingPost(postData);
            setFormData({
              title: postData.title || '',
              slug: postData.slug || '',
              excerpt: postData.excerpt || '',
              content: postData.content || '',
              featured_image: postData.featured_image || '',
              category: postData.category || '고객 후기',
              tags: postData.tags || [],
              status: postData.status || 'draft',
              meta_title: postData.meta_title || '',
              meta_description: postData.meta_description || '',
              meta_keywords: postData.meta_keywords || '',
              view_count: postData.view_count || 0,
              is_featured: postData.is_featured || false,
              is_scheduled: postData.is_scheduled || false,
              scheduled_at: postData.scheduled_at || null,
              author: postData.author || '마쓰구골프'
            });
            setShowForm(true);
            setActiveTab('create');
          } else {
            console.error('포스트 로드 실패:', response.status);
          }
        } catch (error) {
          console.error('포스트 로드 오류:', error);
        }
      };
      
      loadPostForEdit();
    }
  }, [router.isReady, router.query.edit]);

  // 마쓰구 브랜드 전략 상태
  const [brandStrategy, setBrandStrategy] = useState({
    contentType: '골프 정보',
    audienceTemp: 'warm',
    brandWeight: 'none',
    customerChannel: '',
    painPoint: '',
    customerPersona: 'competitive_maintainer'
  });

  
  // AI 이미지 생성 관련 상태
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showGeneratedImages, setShowGeneratedImages] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [showGeneratedImageModal, setShowGeneratedImageModal] = useState(false);
  const [selectedGeneratedImage, setSelectedGeneratedImage] = useState('');
  
  // 단락별 이미지 생성 관련 상태
  const [paragraphImages, setParagraphImages] = useState([]);
  const [showParagraphImages, setShowParagraphImages] = useState(false);
  const [isGeneratingParagraphImages, setIsGeneratingParagraphImages] = useState(false);
  
  // 마크다운 미리보기 상태
  const [showContentPreview, setShowContentPreview] = useState(false);
  // 마이그레이션 관련 상태
  const [migrationUrl, setMigrationUrl] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState('');
  const [scrapedData, setScrapedData] = useState(null);

  // 마이그레이션 시작 함수
  
  // 마이그레이션 시작 함수 (Playwright 방식 - 강석님 블로그처럼)
  const handleMigration = async () => {
    if (!migrationUrl) {
      alert('URL을 입력해주세요.');
      return;
    }

    setIsMigrating(true);
    setMigrationStatus('GPT-4o-mini로 전문적인 콘텐츠 구조화 및 고화질 이미지 처리 중...');
    
    try {
      // 향상된 고화질 마이그레이션 (강석님 블로그 방식)
        const migrationResponse = await fetch('/api/migrate-blog-professional/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: migrationUrl })
        });

      // 응답 상태 확인
      if (!migrationResponse.ok) {
        throw new Error(`마이그레이션 실패: HTTP ${migrationResponse.status}`);
      }

      // 응답 텍스트로 먼저 받기
      const migrationText = await migrationResponse.text();
      console.log('마이그레이션 응답:', migrationText.substring(0, 200));

      // JSON 파싱 시도
      let migrationResult;
      try {
        migrationResult = JSON.parse(migrationText);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        throw new Error('마이그레이션 응답을 파싱할 수 없습니다: ' + parseError.message);
      }
      
      if (!migrationResult.success) {
        throw new Error(migrationResult.error || '마이그레이션 실패');
      }

      setScrapedData(migrationResult.data);
      setMigrationStatus('마이그레이션 완료!');
      
      // 성공 메시지
      const imageCount = migrationResult.data.images ? migrationResult.data.images.length : 0;
      alert(`🎉 마이그레이션이 성공적으로 완료되었습니다!\n\n📝 제목: ${migrationResult.data.title}\n🖼️ 이미지: ${imageCount}개 캡처 완료\n📄 콘텐츠: 실제 블로그 내용 추출 완료`);
      
      // 폼 초기화
      setMigrationUrl('');
      setScrapedData(null);
      
      // 블로그 목록 새로고침
      fetchPosts();

    } catch (error) {
      console.error('마이그레이션 오류:', error);
      setMigrationStatus('오류: ' + error.message);
      alert('마이그레이션 실패: ' + error.message);
    } finally {
      setIsMigrating(false);
    }
  };



  // 이미지 갤러리 관리 상태
  const [imageGallery, setImageGallery] = useState([]);
  const [showImageGallery, setShowImageGallery] = useState(false);
  
  // 전체 이미지 갤러리 상태
  const [allImages, setAllImages] = useState([]);
  const [showAllImages, setShowAllImages] = useState(false);
  const [isLoadingAllImages, setIsLoadingAllImages] = useState(false);
  const [allImagesPagination, setAllImagesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  
  // 이미지 선택 상태 (체크박스용)
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [isDeletingImages, setIsDeletingImages] = useState(false);
  
  // 웹페이지 이미지 수집 상태
  const [webpageUrl, setWebpageUrl] = useState('');
  const [scrapedImages, setScrapedImages] = useState([]);
  const [selectedScrapedImages, setSelectedScrapedImages] = useState(new Set());
  const [isScrapingImages, setIsScrapingImages] = useState(false);
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [showWebpageScraper, setShowWebpageScraper] = useState(false);
  const [scraperOptions, setScraperOptions] = useState({
    minWidth: 100,
    minHeight: 100,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    excludeExternal: false
  });
  
  // 중복 이미지 관리 상태
  const [duplicateImages, setDuplicateImages] = useState([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [isLoadingDuplicates, setIsLoadingDuplicates] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);
  
  
  // 이미지 미리보기 상태
  const [previewImage, setPreviewImage] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imageUsageInfo, setImageUsageInfo] = useState(null);
  const [isLoadingUsageInfo, setIsLoadingUsageInfo] = useState(false);
  
  // 이미지 그룹 모달 상태
  const [selectedImageGroup, setSelectedImageGroup] = useState([]);
  const [showImageGroupModal, setShowImageGroupModal] = useState(false);
  
  // 스크래핑 이미지 확대 모달 상태
  const [showScrapingImageModal, setShowScrapingImageModal] = useState(false);
  const [selectedScrapingImage, setSelectedScrapingImage] = useState(null);

  // AI 제목 생성 관련 상태
  const [contentSource, setContentSource] = useState('');
  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [showTitleOptions, setShowTitleOptions] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // WYSIWYG 에디터 상태
  const [useWysiwyg, setUseWysiwyg] = useState(true);

  // ReactQuill 에디터 초기화 제거 (무한 루프 방지)
  
  // 이미지 생성 과정 투명성 상태
  const [imageGenerationStep, setImageGenerationStep] = useState('');
  const [imageGenerationPrompt, setImageGenerationPrompt] = useState('');
  const [imageGenerationModel, setImageGenerationModel] = useState('');
  const [showGenerationProcess, setShowGenerationProcess] = useState(false);
  
  // 저장된 프롬프트 관리 상태
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [expandedPromptId, setExpandedPromptId] = useState(null);
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [editingKoreanPrompt, setEditingKoreanPrompt] = useState('');
  
  // 프롬프트 삭제 함수
  const deletePrompt = (promptId) => {
    if (confirm('이 프롬프트를 삭제하시겠습니까?')) {
      setSavedPrompts(prev => prev.filter(p => p.id !== promptId));
      if (expandedPromptId === promptId) {
        setExpandedPromptId(null);
      }
      if (editingPromptId === promptId) {
        setEditingPromptId(null);
        setEditingKoreanPrompt('');
      }
    }
  };
  
  // 모든 프롬프트 삭제 함수
  const deleteAllPrompts = () => {
    if (confirm(`저장된 프롬프트 ${savedPrompts.length}개를 모두 삭제하시겠습니까?`)) {
      setSavedPrompts([]);
      setExpandedPromptId(null);
      setEditingPromptId(null);
      setEditingKoreanPrompt('');
    }
  };
  
  // 기존 프롬프트 데이터 정리 함수
  const normalizePrompts = (prompts) => {
    return prompts.map(prompt => ({
      ...prompt,
      // createdAt이 없으면 timestamp를 사용, 둘 다 없으면 현재 시간 사용
      createdAt: prompt.createdAt || prompt.timestamp || new Date().toISOString(),
      // model이 없으면 type을 사용
      model: prompt.model || prompt.type || '알 수 없는 모델',
      // koreanPrompt가 없으면 기본값 제공
      koreanPrompt: prompt.koreanPrompt || `프롬프트: ${prompt.model || prompt.type || '알 수 없는 모델'}`
    }));
  };
  
  // 자동 저장 방지 상태
  const [isManualSave, setIsManualSave] = useState(false);
  
  // 프롬프트 미리보기 상태
  const [previewPrompt, setPreviewPrompt] = useState('');
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [selectedImageCount, setSelectedImageCount] = useState(1);
  
  // AI 생성 이미지 선택 아코디언 상태
  const [showAIImageAccordion, setShowAIImageAccordion] = useState(false);

  // 게시물 목록 불러오기
  const fetchPosts = useCallback(async (currentSortBy = sortBy, currentSortOrder = sortOrder) => {
    try {
      setLoading(true);
      console.log('🔍 게시물 목록 불러오는 중...');
      
      // 정렬 파라미터 추가
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
  }, []); // 의존성 배열을 비워서 함수가 재생성되지 않도록 함

  // 이미지 삭제 처리
  const handleImageDelete = async () => {
    if (!formData.featured_image) return;
    
    try {
      const response = await fetch('/api/delete-image-supabase', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: formData.featured_image
        }),
      });
      
      if (response.ok) {
        setFormData({ ...formData, featured_image: '' });
        alert('이미지가 삭제되었습니다!');
      } else {
        const error = await response.json();
        alert('이미지 삭제 실패: ' + error.error);
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      alert('이미지 삭제에 실패했습니다.');
    }
  };

  // 이미지 업로드 처리
  const handleImageUpload = async (file) => {
    if (!file) return;
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    
    // 파일 크기 검증 (10MB 제한 - Supabase Storage용)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }
    
    try {
      setLoading(true);
      
      // 파일을 Base64로 변환
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result as string;
        
        // 임시 미리보기 설정
        setFormData({ ...formData, featured_image: base64Data });
        
        // Supabase Storage에 업로드
        const response = await fetch('/api/upload-image-supabase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Data,
            fileName: file.name,
            optimize: true
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          // 성공 시 Supabase Storage URL로 업데이트
          setFormData({ ...formData, featured_image: result.imageUrl });
          alert('이미지가 Supabase Storage에 성공적으로 업로드되었습니다!');
        } else {
          const error = await response.json();
          throw new Error(error.error || '이미지 업로드 실패');
        }
      };
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      alert('이미지 업로드에 실패했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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

  // WYSIWYG 에디터 내용 변경 핸들러 (무한 루프 방지)
  const handleQuillChange = useCallback((content) => {
    // HTML 콘텐츠만 업데이트 (formData는 별도로 관리)
    setHtmlContent(content);
    console.log('📝 ReactQuill 콘텐츠 변경됨');
  }, []);

  // 게시물 저장/수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 디버깅: 어떤 이벤트가 폼 제출을 트리거했는지 확인
    console.log('🚨 handleSubmit 호출됨!');
    console.log('🚨 이벤트 타입:', e.type);
    console.log('🚨 이벤트 타겟:', e.target);
    console.log('🚨 이벤트 현재 타겟:', e.currentTarget);
    
    // 자동 저장 완전 비활성화 - 수동 저장 상태 확인
    if (!isManualSave) {
      console.log('🚨 자동 저장 방지: 수동 저장이 아닙니다.');
      return;
    }
    
    // 추가 보안: 이벤트가 프로그래밍적으로 트리거된 경우 방지
    if (e.isTrusted === false) {
      console.log('🚨 자동 저장 방지: 프로그래밍적으로 트리거된 이벤트입니다.');
      return;
    }
    
    try {
      console.log('📝 게시물 저장 중...');
      
      // WYSIWYG 에디터 사용 시 최신 HTML을 마크다운으로 변환
      if (useWysiwyg && htmlContent) {
        const markdownContent = convertHtmlToMarkdown(htmlContent);
        setFormData(prev => ({
          ...prev,
          content: markdownContent
        }));
      }
      
      if (editingPost) {
        // 수정
        const response = await fetch(`/api/admin/blog/${editingPost.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          // alert('게시물이 수정되었습니다!'); // 화살표 클릭 시 자동 저장으로 인한 알림 제거
          fetchPosts();
          resetForm();
          setIsManualSave(false); // 수동 저장 상태 리셋
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
          setIsManualSave(false); // 수동 저장 상태 리셋
        } else {
          const error = await response.json();
          alert('생성 실패: ' + error.error);
        }
      }
    } catch (error) {
      console.error('❌ 게시물 저장 에러:', error);
      alert('저장 실패: ' + error.message);
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

    // 선택된 게시물 정보 수집
    const selectedPostTitles = selectedPosts
      .map(id => posts.find(post => post.id === id)?.title)
      .filter(Boolean)
      .slice(0, 5); // 최대 5개만 표시

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

  // 게시물 수정 모드로 전환 (성능 최적화)
  const handleEdit = useCallback(async (post) => {
    try {
      console.log('📝 게시물 수정 모드 시작:', post.id);
      
    setEditingPost(post);
    setFormData({
      ...post,
      tags: Array.isArray(post.tags) ? post.tags : []
    });
    
    // 이전 콘텐츠 참조 초기화 (무한 루프 방지)
    prevContentRef.current = post.content || '';
    
    // HTML 콘텐츠 즉시 설정 (무한 루프 방지)
    if (post.content) {
      try {
        const convertedHtml = await convertMarkdownToHtml(post.content);
        setHtmlContent(convertedHtml);
        console.log('✅ HTML 변환 완료');
      } catch (error) {
        console.error('❌ HTML 변환 실패:', error);
        setHtmlContent(post.content); // 실패 시 원본 사용
      }
    }
      
      // 이미지 갤러리 초기화
      setImageGallery([]);
      
      // 대표 이미지가 있으면 이미지 갤러리에 추가
      if (post.featured_image) {
        console.log('🖼️ 대표 이미지를 갤러리에 추가:', post.featured_image);
        const newImage = {
          id: Date.now() + Math.random(),
          url: post.featured_image,
          type: 'featured',
          metadata: {
            isFeatured: true,
            loadedAt: new Date().toISOString()
          },
          addedAt: new Date().toISOString()
        };
        setImageGallery(prev => [newImage, ...prev]);
      }
      
    setShowForm(true);
      
      // 게시물 이미지 목록 로드 (비동기)
      try {
        const response = await fetch(`/api/admin/blog-images?postId=${post.id}`);
        const data = await response.json();
        
        if (response.ok) {
          setPostImages(data.images || []);
          console.log('✅ 게시물 이미지 로드 성공:', data.images?.length || 0, '개');
        } else {
          console.error('❌ 게시물 이미지 로드 실패:', data.error);
          setPostImages([]);
        }
      } catch (error) {
        console.error('❌ 게시물 이미지 로드 에러:', error);
        setPostImages([]);
      }
      
      // HTML 변환은 이미 위에서 처리됨 (중복 제거)
      
      // 대표이미지가 있으면 WYSIWYG 에디터에 자동으로 표시
      if (post.featured_image && useWysiwyg) {
        console.log('🖼️ 대표이미지를 WYSIWYG 에디터에 자동 표시:', post.featured_image);
        const featuredImageHtml = `<div class="featured-image-container" style="margin: 20px 0; text-align: center;">
          <img src="${post.featured_image}" alt="대표이미지" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
          <p style="margin-top: 10px; font-size: 14px; color: #666; font-style: italic;">대표이미지</p>
        </div>`;
        
        // 기존 HTML 콘텐츠에 대표이미지가 없으면 추가
        if (!htmlContent.includes(post.featured_image)) {
          setHtmlContent(featuredImageHtml + htmlContent);
        }
      }
      
    } catch (error) {
      console.error('❌ 게시물 수정 모드 오류:', error);
      alert('게시물 수정 모드 진입 중 오류가 발생했습니다.');
    }
  }, [setEditingPost, setFormData, setImageGallery, setShowForm, setHtmlContent, setPostImages, useWysiwyg]);

  // 게시물 이미지 목록 로드
  const loadPostImages = useCallback(async (postId) => {
    try {
      const response = await fetch(`/api/admin/blog-images?postId=${postId}`);
      const data = await response.json();
      
      if (response.ok) {
        setPostImages(data.images || []);
        console.log('✅ 게시물 이미지 로드 성공:', data.images?.length || 0, '개');
        
        // 편집 모드에서는 imageGallery에도 추가
        if (editingPost && data.images && data.images.length > 0) {
          console.log('🖼️ 편집 모드에서 이미지 갤러리에 추가 중...');
          console.log('📊 로드된 이미지 개수:', data.images.length);
          
          // imageGallery 상태를 직접 업데이트
          setImageGallery(prevGallery => {
            const newImages = [];
            data.images.forEach(image => {
              // 중복 체크
              const exists = prevGallery.some(img => img.url === image.url);
              if (!exists) {
                newImages.push({
                  id: Date.now() + Math.random(),
                  url: image.url,
                  type: 'upload',
                  metadata: {
                    loadedFromDB: true,
                    postId: postId,
                    loadedAt: new Date().toISOString()
                  },
                  addedAt: new Date().toISOString()
                });
              }
            });
            
            console.log('📊 새로 추가할 이미지 개수:', newImages.length);
            return [...newImages, ...prevGallery];
          });
        }
      } else {
        console.error('❌ 게시물 이미지 로드 실패:', data.error);
        setPostImages([]);
      }
    } catch (error) {
      console.error('❌ 게시물 이미지 로드 에러:', error);
      setPostImages([]);
    }
  }, [editingPost, setPostImages, setImageGallery]);

  // 전체 이미지 목록 로드 (페이지네이션 지원)
  const loadAllImages = async (page = 1, limit = 24) => {
    try {
      setIsLoadingAllImages(true);
      const response = await fetch(`/api/admin/all-images?page=${page}&limit=${limit}`);
      const data = await response.json();
      
      if (response.ok) {
        setAllImages(data.images || []);
        setAllImagesPagination(data.pagination || {
          currentPage: 1,
          totalPages: 1,
          total: 0,
          hasNextPage: false,
          hasPrevPage: false
        });
        console.log('✅ 전체 이미지 로드 성공:', data.images?.length || 0, '개');
      } else {
        console.error('❌ 전체 이미지 로드 실패:', data.error);
        setAllImages([]);
      }
    } catch (error) {
      console.error('❌ 전체 이미지 로드 에러:', error);
      setAllImages([]);
    } finally {
      setIsLoadingAllImages(false);
    }
  };

  // 중복 이미지 찾기
  const findDuplicateImages = async () => {
    try {
      setIsLoadingDuplicates(true);
      const response = await fetch('/api/admin/find-duplicates');
      const data = await response.json();
      
      if (response.ok) {
        setDuplicateImages(data.duplicates || []);
        console.log('✅ 중복 이미지 분석 완료:', data.duplicates?.length || 0, '개 그룹');
        alert(`중복 이미지 ${data.duplicateGroups}개 그룹을 찾았습니다. (총 ${data.duplicateCount}개 중복)`);
      } else {
        console.error('❌ 중복 이미지 분석 실패:', data.error);
        setDuplicateImages([]);
      }
    } catch (error) {
      console.error('❌ 중복 이미지 분석 에러:', error);
      setDuplicateImages([]);
    } finally {
      setIsLoadingDuplicates(false);
    }
  };

  // 이미지 삭제 함수
  const deleteImageFromStorage = async (imageName) => {
    try {
      const response = await fetch('/api/admin/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName })
      });

      if (response.ok) {
        alert('이미지가 Supabase에서 완전히 삭제되었습니다!');
        
        // 전체 이미지 갤러리에서 삭제된 이미지 제거
        setAllImages(prev => prev.filter(img => img.name !== imageName));
        
        // 현재 게시물 이미지에서도 삭제된 이미지 제거
        setPostImages(prev => prev.filter(img => img.name !== imageName));
        
        // 대표 이미지가 삭제된 경우 초기화
        if (formData.featured_image && formData.featured_image.includes(imageName)) {
          setFormData(prev => ({ ...prev, featured_image: '' }));
        }
        
        // 본문에서 삭제된 이미지 URL 제거
        if (useWysiwyg) {
          const updatedHtmlContent = htmlContent.replace(new RegExp(`<img[^>]*src="[^"]*${imageName}[^"]*"[^>]*>`, 'g'), '');
          setHtmlContent(updatedHtmlContent);
          const markdownContent = convertHtmlToMarkdown(updatedHtmlContent);
          setFormData(prev => ({ ...prev, content: markdownContent }));
        } else {
          const updatedContent = formData.content.replace(new RegExp(`!\\[.*?\\]\\([^)]*${imageName}[^)]*\\)`, 'g'), '');
          setFormData(prev => ({ ...prev, content: updatedContent }));
        }
        
      } else {
        alert('이미지 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
      alert('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 모든 이미지 버전 삭제 함수 (5개 버전 모두 삭제)
  const deleteAllImageVersions = async (imageName) => {
    try {
      console.log('🗑️ 모든 이미지 버전 삭제 시작:', imageName);
      
      // 이미지 이름에서 확장자 제거하여 기본 이름 추출
      const baseName = imageName.replace(/\.[^/.]+$/, '');
      const extension = (imageName || '').split('.').pop() || 'jpg';
      
      // 5개 버전의 파일명 생성
      const versions = [
        imageName, // 원본
        `${baseName}_thumb.${extension}`, // 썸네일
        `${baseName}_medium.${extension}`, // 미디움
        `${baseName}.webp`, // WebP 버전
        `${baseName}_thumb.webp` // WebP 썸네일
      ];
      
      console.log('📋 삭제할 버전들:', versions);
      
      let successCount = 0;
      let failCount = 0;
      
      // 각 버전을 순차적으로 삭제
      for (const versionName of versions) {
        try {
          const response = await fetch('/api/admin/delete-image', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageName: versionName })
          });
          
          if (response.ok) {
            successCount++;
            console.log(`✅ ${versionName} 삭제 성공`);
          } else {
            failCount++;
            console.log(`❌ ${versionName} 삭제 실패`);
          }
        } catch (error) {
          failCount++;
          console.error(`❌ ${versionName} 삭제 오류:`, error);
        }
      }
      
      // 결과 알림
      if (successCount > 0) {
        alert(`✅ ${successCount}개 버전이 성공적으로 삭제되었습니다!\n${failCount > 0 ? `⚠️ ${failCount}개 버전 삭제 실패` : ''}`);
        
        // UI에서 이미지 제거
        setAllImages(prev => prev.filter(img => !versions.includes(img.name)));
        setPostImages(prev => prev.filter(img => !versions.includes(img.name)));
        
        // 대표 이미지가 삭제된 경우 초기화
        if (formData.featured_image && versions.some(version => formData.featured_image.includes(version))) {
          setFormData(prev => ({ ...prev, featured_image: '' }));
        }
      } else {
        alert('❌ 모든 버전 삭제에 실패했습니다.');
      }
      
    } catch (error) {
      console.error('❌ 모든 이미지 버전 삭제 오류:', error);
      alert('이미지 버전 삭제 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 이미지 버전 정보 가져오기 함수
  const getImageVersionInfo = (imageName) => {
    if (!imageName) return '🖼️ 이미지 정보 없음';
    const baseName = imageName.replace(/\.[^/.]+$/, '');
    const extension = (imageName || '').split('.').pop() || 'jpg';
    
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
      
      // 디버깅을 위한 로그
      console.log(`🔍 그룹화: ${image.name} → ${baseName}`);
      
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      groups[baseName].push(image);
    });
    
    // 그룹화 결과 로그
    Object.keys(groups).forEach(baseName => {
      console.log(`📦 그룹 "${baseName}": ${groups[baseName].length}개 버전`);
    });
    
    return groups;
  };

  // 그룹화된 이미지에서 대표 이미지 선택 (원본 우선)
  const getRepresentativeImage = (imageGroup) => {
    // 이미지 그룹이 비어있거나 유효하지 않은 경우
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

  // 이미지 선택 관련 함수들
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

  const handleSelectAllImages = () => {
    if (selectedImages.size === allImages.length) {
      // 모두 선택된 상태면 모두 해제
      setSelectedImages(new Set());
    } else {
      // 일부만 선택되거나 아무것도 선택되지 않은 상태면 모두 선택
      setSelectedImages(new Set(allImages.map(img => img.name)));
    }
  };

  const handleBulkDeleteImages = async () => {
    if (selectedImages.size === 0) {
      alert('삭제할 이미지를 선택해주세요.');
      return;
    }

    const confirmMessage = `선택된 ${selectedImages.size}개의 이미지를 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`;
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeletingImages(true);
    let successCount = 0;
    let failCount = 0;

    try {
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
    } finally {
      setIsDeletingImages(false);
    }
  };

  // 웹페이지 이미지 수집 관련 함수들
  const handleScrapeWebpageImages = async () => {
    if (!webpageUrl.trim()) {
      alert('웹페이지 URL을 입력해주세요.');
      return;
    }

    setIsScrapingImages(true);
    setScrapedImages([]);
    setSelectedScrapedImages(new Set());

    try {
      const response = await fetch('/api/admin/scrape-webpage-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          webpageUrl: webpageUrl.trim(),
          options: scraperOptions
        })
      });

      if (response.ok) {
        const result = await response.json();
        setScrapedImages(result.images || []);
        alert(`✅ ${result.totalImages}개의 이미지를 발견했습니다!`);
      } else {
        const error = await response.json();
        const errorMessage = error.details ? 
          `❌ ${error.error}\n\n상세 정보: ${error.details}` : 
          `❌ 이미지 수집 실패: ${error.error}`;
        alert(errorMessage);
      }
    } catch (error) {
      console.error('웹페이지 이미지 수집 오류:', error);
      alert('웹페이지 이미지 수집 중 오류가 발생했습니다.');
    } finally {
      setIsScrapingImages(false);
    }
  };

  const handleScrapedImageSelect = (imageSrc) => {
    setSelectedScrapedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageSrc)) {
        newSet.delete(imageSrc);
      } else {
        newSet.add(imageSrc);
      }
      return newSet;
    });
  };

  const handleSelectAllScrapedImages = () => {
    if (selectedScrapedImages.size === scrapedImages.length) {
      setSelectedScrapedImages(new Set());
    } else {
      setSelectedScrapedImages(new Set(scrapedImages.map(img => img.src)));
    }
  };

  const handleDownloadSelectedImages = async () => {
    if (selectedScrapedImages.size === 0) {
      alert('다운로드할 이미지를 선택해주세요.');
      return;
    }

    const selectedImagesData = scrapedImages.filter(img => selectedScrapedImages.has(img.src));
    
    setIsDownloadingImages(true);

    try {
      const response = await fetch('/api/admin/batch-download-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: selectedImagesData,
          options: { prefix: 'webpage' }
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // 성공한 이미지들을 갤러리에 추가
        result.results.success.forEach(image => {
          addToImageGallery(image.supabaseUrl, 'upload', {
            originalUrl: image.originalUrl,
            downloadedAt: image.downloadedAt,
            fileName: image.fileName,
            source: 'webpage-scrape'
          });
        });

        // 전체 이미지 갤러리 새로고침
        loadAllImages();
        
        alert(`✅ ${result.results.success.length}개 이미지가 성공적으로 저장되었습니다!`);
        
        // 선택 상태 초기화
        setSelectedScrapedImages(new Set());
        
      } else {
        const error = await response.json();
        alert(`❌ 이미지 다운로드 실패: ${error.error}`);
      }
    } catch (error) {
      console.error('이미지 다운로드 오류:', error);
      alert('이미지 다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloadingImages(false);
    }
  };

  // 이미지 링크만 제거 함수 (Supabase는 유지, 게시물에서만 제거)
  const removeImageFromPost = (imageName) => {
    // 현재 게시물의 이미지 목록에서만 제거
    setPostImages(prev => prev.filter(img => img.name !== imageName));
    
    // 대표 이미지가 제거된 경우 초기화
    if (formData.featured_image && formData.featured_image.includes(imageName)) {
      setFormData(prev => ({ ...prev, featured_image: '' }));
    }
    
    // 본문에서 제거된 이미지 URL 제거
    if (useWysiwyg) {
      const updatedHtmlContent = htmlContent.replace(new RegExp(`<img[^>]*src="[^"]*${imageName}[^"]*"[^>]*>`, 'g'), '');
      setHtmlContent(updatedHtmlContent);
      const markdownContent = convertHtmlToMarkdown(updatedHtmlContent);
      setFormData(prev => ({ ...prev, content: markdownContent }));
    } else {
      const updatedContent = formData.content.replace(new RegExp(`!\\[.*?\\]\\([^)]*${imageName}[^)]*\\)`, 'g'), '');
      setFormData(prev => ({ ...prev, content: updatedContent }));
    }
    
    alert('이미지가 이 게시물에서 제거되었습니다. (Supabase에는 유지됨)');
  };

  // 블로그 분석 및 AI 사용량은 통합 대시보드에서 확인

  // 네이버 블로그 스크래퍼 상태
  const [naverBlogId, setNaverBlogId] = useState('');
  const [naverPostUrls, setNaverPostUrls] = useState('');
  const [scrapedNaverPosts, setScrapedNaverPosts] = useState([]);
  const [selectedNaverPosts, setSelectedNaverPosts] = useState(new Set());
  const [isScrapingNaver, setIsScrapingNaver] = useState(false);
  const [naverScraperMode, setNaverScraperMode] = useState('urls'); // 'blogId' 또는 'urls'

  // 블로그 분석 및 AI 사용량 함수들은 통합 대시보드로 이동됨

  // 네이버 블로그 스크래핑 함수
  const handleNaverBlogScrape = async () => {
    if (!naverBlogId && !naverPostUrls) {
      alert('블로그 ID 또는 포스트 URL을 입력해주세요.');
      return;
    }

    setIsScrapingNaver(true);
    try {
      const requestBody: any = {
        options: {
          includeImages: true,
          includeContent: true
        }
      };

      if (naverScraperMode === 'blogId' && naverBlogId) {
        requestBody.blogId = naverBlogId;
      } else if (naverScraperMode === 'urls' && naverPostUrls) {
        const urls = (naverPostUrls || '').split('\n').filter(url => url.trim());
        requestBody.postUrls = urls;
      }

      const response = await fetch('/api/admin/naver-blog-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setScrapedNaverPosts(result.posts);
        alert(`✅ ${result.successfulPosts}개 포스트 성공적으로 스크래핑되었습니다.`);
      } else {
        alert(`❌ 스크래핑 실패: ${result.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('네이버 블로그 스크래핑 오류:', error);
      alert('❌ 스크래핑 중 오류가 발생했습니다.');
    } finally {
      setIsScrapingNaver(false);
    }
  };

  // 네이버 포스트 선택/해제
  const handleNaverPostSelect = (postIndex) => {
    const newSelected = new Set(selectedNaverPosts);
    if (newSelected.has(postIndex)) {
      newSelected.delete(postIndex);
    } else {
      newSelected.add(postIndex);
    }
    setSelectedNaverPosts(newSelected);
  };

  // 네이버 포스트 전체 선택/해제
  const handleSelectAllNaverPosts = () => {
    if (selectedNaverPosts.size === scrapedNaverPosts.length) {
      setSelectedNaverPosts(new Set());
    } else {
      setSelectedNaverPosts(new Set(scrapedNaverPosts.map((_, index) => index)));
    }
  };

  // 네이버 포스트 마이그레이션
  const handleNaverPostMigration = async () => {
    if (selectedNaverPosts.size === 0) {
      alert('마이그레이션할 포스트를 선택해주세요.');
      return;
    }

    const selectedPosts = Array.from(selectedNaverPosts).map((index: number) => scrapedNaverPosts[index]);
    
    try {
      for (const post of selectedPosts) {
        // 각 포스트를 블로그 포스트로 변환
        const baseSlug = post.title ? post.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : 'untitled';
        const timestamp = Date.now();
        const uniqueSlug = `${baseSlug}-${timestamp}`;
        
        const blogPost = {
          title: post.title || '제목 없음',
          slug: uniqueSlug,
          excerpt: post.excerpt || '',
          content: post.content || '',
          featured_image: post.images && post.images.length > 0 ? post.images[0] : '',
          category: '고객 후기',
          tags: ['네이버 블로그', '마이그레이션'],
          status: 'draft', // 초안으로 저장
          meta_title: post.title || '',
          meta_description: post.excerpt || '',
          meta_keywords: '네이버 블로그, 마이그레이션',
          view_count: 0,
          is_featured: false,
          is_scheduled: false,
          scheduled_at: null,
          author: '마쓰구골프',
          published_at: new Date().toISOString() // 작성일은 현재 시간으로 설정
        };

        // 블로그 포스트 생성 API 호출
        const response = await fetch('/api/admin/blog', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(blogPost)
        });

        if (!response.ok) {
          throw new Error(`포스트 생성 실패: ${response.status}`);
        }

        const result = await response.json();
        console.log('포스트 생성 성공:', result);
        
        // 첫 번째 포스트의 수정 페이지로 이동
        if (selectedPosts.indexOf(post) === 0) {
          // 편집 모드로 직접 전환
          console.log('편집 모드로 전환, 포스트 데이터:', result);
          const postData = result.post || result; // result.post 또는 result 직접 사용
          setEditingPost(postData);
          
          const newFormData = {
            title: postData.title || '',
            slug: postData.slug || '',
            excerpt: postData.excerpt || '',
            content: postData.content || '',
            featured_image: postData.featuredImage ? postData.featuredImage.src : (postData.featured_image || ''),
            category: postData.category || '고객 후기',
            tags: postData.tags || [],
            status: postData.status || 'draft',
            meta_title: postData.meta_title || '',
            meta_description: postData.meta_description || '',
            meta_keywords: postData.meta_keywords || '',
            view_count: postData.view_count || 0,
            is_featured: postData.is_featured || false,
            is_scheduled: postData.is_scheduled || false,
            scheduled_at: postData.scheduled_at || null,
            author: postData.author || '마쓰구골프'
          };
          
          console.log('새 폼 데이터:', newFormData);
          setFormData(newFormData);
          
          // 네이버 블로그에서 가져온 이미지들을 이미지 갤러리에 추가
          if (post.images && post.images.length > 0) {
            console.log('🖼️ 네이버 블로그 이미지들을 갤러리에 추가:', post.images);
            setPostImages(prevImages => {
              const newImages = post.images.filter(img => 
                !prevImages.some(existingImg => existingImg.src === img.src)
              );
              return [...prevImages, ...newImages];
            });
          }
          
          // 네이버 블로그 마이그레이션 시에는 textarea 모드로 강제 전환 (성능 최적화)
          console.log('📝 네이버 블로그 마이그레이션: textarea 모드로 강제 전환');
          setUseWysiwyg(false);
          
          setShowForm(true);
          setActiveTab('create');
        }
      }

      alert(`✅ ${selectedPosts.length}개 포스트가 초안으로 마이그레이션되었습니다. 수정 페이지로 이동합니다.`);
      
      // 선택 초기화
      setSelectedNaverPosts(new Set());
      
      // 블로그 목록 새로고침
      fetchPosts();

    } catch (error) {
      console.error('마이그레이션 오류:', error);
      alert('❌ 마이그레이션 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 이미지 사용 현황 조회
  const loadImageUsageInfo = async (imageUrl) => {
    setIsLoadingUsageInfo(true);
    try {
      const response = await fetch(`/api/admin/image-usage-tracker?imageUrl=${encodeURIComponent(imageUrl)}`);
      if (response.ok) {
        const data = await response.json();
        setImageUsageInfo(data);
      } else {
        console.error('이미지 사용 현황 조회 실패');
        setImageUsageInfo(null);
      }
    } catch (error) {
      console.error('이미지 사용 현황 조회 오류:', error);
      setImageUsageInfo(null);
    } finally {
      setIsLoadingUsageInfo(false);
    }
  };


  // 중복 이미지 삭제
  const deleteDuplicateImages = async (imageNames) => {
    if (!imageNames || imageNames.length === 0) {
      alert('삭제할 이미지를 선택해주세요.');
      return;
    }

    if (!confirm(`선택한 ${imageNames.length}개의 중복 이미지를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/find-duplicates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageNames })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ 중복 이미지 삭제 성공:', data.deletedImages?.length || 0, '개');
        alert(`${data.deletedImages?.length || 0}개의 중복 이미지가 삭제되었습니다.`);
        
        // 중복 이미지 목록 새로고침
        await findDuplicateImages();
        // 전체 이미지 목록도 새로고침
        await loadAllImages(allImagesPagination.currentPage);
      } else {
        console.error('❌ 중복 이미지 삭제 실패:', data.error);
        alert('중복 이미지 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 중복 이미지 삭제 에러:', error);
      alert('중복 이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 이미지 삽입 (새로운 함수)
  const insertImageToContentNew = (imageUrl, altText = '이미지') => {
    if (useWysiwyg) {
      // WYSIWYG 에디터에 이미지 삽입
      const imageHtml = `<img src="${imageUrl}" alt="${altText}" style="max-width: 100%; height: auto;" />`;
      const newHtmlContent = htmlContent + imageHtml;
      setHtmlContent(newHtmlContent);
      
      // HTML을 마크다운으로 변환하여 formData에 저장
      const markdownContent = convertHtmlToMarkdown(newHtmlContent);
      setFormData(prev => ({
        ...prev,
        content: markdownContent
      }));
    } else {
      // 기존 마크다운 방식
      const imageMarkdown = `![${altText}](${imageUrl})`;
      const textarea = document.querySelector('textarea[name="content"]') as HTMLTextAreaElement;
      const cursorPosition = textarea?.selectionStart || 0;
      const content = formData.content;
      const newContent = content.slice(0, cursorPosition) + imageMarkdown + content.slice(cursorPosition);
      
      setFormData(prev => ({
        ...prev,
        content: newContent
      }));
    }
  };

  // 대표이미지 설정
  const setFeaturedImage = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      featured_image: imageUrl
    }));
    alert('대표이미지가 설정되었습니다!');
  };

  // 이미지 삭제 (게시물 이미지 갤러리용) - Supabase에서 완전 삭제
  const deleteImageByName = async (imageName) => {
    if (!confirm(`정말로 "${imageName}" 이미지를 Supabase에서 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageName })
      });
      
      if (response.ok) {
        alert('이미지가 Supabase에서 완전히 삭제되었습니다!');
        
        // 로컬 상태에서도 제거
        setPostImages(prev => prev.filter(img => img.name !== imageName));
        
        // 전체 이미지 갤러리에서도 제거 (실시간 동기화)
        setAllImages(prev => prev.filter(img => img.name !== imageName));
        
        // 삭제된 이미지의 URL을 찾아서 본문에서도 제거
        const deletedImage = postImages.find(img => img.name === imageName);
        if (deletedImage) {
          // 본문에서 해당 이미지 URL을 포함한 마크다운 라인 제거
          const imageUrl = deletedImage.url;
          const imageMarkdownRegex = new RegExp(`!\\[.*?\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
          
          setFormData(prev => ({
            ...prev,
            content: prev.content.replace(imageMarkdownRegex, '').replace(/\n\n\n+/g, '\n\n') // 연속된 빈 줄 정리
          }));
          
          // 대표 이미지로 설정되어 있다면 제거
          if (formData.featured_image === imageUrl) {
            setFormData(prev => ({
              ...prev,
              featured_image: ''
            }));
          }
        }
        
        console.log('✅ 이미지 삭제 성공:', imageName);
        alert('이미지가 삭제되었습니다.');
      } else {
        const error = await response.json();
        alert('이미지 삭제 실패: ' + error.error);
      }
    } catch (error) {
      console.error('❌ 이미지 삭제 에러:', error);
      alert('이미지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 제목에서 슬러그 자동 생성
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // AI 슬러그 생성
  const generateAISlug = async () => {
    console.log('🔗 AI 슬러그 생성 버튼 클릭됨');
    
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    console.log('📝 제목:', formData.title);

    try {
      console.log('🌐 API 호출 시작...');
      const response = await fetch('/api/generate-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formData.title })
      });

      console.log('📡 API 응답 상태:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API 응답 데이터:', result);
        
        const { slug } = result;
        setFormData({
          ...formData,
          slug
        });
        console.log('✅ 슬러그 업데이트 완료:', slug);
      } else {
        const errorText = await response.text();
        console.error('❌ AI 슬러그 생성 실패:', response.status, errorText);
        alert(`AI 슬러그 생성 실패: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ AI 슬러그 생성 에러:', error);
      alert(`AI 슬러그 생성 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  // 콘텐츠 유형 변경 함수
  const handleContentTypeChange = (contentType) => {
    setBrandStrategy({...brandStrategy, contentType});
  };


  // AI 이미지 생성 (단일 이미지)
  const generateAIImage = async () => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('🎨 AI 이미지 생성 시작...');
      setIsGeneratingImages(true);
      
      const response = await fetch('/api/generate-blog-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: brandStrategy.contentType,
          brandStrategy: brandStrategy,
          imageCount: 1
        })
      });

      if (response.ok) {
        const { imageUrl, prompt, metadata } = await response.json();
        
        // 생성된 이미지를 대표 이미지로 설정
        setFormData({ ...formData, featured_image: imageUrl });
        
        // 이미지 갤러리에 추가
        addToImageGallery(imageUrl, 'ai-generated', {
          model: 'DALL-E 3',
          prompt: imageGenerationPrompt,
          generatedAt: new Date().toISOString()
        });
        
        console.log('✅ AI 이미지 생성 완료:', imageUrl);
        alert('AI 이미지가 생성되어 대표 이미지로 설정되었습니다!');
      } else {
        const error = await response.json();
        console.error('AI 이미지 생성 실패:', error);
        alert('AI 이미지 생성에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('AI 이미지 생성 에러:', error);
      alert('AI 이미지 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // ChatGPT 프롬프트로 DALL-E 3 이미지 생성
  const generateMultipleAIImages = async (count = 4) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('🎨 ChatGPT + DALL-E 3 이미지 생성 시작...', count, '개');
      setIsGeneratingImages(true);
      setShowGenerationProcess(true);
      setImageGenerationModel('ChatGPT + DALL-E 3');
      
      // 1단계: ChatGPT로 스마트 프롬프트 생성
      setImageGenerationStep('1단계: ChatGPT로 스마트 프롬프트 생성 중...');
      const promptResponse = await fetch('/api/generate-smart-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: brandStrategy.contentType,
          brandStrategy: brandStrategy,
          model: 'dalle3'
        })
      });

      if (!promptResponse.ok) {
        throw new Error('ChatGPT 프롬프트 생성 실패');
      }

      const { prompt: smartPrompt } = await promptResponse.json();
      setImageGenerationPrompt(smartPrompt);
      
      // 2단계: DALL-E 3로 이미지 생성
      setImageGenerationStep('2단계: DALL-E 3로 이미지 생성 중...');
      const response = await fetch('/api/generate-blog-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: brandStrategy.contentType,
          brandStrategy: brandStrategy,
          imageCount: count,
          customPrompt: smartPrompt // ChatGPT로 생성한 프롬프트 사용
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
        
        // 저장된 이미지들을 상태에 저장
        setGeneratedImages(savedImages);
        setShowGeneratedImages(true);
        
        // 저장된 모든 이미지를 갤러리에 추가
        savedImages.forEach((imageUrl, index) => {
          addToImageGallery(imageUrl, 'ai-generated', {
            model: 'DALL-E 3',
            prompt: imageGenerationPrompt,
            batchIndex: index,
            generatedAt: new Date().toISOString()
          });
        });
        
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

  // 단락별 이미지 생성
  const generateParagraphImages = async () => {
    if (!formData.content) {
      alert('내용을 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingParagraphImages(true);
    setShowGenerationProcess(true);
    setImageGenerationStep('내용을 분석하고 단락별 이미지를 생성하고 있습니다...');
    setImageGenerationModel('DALL-E 3');

    try {
      const response = await fetch('/api/generate-paragraph-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content,
          contentType: brandStrategy.contentType,
          brandStrategy: {
            customerPersona: brandStrategy.customerPersona,
            customerChannel: brandStrategy.customerChannel,
            brandWeight: brandStrategy.brandWeight
          }
        })
      });

      if (!response.ok) {
        throw new Error('단락별 이미지 생성에 실패했습니다.');
      }

            const data = await response.json();
            setParagraphImages(data.paragraphImages);
            setShowParagraphImages(true);
            setImageGenerationStep(`${data.paragraphImages.length}개의 단락별 이미지가 생성되었습니다!`);
            
            // 단락별 이미지들을 갤러리에 추가
            data.paragraphImages.forEach((item, index) => {
              addToImageGallery(item.imageUrl, 'paragraph', {
                paragraphIndex: item.paragraphIndex,
                paragraph: item.paragraph,
                prompt: item.prompt,
                generatedAt: new Date().toISOString()
              });
            });

    } catch (error) {
      console.error('단락별 이미지 생성 오류:', error);
      alert(`단락별 이미지 생성에 실패했습니다: ${error.message}`);
    } finally {
      setIsGeneratingParagraphImages(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
        setImageGenerationPrompt('');
        setImageGenerationModel('');
      }, 3000);
    }
  };

  // 생성된 이미지 선택
  const selectGeneratedImage = (imageUrl) => {
    setFormData({ ...formData, featured_image: imageUrl });
    setShowGeneratedImages(false);
    alert('선택한 이미지가 대표 이미지로 설정되었습니다!');
  };

  // 이미지 URL 복사
  const copyImageUrl = async (imageUrl) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      alert('이미지 URL이 클립보드에 복사되었습니다!');
    } catch (error) {
      console.error('복사 실패:', error);
      alert('복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  };

  // 이미지를 내용에 삽입 (기존 함수 - 하위 호환성 유지)
  const insertImageToContentLegacy = (imageUrl) => {
    if (useWysiwyg) {
      // WYSIWYG 에디터에 이미지 삽입
      const imageHtml = `<p><img src="${imageUrl}" alt="이미지" style="max-width: 100%; height: auto;" /></p>`;
      const newHtmlContent = htmlContent + imageHtml;
      setHtmlContent(newHtmlContent);
      
      // HTML을 마크다운으로 변환하여 formData에 저장
      const markdownContent = convertHtmlToMarkdown(newHtmlContent);
      setFormData(prev => ({
        ...prev,
        content: markdownContent
      }));
    } else {
      // 기존 마크다운 방식
      const imageMarkdown = `\n\n![이미지](${imageUrl})\n\n`;
      setFormData({ 
        ...formData, 
        content: formData.content + imageMarkdown 
      });
    }
    alert('이미지가 내용에 삽입되었습니다! WYSIWYG 에디터에서 미리보기를 확인하세요.');
  };

  // Base64 이미지를 서버에 업로드하고 URL로 변환
  const convertBase64ToUrl = async (base64Data) => {
    try {
      // Base64 데이터에서 MIME 타입과 데이터 추출
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('유효하지 않은 Base64 데이터입니다.');
      }
      
      const mimeType = matches[1];
      const base64String = matches[2];
      
      // MIME 타입에서 파일 확장자 추출
      const extension = (mimeType || '').split('/')[1] || 'jpg';
      
      // Base64를 Blob으로 변환
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // FormData 생성
      const uploadFormData = new FormData();
      uploadFormData.append('image', blob, `image.${extension}`);
      
      // 서버에 업로드
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: uploadFormData,
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.imageUrl;
      } else {
        throw new Error('업로드 실패');
      }
    } catch (error) {
      console.error('Base64 변환 오류:', error);
      throw error;
    }
  };

  // 내용에서 Base64 이미지를 URL로 변환
  const convertBase64ImagesInContent = async () => {
    const content = formData.content;
    const base64Regex = /!\[([^\]]*)\]\(data:image\/[^;]+;base64,[^)]+\)/g;
    const matches = content.match(base64Regex);
    
    if (!matches || matches.length === 0) {
      alert('변환할 Base64 이미지가 없습니다.');
      return;
    }
    
    try {
      let newContent = content;
      
      for (const match of matches) {
        const base64Match = match.match(/!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/);
        if (base64Match) {
          const altText = base64Match[1];
          const base64Data = base64Match[2];
          
          const imageUrl = await convertBase64ToUrl(base64Data);
          const newImageMarkdown = `![${altText}](${imageUrl})`;
          newContent = newContent.replace(match, newImageMarkdown);
        }
      }
      
      setFormData({ ...formData, content: newContent });
      alert(`${matches.length}개의 Base64 이미지가 URL로 변환되었습니다!`);
    } catch (error) {
      console.error('Base64 변환 오류:', error);
      alert('Base64 이미지 변환에 실패했습니다.');
    }
  };

  // 대표이미지를 본문에 삽입 (위치 선택)
  const insertFeaturedImageToContent = (position = 'middle') => {
    if (!formData.featured_image) {
      alert('대표이미지가 없습니다.');
      return;
    }

    const imageMarkdown = `\n\n![대표이미지](${formData.featured_image})\n\n`;
    
    const content = formData.content;
    const lines = (content || '').split('\n');
    let insertPosition = 0;
    
    switch (position) {
      case 'start': // 맨 앞
        insertPosition = 0;
        break;
      case 'middle': // 중간
        insertPosition = lines.length > 4 ? Math.floor(lines.length / 2) : 0;
        break;
      case 'end': // 맨 뒤
        insertPosition = lines.length;
        break;
    }
    
    // 선택된 위치에 이미지 삽입
    lines.splice(insertPosition, 0, imageMarkdown.trim());
    const newContent = lines.join('\n');
    
    setFormData({ ...formData, content: newContent });
    
    const positionText = { start: '맨 앞', middle: '중간', end: '맨 뒤' }[position];
    alert(`대표이미지가 본문 ${positionText}에 삽입되었습니다!`);
  };

  // 이미지 갤러리에 이미지 추가
  const addToImageGallery = useCallback((imageUrl, type = 'upload', metadata = {}) => {
    const newImage = {
      id: Date.now() + Math.random(),
      url: imageUrl,
      type: type, // 'upload', 'ai-generated', 'paragraph', 'featured'
      metadata: metadata,
      addedAt: new Date().toISOString()
    };
    
    setImageGallery(prev => [newImage, ...prev]);
    return newImage;
  }, [setImageGallery]);

  // 이미지 갤러리에서 이미지 제거
  const removeFromImageGallery = (imageId) => {
    setImageGallery(prev => prev.filter(img => img.id !== imageId));
  };

  // 이미지를 대표이미지로 설정
  const setAsFeaturedImage = (imageUrl) => {
    setFormData({ ...formData, featured_image: imageUrl });
    alert('선택한 이미지가 대표이미지로 설정되었습니다!');
  };

  // 이미지를 본문에 삽입 (위치 선택)
  const insertImageToContent = (imageUrl, position = 'middle') => {
    if (useWysiwyg) {
      // WYSIWYG 에디터에 이미지 삽입
      const imageHtml = `<p><img src="${imageUrl}" alt="이미지" style="max-width: 100%; height: auto;" /></p>`;
      let newHtmlContent = htmlContent;
      
      if (position === 'start') {
        newHtmlContent = imageHtml + htmlContent;
      } else if (position === 'end') {
        newHtmlContent = htmlContent + imageHtml;
      } else { // middle
        newHtmlContent = htmlContent + imageHtml;
      }
      
      setHtmlContent(newHtmlContent);
      
      // HTML을 마크다운으로 변환하여 formData에 저장
      const markdownContent = convertHtmlToMarkdown(newHtmlContent);
      setFormData(prev => ({
        ...prev,
        content: markdownContent
      }));
    } else {
      // 기존 마크다운 방식
      const imageMarkdown = `\n\n![이미지](${imageUrl})\n\n`;
      
      const content = formData.content;
      const lines = (content || '').split('\n');
      let insertPosition = 0;
      
      switch (position) {
        case 'start': // 맨 앞
          insertPosition = 0;
          break;
        case 'middle': // 중간
          insertPosition = lines.length > 4 ? Math.floor(lines.length / 2) : 0;
          break;
        case 'end': // 맨 뒤
          insertPosition = lines.length;
          break;
      }
      
      // 선택된 위치에 이미지 삽입
      lines.splice(insertPosition, 0, imageMarkdown.trim());
      const newContent = lines.join('\n');
      
      setFormData({ ...formData, content: newContent });
    }
    
    const positionText = { start: '맨 앞', middle: '중간', end: '맨 뒤' }[position];
    alert(`이미지가 본문 ${positionText}에 삽입되었습니다!`);
  };

  // AI 제목 생성
  const generateAITitle = async () => {
    if (!contentSource.trim()) {
      alert('콘텐츠 소스와 글감을 먼저 입력해주세요.');
      return;
    }

    setIsGeneratingTitle(true);
    
    try {
      const response = await fetch('/api/generate-blog-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentSource: contentSource,
          contentType: brandStrategy.contentType,
          customerPersona: brandStrategy.customerPersona,
          customerChannel: brandStrategy.customerChannel,
          brandWeight: brandStrategy.brandWeight
        })
      });

      if (!response.ok) {
        throw new Error('제목 생성에 실패했습니다.');
      }

      const data = await response.json();
      setGeneratedTitles(data.titles);
      setShowTitleOptions(true);
      
      console.log('✅ AI 제목 생성 완료:', data.titles.length, '개');
      alert(`${data.titles.length}개의 SEO 최적화된 제목이 생성되었습니다!`);
    } catch (error) {
      console.error('AI 제목 생성 오류:', error);
      alert(`AI 제목 생성에 실패했습니다: ${error.message}`);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // 생성된 제목 선택
  const selectGeneratedTitle = (title) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title),
      meta_title: title
    });
    setShowTitleOptions(false);
    alert('선택한 제목이 적용되었습니다!');
  };

  // 고급 콘텐츠 분석 함수
  const analyzeContentAdvanced = async () => {
    if (!formData.title && !formData.content) {
      alert('제목이나 내용을 먼저 입력해주세요.');
      return;
    }

    setIsAnalyzingContent(true);
    setContentAnalysisResult(null);
    setShowAnalysisResult(false);

    try {
      console.log('🤖 고급 콘텐츠 분석 시작...');
      
      // AI 콘텐츠 분석 API 호출
      const analysisResponse = await fetch('/api/ai-content-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          content: formData.content
        })
      });

      if (!analysisResponse.ok) {
        throw new Error('콘텐츠 분석에 실패했습니다.');
      }

      const analysis = await analysisResponse.json();
      setContentAnalysisResult(analysis);
      setShowAnalysisResult(true);
      
      console.log('✅ 고급 콘텐츠 분석 완료:', analysis);
      
      // 분석 결과에 따라 브랜드 전략 자동 업데이트
      if (analysis.category && analysis.category !== 'general') {
        const categoryMap = {
          'golf': '골프 정보',
          'restaurant': '식당/음식',
          'travel': '여행/휴양',
          'shopping': '쇼핑/제품',
          'lifestyle': '라이프스타일',
          'business': '비즈니스',
          'technology': '기술',
          'education': '교육',
          'health': '건강',
          'entertainment': '엔터테인먼트'
        };
        
        const newContentType = categoryMap[analysis.category] || '일반';
        setBrandStrategy(prev => ({
          ...prev,
          contentType: newContentType
        }));
        
        console.log('🎯 콘텐츠 타입 자동 업데이트:', newContentType);
      }
      
    } catch (error) {
      console.error('❌ 고급 콘텐츠 분석 오류:', error);
      alert(`고급 콘텐츠 분석에 실패했습니다: ${error.message}`);
    } finally {
      setIsAnalyzingContent(false);
    }
  };


  // ChatGPT로 스마트 프롬프트 미리보기
  const previewImagePrompt = async (model = 'dalle3') => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('🤖 ChatGPT로 스마트 프롬프트 생성 중...');
      const response = await fetch('/api/generate-smart-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: brandStrategy.contentType,
          brandStrategy: brandStrategy,
          model: model
        })
      });

      if (response.ok) {
        const { prompt } = await response.json();
        setPreviewPrompt(prompt);
        setShowPromptPreview(true);
        console.log('✅ ChatGPT 프롬프트 생성 완료');
      } else {
        const error = await response.json();
        alert('ChatGPT 프롬프트 생성에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('ChatGPT 프롬프트 생성 에러:', error);
      alert('ChatGPT 프롬프트 생성 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 이미지 변형 함수
  const generateImageVariation = async (model) => {
    if (!selectedBaseImage) {
      alert('변형할 기본 이미지를 먼저 선택해주세요.');
      return;
    }

    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log(`🎨 ${model} 이미지 변형 시작...`);
      setIsGeneratingVariation(true);
      setShowGenerationProcess(true);
      setImageGenerationModel(`${model} 이미지 변형`);
      setImageGenerationStep(`1단계: ${model} 서버에 이미지 변형 요청 중...`);

      let apiEndpoint = '';
      switch (model) {
        case 'fal':
          apiEndpoint = '/api/generate-blog-image-fal-variation';
          break;
        case 'replicate':
          apiEndpoint = '/api/generate-blog-image-replicate-flux';
          break;
        case 'stability':
          apiEndpoint = '/api/generate-blog-image-stability';
          break;
        default:
          throw new Error('지원하지 않는 변형 모델입니다.');
      }

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt || formData.content?.substring(0, 500),
          content: formData.content,
          contentType: formData.category,
          brandStrategy: '마쓰구 골프 드라이버 전문 브랜드',
          baseImageUrl: selectedBaseImage,
          variationStrength: variationStrength,
          variationCount: 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${model} 이미지 변형 완료:`, result.images.length, '개');
        setImageGenerationStep(`3단계: ${model} 이미지 변형 완료!`);
        
        // 생성된 이미지를 generatedImages에 추가 (URL 문자열 배열로 저장)
        if (result.images && result.images.length > 0) {
          const newImageUrls = result.images.map(img => img.publicUrl);
          setGeneratedImages(prev => [...prev, ...newImageUrls]);
          
          // 프롬프트 저장 (다른 기능들과 동일한 방식)
          if (result.prompt) {
            const promptId = `variation-${Date.now()}`;
            const newPrompt = {
              id: promptId,
              model: `${model} 이미지 변형`,
              prompt: result.prompt,
              koreanPrompt: `이미지 변형: ${model} 모델로 변형 강도 ${variationStrength}`,
              createdAt: new Date().toISOString(),
              imageCount: result.images.length,
              variationStrength: variationStrength,
              baseImage: selectedBaseImage
            };
            setSavedPrompts(prev => [newPrompt, ...prev]);
            console.log('✅ 이미지 변형 프롬프트 저장 완료:', newPrompt);
          }
        }
        
        alert(`${model} 이미지 변형이 완료되었습니다: ${result.message}`);
      } else {
        const error = await response.json();
        console.error(`${model} 이미지 변형 실패:`, error);
        setImageGenerationStep(`❌ ${model} 이미지 변형 실패`);
        alert(`${model} 이미지 변형에 실패했습니다: ${error.message}`);
      }
    } catch (error) {
      console.error(`${model} 이미지 변형 에러:`, error);
      setImageGenerationStep(`❌ ${model} 이미지 변형 에러`);
      alert(`${model} 이미지 변형 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setIsGeneratingVariation(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
        setImageGenerationPrompt('');
      }, 3000);
    }
  };

  // ChatGPT 프롬프트로 Kie AI 이미지 생성
  const generateKieAIImages = async (count = 4) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('📸 ChatGPT + Kie AI 이미지 생성 시작...', count, '개');
      setIsGeneratingImages(true);
      setShowGenerationProcess(true);
      setImageGenerationModel('ChatGPT + Kie AI');
      
      // 1단계: ChatGPT로 스마트 프롬프트 생성
      setImageGenerationStep('1단계: ChatGPT로 프롬프트 생성 중...');
      const promptResponse = await fetch('/api/generate-smart-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: brandStrategy.contentType,
          brandStrategy: brandStrategy,
          model: 'kie'
        })
      });

      if (!promptResponse.ok) {
        throw new Error('ChatGPT 프롬프트 생성 실패');
      }

      const { prompt: smartPrompt } = await promptResponse.json();
      setImageGenerationPrompt(smartPrompt);
      
      // 2단계: Kie AI API 호출
      setImageGenerationStep('2단계: Kie AI 서버에 이미지 생성 요청 중...');
      const response = await fetch('/api/generate-blog-image-kie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: brandStrategy.contentType,
          brandStrategy: brandStrategy,
          imageCount: count,
          customPrompt: smartPrompt
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.status === 'processing') {
          // 웹훅 방식으로 처리 중인 경우
          setImageGenerationStep('3단계: Kie AI 이미지 생성 중... (웹훅 대기)');
          alert('Kie AI 이미지 생성이 시작되었습니다. 완료되면 자동으로 알림을 받을 수 있습니다.');
          
          // 웹훅 결과를 기다리는 동안 폴링 (선택사항)
          setTimeout(() => {
            setImageGenerationStep('⏳ 이미지 생성이 완료될 때까지 잠시 기다려주세요...');
          }, 5000);
          
        } else if (result.imageUrls) {
          // 즉시 이미지가 생성된 경우
          setImageGenerationStep('3단계: Kie AI 이미지 생성 완료!');
          
          // 생성된 이미지들을 상태에 추가
          const newImages = result.imageUrls.map((url, index) => ({
            id: `kie-${Date.now()}-${index}`,
            url: url,
            alt: `${formData.title} - Kie AI 생성 이미지 ${index + 1}`,
            fileName: `kie-generated-${Date.now()}-${index}.jpg`,
            fileExtension: 'jpg',
            isNaverImage: false,
            isGenerated: true,
            generatedBy: 'Kie AI',
            batchIndex: index,
            generatedAt: new Date().toISOString()
          }));
          
          setGeneratedImages(prev => [...prev, ...newImages]);
          console.log('✅ ChatGPT + Kie AI 이미지 생성 완료:', result.imageUrls.length, '개');
          alert(`${result.imageUrls.length}개의 ChatGPT + Kie AI 이미지가 생성되었습니다! 원하는 이미지를 선택하세요.`);
        } else {
          // 기타 성공 응답
          setImageGenerationStep('3단계: Kie AI 이미지 생성 완료!');
          alert('Kie AI 이미지 생성이 완료되었습니다: ' + result.message);
        }
      } else {
        const error = await response.json();
        console.error('Kie AI 이미지 생성 실패:', error);
        setImageGenerationStep('❌ Kie AI 이미지 생성 실패');
        alert('Kie AI 이미지 생성에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('ChatGPT + Kie AI 이미지 생성 에러:', error);
      setImageGenerationStep('❌ Kie AI 이미지 생성 에러');
      alert('Kie AI 이미지 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // ChatGPT 프롬프트로 구글 이미지 생성
  const generateGoogleImages = async (count = 4) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('📸 ChatGPT + Google AI 이미지 생성 시작...', count, '개');
      setIsGeneratingImages(true);
      setShowGenerationProcess(true);
      setImageGenerationModel('ChatGPT + Google AI');
      
      // 1단계: ChatGPT로 스마트 프롬프트 생성
      setImageGenerationStep('1단계: ChatGPT로 프롬프트 생성 중...');
      const promptResponse = await fetch('/api/generate-smart-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: brandStrategy.contentType,
          brandStrategy: brandStrategy,
          model: 'google'
        })
      });

      if (!promptResponse.ok) {
        throw new Error('ChatGPT 프롬프트 생성 실패');
      }

      const { prompt: smartPrompt } = await promptResponse.json();
      setImageGenerationPrompt(smartPrompt);
      
      // 2단계: 구글 AI API 호출
      setImageGenerationStep('2단계: Google AI 서버에 이미지 생성 요청 중...');
      const response = await fetch('/api/generate-blog-image-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: brandStrategy.contentType,
          brandStrategy: brandStrategy,
          imageCount: count,
          customPrompt: smartPrompt
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.imageUrls && result.imageUrls.length > 0) {
          // 즉시 이미지가 생성된 경우
          setImageGenerationStep('3단계: Google AI 이미지 생성 완료!');
          
          // 생성된 이미지들을 상태에 추가 (FAL AI 방식과 동일하게 문자열 배열로 저장)
          setGeneratedImages(prev => [...prev, ...result.imageUrls]);
          
          // 3단계: 생성된 이미지를 Supabase에 저장
          setImageGenerationStep('3단계: 이미지를 Supabase에 저장 중...');
          const savedImages = [];
          
          for (let i = 0; i < result.imageUrls.length; i++) {
            try {
              const saveResponse = await fetch('/api/save-generated-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: result.imageUrls[i],
                  fileName: `google-ai-${Date.now()}-${i + 1}.png`,
                  blogPostId: editingPost?.id || null
                })
              });
              
              if (saveResponse.ok) {
                const saveData = await saveResponse.json();
                savedImages.push(saveData.publicUrl);
                console.log(`✅ Google AI 이미지 ${i + 1} Supabase 저장 완료:`, saveData.publicUrl);
              } else {
                console.error(`❌ Google AI 이미지 ${i + 1} Supabase 저장 실패`);
                savedImages.push(result.imageUrls[i]); // 실패 시 원본 URL 사용
              }
            } catch (error) {
              console.error(`❌ Google AI 이미지 ${i + 1} 저장 오류:`, error);
              savedImages.push(result.imageUrls[i]); // 오류 시 원본 URL 사용
            }
          }
          
          // 저장된 이미지 URL로 상태 업데이트 (FAL AI 방식과 동일하게 문자열 배열로 저장)
          if (savedImages.length > 0) {
            setGeneratedImages(prev => [...prev, ...savedImages]);
          }
          
          // Google AI 프롬프트를 저장된 프롬프트에 추가
          const promptId = `google-${Date.now()}`;
          const newPrompt = {
            id: promptId,
            model: 'Google AI (imagen-4.0)',
            prompt: smartPrompt,
            koreanPrompt: `한국 골프장 실사 이미지: ${formData.title}`,
            createdAt: new Date().toISOString(),
            imageCount: count
          };
          setSavedPrompts(prev => [newPrompt, ...prev]);
          setExpandedPromptId(promptId); // 새로 추가된 프롬프트를 자동으로 펼침
          
          setImageGenerationStep('3단계: Google AI 이미지 생성 및 저장 완료!');
          console.log('✅ ChatGPT + Google AI 이미지 생성 및 Supabase 저장 완료:', savedImages.length, '개');
          alert(`${savedImages.length}개의 ChatGPT + Google AI 이미지가 생성되고 Supabase에 저장되었습니다! 원하는 이미지를 선택하세요.`);
        } else {
          // 기타 성공 응답
          setImageGenerationStep('3단계: Google AI 이미지 생성 완료!');
          alert('Google AI 이미지 생성이 완료되었습니다: ' + result.message);
        }
      } else {
        const error = await response.json();
        console.error('Google AI 이미지 생성 실패:', error);
        setImageGenerationStep('❌ Google AI 이미지 생성 실패');
        alert('Google AI 이미지 생성에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('ChatGPT + Google AI 이미지 생성 에러:', error);
      setImageGenerationStep('❌ Google AI 이미지 생성 에러');
      alert('Google AI 이미지 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsGeneratingImages(false);
    }
  };

  // ChatGPT 프롬프트로 FAL AI 이미지 생성
  const generateFALAIImages = async (count = 4, includeAdCopy = false) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('📸 동적 프롬프트 + FAL AI 실사 이미지 생성 시작...', count, '개');
      setIsGeneratingImages(true);
      setShowGenerationProcess(true);
      setImageGenerationModel('동적 프롬프트 + FAL AI (hidream-i1-dev)');
      
      // 1단계: 동적 프롬프트 사용 (ChatGPT 프롬프트 비활성화)
      setImageGenerationStep('1단계: 동적 프롬프트로 실사 이미지 생성 중...');
      // ChatGPT 프롬프트 생성 비활성화 - 동적 프롬프트 사용
      const smartPrompt = null; // null로 설정하여 동적 프롬프트 사용
      setImageGenerationPrompt('동적 프롬프트 사용 중...');
      
      // 2단계: FAL AI API 호출
      setImageGenerationStep('2단계: FAL AI 서버에 이미지 생성 요청 중...');
      const response = await fetch('/api/generate-blog-image-fal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt || formData.content?.substring(0, 500), // 요약이 없으면 본문 500자 사용
          content: formData.content, // 전체 본문 내용 추가
          contentType: brandStrategy.contentType,
          brandStrategy: brandStrategy,
          imageCount: count,
          customPrompt: null, // 동적 프롬프트 사용 (ChatGPT 프롬프트 비활성화)
          includeAdCopy: includeAdCopy // 광고 카피 포함 여부
        })
      });

      if (response.ok) {
        const { imageUrls, metadata, prompt } = await response.json();
        
        // 실제 프롬프트 표시 및 저장
        if (prompt) {
          setImageGenerationPrompt(prompt);
          
          // 프롬프트를 저장된 목록에 추가
          const promptId = `fal-${Date.now()}`;
          const newPrompt = {
            id: promptId,
            model: 'FAL AI (hidream-i1-dev)',
            prompt: prompt,
            koreanPrompt: `한국 골프장 실사 이미지: ${formData.title}`,
            createdAt: new Date().toISOString(),
            imageCount: count
          };
          setSavedPrompts(prev => [newPrompt, ...prev]);
          setExpandedPromptId(promptId); // 새로 추가된 프롬프트를 자동으로 펼침
        }
        
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
                fileName: `fal-ai-${Date.now()}-${i + 1}.jpeg`,
                blogPostId: editingPost?.id || null
              })
            });
            
            if (saveResponse.ok) {
              const { storedUrl } = await saveResponse.json();
              savedImages.push(storedUrl);
              console.log(`✅ FAL AI 이미지 ${i + 1} 저장 완료:`, storedUrl);
            } else {
              console.warn(`⚠️ FAL AI 이미지 ${i + 1} 저장 실패, 원본 URL 사용:`, imageUrls[i]);
              savedImages.push(imageUrls[i]);
            }
          } catch (error) {
            console.warn(`⚠️ FAL AI 이미지 ${i + 1} 저장 중 오류:`, error);
            savedImages.push(imageUrls[i]);
          }
        }
        
        // 4단계: 이미지 생성 완료
        setImageGenerationStep('4단계: 초고품질 실사 이미지 생성 및 저장 완료!');
        
        // 저장된 이미지들을 상태에 저장
        setGeneratedImages(savedImages);
        setShowGeneratedImages(true);
        
        // 저장된 모든 이미지를 갤러리에 추가
        savedImages.forEach((imageUrl, index) => {
          addToImageGallery(imageUrl, 'ai-generated', {
            model: 'FAL AI',
            prompt: imageGenerationPrompt,
            batchIndex: index,
            generatedAt: new Date().toISOString()
          });
        });
        
        console.log('✅ ChatGPT + FAL AI 실사 이미지 생성 완료:', imageUrls.length, '개');
        alert(`${imageUrls.length}개의 ChatGPT + FAL AI 실사 이미지가 생성되었습니다! 원하는 이미지를 선택하세요.`);
      } else {
        const error = await response.json();
        console.error('FAL AI 이미지 생성 실패:', error);
        setImageGenerationStep('❌ FAL AI 이미지 생성 실패');
        alert('FAL AI 이미지 생성에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('ChatGPT + FAL AI 이미지 생성 에러:', error);
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

  // AI 콘텐츠 생성 (웹 검색 포함)
  const generateAIContent = async (type) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/generate-enhanced-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          type: type,
          keywords: formData.tags.join(', '),
          contentType: brandStrategy.contentType,
          audienceTemp: brandStrategy.audienceTemp,
          brandWeight: brandStrategy.brandWeight,
          customerChannel: brandStrategy.customerChannel,
          painPoint: brandStrategy.painPoint || null,
          customerPersona: brandStrategy.customerPersona,
          enableWebSearch: true,
          excerpt: formData.excerpt // 요약 내용도 함께 전달
        })
      });

      if (response.ok) {
        const { content, webSearchEnabled, webSearchResults } = await response.json();
        
        if (type === 'excerpt') {
          setFormData({ ...formData, excerpt: content });
        } else if (type === 'content') {
          setFormData({ ...formData, content: content });
        } else if (type === 'meta') {
          // 메타 설명과 키워드를 함께 생성
          const keywords = [
            '골프 드라이버',
            '초고반발 드라이버',
            'MASSGOO',
            '마쓰구',
            '비거리 증가',
            '맞춤 피팅',
            '골프 클럽',
            '드라이버 추천'
          ].join(', ');
          
          setFormData({ 
            ...formData, 
            meta_description: content,
            meta_keywords: keywords
          });
        }
        
        // 웹 검색 결과 알림
        if (webSearchEnabled) {
          console.log('✅ 웹 검색 정보가 포함된 콘텐츠 생성 완료');
        }
      } else {
        console.error('AI 콘텐츠 생성 실패');
        alert('AI 콘텐츠 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('AI 콘텐츠 생성 에러:', error);
      alert('AI 콘텐츠 생성 중 오류가 발생했습니다.');
    }
  };

  // AI 콘텐츠 개선 기능
  const improveAIContent = async (improvementType = 'all') => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    if (!formData.content || formData.content.trim().length < 50) {
      alert('개선할 내용이 충분하지 않습니다. 먼저 기본 내용을 작성해주세요.');
      return;
    }

    try {
      console.log('🔧 AI 콘텐츠 개선 시작...', improvementType);
      
      const response = await fetch('/api/improve-blog-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          currentContent: formData.content,
          currentImages: postImages,
          improvementType: improvementType,
          keywords: formData.tags.join(', '),
          contentType: brandStrategy.contentType,
          audienceTemp: brandStrategy.audienceTemp,
          brandWeight: brandStrategy.brandWeight,
          customerChannel: brandStrategy.customerChannel,
          painPoint: brandStrategy.painPoint || null,
          customerPersona: brandStrategy.customerPersona
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.improvedContent) {
          // WYSIWYG 모드와 마크다운 모드 모두 업데이트
          setFormData(prev => ({ ...prev, content: data.improvedContent }));
          
          // WYSIWYG 모드인 경우 HTML 콘텐츠도 업데이트
          if (useWysiwyg) {
            // 마크다운을 HTML로 변환 (비동기 처리)
            convertMarkdownToHtml(data.improvedContent).then(htmlContent => {
              setHtmlContent(htmlContent);
            }).catch(error => {
              console.error('❌ HTML 변환 실패:', error);
              setHtmlContent(data.improvedContent); // 실패 시 원본 사용
            });
          }
          
          console.log('✅ AI 콘텐츠 개선 완료:', data.originalLength, '→', data.improvedLength, '자');
          console.log('📊 API 사용 정보:', data.usageInfo || '정보 없음');
          
          alert(`AI 콘텐츠 개선이 완료되었습니다!\n\n원본: ${data.originalLength}자 → 개선: ${data.improvedLength}자\n\n${improvementType === 'all' ? '내용과 이미지 배치가 모두 개선되었습니다.' : improvementType === 'content' ? '내용이 개선되었습니다.' : '이미지 배치가 개선되었습니다.'}\n\n${data.usageInfo ? `사용된 모델: ${data.usageInfo.model}\n토큰 사용량: ${data.usageInfo.tokens}\n예상 비용: $${data.usageInfo.cost}` : ''}`);
        } else {
          console.error('AI 콘텐츠 개선 실패: 응답 데이터 없음');
          alert('AI 콘텐츠 개선에 실패했습니다.');
        }
      } else {
        const error = await response.json();
        console.error('AI 콘텐츠 개선 실패:', error);
        alert('AI 콘텐츠 개선에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('AI 콘텐츠 개선 에러:', error);
      alert('AI 콘텐츠 개선 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 간단 AI 개선 기능
  const applySimpleAIImprovement = async () => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    if (!formData.content || formData.content.trim().length < 50) {
      alert('개선할 내용이 충분하지 않습니다. 먼저 기본 내용을 작성해주세요.');
      return;
    }

    if (!simpleAIRequest.trim()) {
      alert('개선 요청사항을 입력해주세요.');
      return;
    }

    try {
      console.log('✨ 간단 AI 개선 시작...', simpleAIRequest);
      
      const response = await fetch('/api/simple-ai-improvement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          currentContent: formData.content,
          improvementRequest: simpleAIRequest,
          keywords: formData.tags.join(', '),
          category: formData.category
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.improvedContent) {
          setFormData(prev => ({
            ...prev,
            content: data.improvedContent
          }));
          
          // HTML 변환
          convertMarkdownToHtml(data.improvedContent).then(htmlContent => {
            setHtmlContent(htmlContent);
          }).catch(error => {
            console.error('❌ HTML 변환 실패:', error);
            setHtmlContent(data.improvedContent);
          });
          
          console.log('✅ 간단 AI 개선 완료:', data.originalLength, '→', data.improvedLength, '자');
          alert(`간단 AI 개선이 완료되었습니다!\n\n원본: ${data.originalLength}자 → 개선: ${data.improvedLength}자\n\n요청사항: ${simpleAIRequest}`);
          
          // 요청사항 초기화
          setSimpleAIRequest('');
        } else {
          console.error('간단 AI 개선 실패: 응답 데이터 없음');
          alert('간단 AI 개선에 실패했습니다.');
        }
      } else {
        const error = await response.json();
        console.error('간단 AI 개선 실패:', error);
        alert('간단 AI 개선에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('간단 AI 개선 에러:', error);
      alert('간단 AI 개선 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 간단 AI 이미지 개선 기능
  const applySimpleAIImageImprovement = async (model = 'fal') => {
    if (!selectedImageForImprovement) {
      alert('개선할 이미지를 먼저 선택해주세요.');
      return;
    }

    if (!simpleAIImageRequest.trim()) {
      alert('이미지 개선 요청사항을 입력해주세요.');
      return;
    }

    try {
      console.log('🎨 간단 AI 이미지 개선 시작...', simpleAIImageRequest);
      setIsImprovingImage(true);
      setShowGenerationProcess(true);
      setImageGenerationModel(`ChatGPT + ${model.toUpperCase()} 이미지 개선`);
      
      // 저장된 프롬프트 찾기 (선택된 이미지와 관련된 프롬프트)
      const relatedPrompt = savedPrompts.find(p => 
        selectedImageForImprovement.includes(p.id.split('-')[1]) || 
        savedPrompts.length > 0 // 임시로 가장 최근 프롬프트 사용
      ) || savedPrompts[0];
      
      // 1단계: ChatGPT 이미지 분석
      setImageGenerationStep(`1단계: ChatGPT가 원본 이미지 분석 중...`);
      setImprovementProcess(
        relatedPrompt 
          ? `저장된 프롬프트와 새로운 요청사항을 조합하여 최적화된 프롬프트를 생성합니다.`
          : 'ChatGPT가 원본 이미지를 분석하고 각 모델에 최적화된 프롬프트를 생성합니다.'
      );
      
      const response = await fetch('/api/simple-ai-image-improvement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: selectedImageForImprovement,
          improvementRequest: simpleAIImageRequest,
          model: model,
          originalPrompt: relatedPrompt?.prompt || null, // 저장된 프롬프트 전달
          originalKoreanPrompt: relatedPrompt?.koreanPrompt || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.improvedImage) {
          // 2단계: AI 모델로 이미지 개선
          setImageGenerationStep(`2단계: ${model.toUpperCase()}로 이미지 개선 중...`);
          setImprovementProcess(`${model.toUpperCase()}가 최적화된 프롬프트로 이미지를 개선하고 있습니다.`);
          
          // 생성된 프롬프트 저장 (아코디언용)
          if (data.generatedPrompts) {
            const promptId = `improvement-${Date.now()}`;
            const improvementPrompt = {
              id: promptId,
              model: `ChatGPT + ${model.toUpperCase()} 이미지 개선`,
              prompt: data.editPrompt,
              koreanPrompt: `이미지 개선: ${simpleAIImageRequest}`,
              imageAnalysis: data.imageAnalysis,
              allPrompts: data.generatedPrompts,
              createdAt: new Date().toISOString(),
              improvementRequest: simpleAIImageRequest,
              originalImage: selectedImageForImprovement
            };
            setSavedPrompts(prev => [improvementPrompt, ...prev]);
            setExpandedPromptId(promptId); // 새로 추가된 프롬프트를 자동으로 펼침
          }
          
          // 개선된 이미지를 generatedImages에 추가 (FAL AI 방식과 동일하게 문자열로 저장)
          setGeneratedImages(prev => [...prev, data.improvedImage.publicUrl]);
          
          // 3단계: 완료
          setImageGenerationStep(`3단계: ChatGPT + ${model.toUpperCase()} 이미지 개선 완료!`);
          setImprovementProcess('이미지 개선이 성공적으로 완료되었습니다!');
          
          console.log('✅ 간단 AI 이미지 개선 완료:', data.model);
          alert(`ChatGPT + ${model.toUpperCase()} 이미지 개선이 완료되었습니다!\n\n모델: ${data.model}\n요청사항: ${simpleAIImageRequest}`);
          
          // 요청사항 초기화
          setSimpleAIImageRequest('');
          setSelectedImageForImprovement('');
        } else {
          console.error('간단 AI 이미지 개선 실패: 응답 데이터 없음');
          setImageGenerationStep(`❌ ${model.toUpperCase()} 이미지 개선 실패`);
          alert('간단 AI 이미지 개선에 실패했습니다.');
        }
      } else {
        const error = await response.json();
        console.error('간단 AI 이미지 개선 실패:', error);
        setImageGenerationStep(`❌ ${model.toUpperCase()} 이미지 개선 실패`);
        const errorMessage = error?.details || error?.error || error?.message || '알 수 없는 오류가 발생했습니다.';
        alert('간단 AI 이미지 개선에 실패했습니다: ' + errorMessage);
      }
    } catch (error) {
      console.error('간단 AI 이미지 개선 에러:', error);
      setImageGenerationStep(`❌ ChatGPT + ${model.toUpperCase()} 이미지 개선 에러`);
      setImprovementProcess('이미지 개선 중 오류가 발생했습니다. 다시 시도해주세요.');
      const errorMessage = error?.message || error?.toString() || '알 수 없는 오류가 발생했습니다.';
      alert('ChatGPT + ' + model.toUpperCase() + ' 이미지 개선 중 오류가 발생했습니다: ' + errorMessage);
    } finally {
      setIsImprovingImage(false);
      setTimeout(() => {
        setShowGenerationProcess(false);
        setImageGenerationStep('');
        setImprovementProcess('');
      }, 3000);
    }
  };

  // 이미지 삭제 함수
  const deleteImage = async (imageUrl, imageType = 'generated') => {
    if (!confirm('이 이미지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      console.log('🗑️ 이미지 삭제 시작...', imageUrl);
      
      // Supabase에서 이미지 삭제
      const response = await fetch('/api/delete-image-supabase', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageUrl: imageUrl
        })
      });

      if (response.ok) {
        // 로컬 상태에서 이미지 제거 (모든 상태에서 제거)
        if (imageType === 'generated') {
          setGeneratedImages(prev => prev.filter(img => img !== imageUrl));
        } else if (imageType === 'scraped') {
          setScrapedImages(prev => prev.filter(img => img.url !== imageUrl));
        }
        
        // postImages에서도 제거 (혹시 모를 경우를 대비)
        setPostImages(prev => prev.filter(img => img.url !== imageUrl));
        
        // allImages에서도 제거
        setAllImages(prev => prev.filter(img => img.url !== imageUrl));
        
        // 선택된 이미지가 삭제된 경우 선택 해제
        if (selectedBaseImage === imageUrl) {
          setSelectedBaseImage('');
        }
        if (selectedImageForImprovement === imageUrl) {
          setSelectedImageForImprovement('');
        }
        
        // 대표 이미지로 설정되어 있다면 제거
        if (formData.featured_image === imageUrl) {
          setFormData(prev => ({
            ...prev,
            featured_image: ''
          }));
        }
        
        // 관련 프롬프트도 함께 삭제 (이미지 URL이 포함된 프롬프트)
        const relatedPrompts = savedPrompts.filter(prompt => 
          prompt.originalImage === imageUrl || 
          prompt.baseImage === imageUrl ||
          (prompt.imageUrls && prompt.imageUrls.includes(imageUrl))
        );
        
        if (relatedPrompts.length > 0) {
          console.log('🗑️ 관련 프롬프트 삭제:', relatedPrompts.length, '개');
          setSavedPrompts(prev => prev.filter(prompt => 
            !relatedPrompts.some(related => related.id === prompt.id)
          ));
          
          // 확장된 프롬프트가 삭제된 경우 상태 초기화
          if (expandedPromptId && relatedPrompts.some(p => p.id === expandedPromptId)) {
            setExpandedPromptId(null);
          }
          if (editingPromptId && relatedPrompts.some(p => p.id === editingPromptId)) {
            setEditingPromptId(null);
            setEditingKoreanPrompt('');
          }
        }
        
        console.log('✅ 이미지 삭제 완료:', imageUrl);
        alert(`이미지가 성공적으로 삭제되었습니다.${relatedPrompts.length > 0 ? `\n관련 프롬프트 ${relatedPrompts.length}개도 함께 삭제되었습니다.` : ''}`);
      } else {
        const error = await response.json();
        console.error('이미지 삭제 실패:', error);
        alert('이미지 삭제에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('이미지 삭제 에러:', error);
      alert('이미지 삭제 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 전체 갤러리에서 이미지 선택 함수
  const selectImageFromGallery = (imageUrl, imageType = 'gallery') => {
    // 이미지 변형용으로 선택
    setSelectedBaseImage(imageUrl);
    
    // 간단 AI 이미지 개선용으로도 선택
    setSelectedImageForImprovement(imageUrl);
    
    console.log('✅ 갤러리에서 이미지 선택:', imageUrl);
    alert('갤러리에서 이미지를 선택했습니다!\n\n- 이미지 변형 시스템에서 사용 가능\n- 간단 AI 이미지 개선에서 사용 가능');
  };

  // 픽사 스토리 생성
  const generatePixarStory = async () => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('🎬 픽사 스토리 생성 시작...');
      
      const response = await fetch('/api/generate-pixar-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          currentContent: formData.content || '',
          category: formData.category,
          keywords: formData.tags.join(', ')
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.storyContent) {
          setFormData(prev => ({
            ...prev,
            content: data.storyContent
          }));
          
          // HTML 변환
          convertMarkdownToHtml(data.storyContent).then(htmlContent => {
            setHtmlContent(htmlContent);
          }).catch(error => {
            console.error('❌ HTML 변환 실패:', error);
            setHtmlContent(data.storyContent);
          });
          
          console.log('✅ 픽사 스토리 생성 완료');
          alert('픽사 스토리가 생성되었습니다!');
        } else {
          console.error('픽사 스토리 생성 실패: 응답 데이터 없음');
          alert('픽사 스토리 생성에 실패했습니다.');
        }
      } else {
        const error = await response.json();
        console.error('픽사 스토리 생성 실패:', error);
        alert('픽사 스토리 생성에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('픽사 스토리 생성 에러:', error);
      alert('픽사 스토리 생성 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 도널드 밀러 StoryBrand "무기가 되는 스토리" 생성
  const generateStoryBrand = async () => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('⚔️ 무기가 되는 스토리 생성 시작...');
      
      const response = await fetch('/api/generate-storybrand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          currentContent: formData.content || '',
          category: formData.category,
          keywords: formData.tags.join(', ')
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.storyContent) {
          setFormData(prev => ({
            ...prev,
            content: data.storyContent
          }));
          
          // HTML 변환
          convertMarkdownToHtml(data.storyContent).then(htmlContent => {
            setHtmlContent(htmlContent);
          }).catch(error => {
            console.error('❌ HTML 변환 실패:', error);
            setHtmlContent(data.storyContent);
          });
          
          console.log('✅ 무기가 되는 스토리 생성 완료');
          alert('무기가 되는 스토리가 생성되었습니다!');
        } else {
          console.error('무기가 되는 스토리 생성 실패: 응답 데이터 없음');
          alert('무기가 되는 스토리 생성에 실패했습니다.');
        }
      } else {
        const error = await response.json();
        console.error('무기가 되는 스토리 생성 실패:', error);
        alert('무기가 되는 스토리 생성에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('무기가 되는 스토리 생성 에러:', error);
      alert('무기가 되는 스토리 생성 중 오류가 발생했습니다: ' + error.message);
    }
  };

  // 고객 여정 스토리 생성
  const generateCustomerJourney = async () => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('🛤️ 고객 여정 스토리 생성 시작...');
      
      const response = await fetch('/api/generate-customer-journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          currentContent: formData.content || '',
          category: formData.category,
          keywords: formData.tags.join(', ')
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.storyContent) {
          setFormData(prev => ({
            ...prev,
            content: data.storyContent
          }));
          
          // HTML 변환
          convertMarkdownToHtml(data.storyContent).then(htmlContent => {
            setHtmlContent(htmlContent);
          }).catch(error => {
            console.error('❌ HTML 변환 실패:', error);
            setHtmlContent(data.storyContent);
          });
          
          console.log('✅ 고객 여정 스토리 생성 완료');
          alert('고객 여정 스토리가 생성되었습니다!');
        } else {
          console.error('고객 여정 스토리 생성 실패: 응답 데이터 없음');
          alert('고객 여정 스토리 생성에 실패했습니다.');
        }
      } else {
        const error = await response.json();
        console.error('고객 여정 스토리 생성 실패:', error);
        alert('고객 여정 스토리 생성에 실패했습니다: ' + error.message);
      }
    } catch (error) {
      console.error('고객 여정 스토리 생성 에러:', error);
      alert('고객 여정 스토리 생성 중 오류가 발생했습니다: ' + error.message);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []); // 초기 로드 시에만 실행

  // 정렬 옵션 변경 시에만 새로고침 (무한 루프 방지)
  useEffect(() => {
    // 초기 로드가 아닌 경우에만 정렬 변경 시 새로고침
    if (posts.length > 0) {
      fetchPosts(sortBy, sortOrder);
    }
  }, [sortBy, sortOrder]); // posts.length, loading, fetchPosts 제거

  return (
    <>
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
              <button
                onClick={() => {
                  setActiveTab('migration');
                  setShowForm(false);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'migration'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔄 블로그 마이그레이션
              </button>
              <button
                onClick={() => {
                  setActiveTab('naver-scraper');
                  setShowForm(false);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'naver-scraper'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔵 네이버 블로그 스크래퍼
              </button>
              <button
                onClick={() => {
                  window.open('/admin/ai-dashboard', '_blank');
                }}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                🤖 AI 관리
              </button>
            </nav>
          </div>

          {/* 탭별 콘텐츠 */}
          
          {/* 탭별 콘텐츠 */}
          {activeTab === 'migration' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  🔄 블로그 마이그레이션
                </h2>
        <p className="text-gray-600 mb-6">
          GPT-4o-mini로 전문적인 콘텐츠 구조화와 고화질 이미지 처리를 통해 강석 블로그 수준의 완벽한 마이그레이션을 제공합니다.
        </p>
                <div className="space-y-4">
                  <div className="max-w-md mx-auto">
                    <input
                      type="url"
                      value={migrationUrl}
                      onChange={(e) => setMigrationUrl(e.target.value)}
                      placeholder="https://www.mas9golf.com/post/..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isMigrating}
                    />
                  </div>
                  <button 
                    onClick={handleMigration}
                    disabled={isMigrating || !migrationUrl}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMigrating ? '마이그레이션 중...' : '마이그레이션 시작'}
                  </button>
                  
                  {migrationStatus && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-blue-800 text-sm">{migrationStatus}</p>
                    </div>
                  )}
                  
                  {scrapedData && (
                    <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                      <h3 className="font-semibold text-gray-900 mb-2">스크래핑 결과:</h3>
                      <p className="text-sm text-gray-700"><strong>제목:</strong> {scrapedData.title}</p>
                      <p className="text-sm text-gray-700"><strong>이미지 수:</strong> {scrapedData.images ? scrapedData.images.length : 0}개</p>
                      <p className="text-sm text-gray-700"><strong>플랫폼:</strong> {scrapedData.platform}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 네이버 블로그 스크래퍼 탭 */}
          {activeTab === 'naver-scraper' && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  🔵 네이버 블로그 스크래퍼
                </h2>
                <p className="text-gray-600 mb-6">
                  RSS 피드 기반으로 네이버 블로그의 모든 포스트를 자동으로 수집하고 스크래핑합니다.
                </p>
                
                {/* 모드 선택 */}
                <div className="mb-6">
                  <div className="flex justify-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="urls"
                        checked={naverScraperMode === 'urls'}
                        onChange={(e) => setNaverScraperMode(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">📝 URL 직접 입력</span>
                      <span className="ml-2 text-xs text-gray-500">(개별 포스트)</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="blogId"
                        checked={naverScraperMode === 'blogId'}
                        onChange={(e) => setNaverScraperMode(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">📚 블로그 ID로 수집</span>
                      <span className="ml-2 text-xs text-gray-500">(전체 블로그)</span>
                    </label>
                  </div>
                </div>

                {/* 입력 필드 */}
                <div className="space-y-4">
                  {naverScraperMode === 'blogId' ? (
                    <div className="max-w-md mx-auto">
                      <input
                        type="text"
                        value={naverBlogId}
                        onChange={(e) => setNaverBlogId(e.target.value)}
                        placeholder="massgoogolf (블로그 ID만 입력)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isScrapingNaver}
                      />
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-1">📚 블로그 ID로 수집 기능</p>
                        <p className="text-xs text-blue-600">
                          • RSS 피드에서 최근 10개 포스트를 자동으로 가져옵니다<br/>
                          • 예: https://blog.naver.com/massgoogolf → massgoogolf<br/>
                          • 전체 블로그의 모든 포스트를 한 번에 처리합니다
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto">
                      <textarea
                        value={naverPostUrls}
                        onChange={(e) => setNaverPostUrls(e.target.value)}
                        placeholder="네이버 블로그 포스트 URL들을 한 줄씩 입력하세요&#10;https://blog.naver.com/massgoogolf/223958579134&#10;https://blog.naver.com/massgoogolf/223958579135"
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isScrapingNaver}
                      />
                      <div className="mt-2 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800 font-medium mb-1">📝 URL 직접 입력 기능</p>
                        <p className="text-xs text-green-600">
                          • 개별 포스트 URL을 직접 입력하여 정확하게 가져옵니다<br/>
                          • 여러 포스트를 한 번에 처리할 수 있습니다<br/>
                          • 우선적으로 이 방법을 사용하세요
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleNaverBlogScrape}
                    disabled={isScrapingNaver || (!naverBlogId && !naverPostUrls)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isScrapingNaver ? '스크래핑 중...' : '🔍 네이버 블로그 스크래핑 시작'}
                  </button>
                </div>

                {/* 스크래핑 결과 */}
                {scrapedNaverPosts.length > 0 && (
                  <div className="mt-8 text-left">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        스크래핑 결과 ({scrapedNaverPosts.length}개 포스트)
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSelectAllNaverPosts}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          {selectedNaverPosts.size === scrapedNaverPosts.length ? '전체 해제' : '전체 선택'}
                        </button>
                        {selectedNaverPosts.size > 0 && (
                          <button 
                            onClick={handleNaverPostMigration}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            선택된 {selectedNaverPosts.size}개 마이그레이션
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid gap-4 max-h-96 overflow-y-auto">
                      {scrapedNaverPosts.map((post, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedNaverPosts.has(index)}
                              onChange={() => handleNaverPostSelect(index)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-2">
                                {post.title || '제목 없음'}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>URL:</strong> {post.originalUrl}
                              </p>
                              {post.publishDate && (
                                <p className="text-sm text-gray-500 mb-2">
                                  <strong>발행일:</strong> {post.publishDate}
                                </p>
                              )}
                              {post.images && post.images.length > 0 && (
                                <p className="text-sm text-blue-600 mb-2">
                                  <strong>이미지:</strong> {post.images.length}개
                                </p>
                              )}
                              {post.error && (
                                <p className="text-sm text-red-600">
                                  <strong>오류:</strong> {post.error}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 게시물 작성/수정 폼 */}
          {(activeTab === 'create' || showForm) && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                {editingPost ? '게시물 수정' : '새 게시물 작성'}
              </h2>
              
              {/* 통합 대시보드로 이동하는 안내 메시지 */}
              {editingPost && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 <strong>블로그 분석</strong>과 <strong>AI 사용량</strong>은 
                    <button
                      type="button"
                      onClick={() => window.open('/admin/ai-dashboard', '_blank')}
                      className="ml-1 text-blue-600 underline hover:text-blue-800"
                    >
                      🤖 AI 관리
                    </button>
                    메뉴에서 확인하세요.
                  </p>
                </div>
              )}

                <button
                  type="button"
                  onClick={() => {
                    console.log('폼 닫기 버튼 클릭됨');
                    setShowForm(false);
                    setEditingPost(null);
                    setFormData({
                      title: '',
                      slug: '',
                      excerpt: '',
                      content: '',
                      featured_image: '',
                      category: '',
                      tags: [],
                      status: 'draft',
                      meta_title: '',
                      meta_description: '',
                      meta_keywords: '',
                      view_count: 0,
                      is_featured: false,
                      scheduled_at: null,
                      is_scheduled: false,
                      author: '마쓰구골프'
                    });
                  }}
                  className="text-gray-500 hover:text-gray-700 text-lg font-bold p-1 rounded-full hover:bg-gray-100 transition-colors"
                  title="닫기"
                >
                  ✕
                </button>
              </div>

              {/* 블로그 분석 대시보드 제거됨 - 통합 대시보드로 이동 */}

              {/* AI 사용량 대시보드 제거됨 - 통합 대시보드로 이동 */}
              
              <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" noValidate>
                {/* 콘텐츠 소스 입력란 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setFormData({
                        ...formData,
                        title,
                        slug: generateSlug(title),
                        meta_title: title
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="게시물 제목을 입력하세요 (AI 생성 또는 직접 입력)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 AI가 생성한 제목을 선택하거나 직접 입력하세요. SEO 최적화와 후킹력을 고려한 제목이 좋습니다.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    슬러그 *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="URL 슬러그"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateAISlug}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm relative"
                      title="AI로 SEO 최적화된 슬러그 생성 (OpenAI 크레딧 필요)"
                    >
                      🤖 AI
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center" title="OpenAI 크레딧 부족">
                        !
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    제목 입력 시 자동 생성되며, AI 버튼으로 더 정교한 슬러그를 생성할 수 있습니다.
                  </p>
                </div>

                {/* 마쓰구 브랜드 전략 선택 */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">🎯 마쓰구 브랜드 전략</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">콘텐츠 유형</label>
                      <select 
                        value={brandStrategy.contentType}
                        onChange={(e) => handleContentTypeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="골프 정보">골프 정보</option>
                        <option value="튜토리얼">튜토리얼</option>
                        <option value="고객 후기">고객 후기</option>
                        <option value="고객 스토리">고객 스토리</option>
                        <option value="이벤트">이벤트</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">오디언스 온도</label>
                      <select 
                        value={brandStrategy.audienceTemp}
                        onChange={(e) => setBrandStrategy({...brandStrategy, audienceTemp: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="cold">차가운 오디언스 (처음 접함)</option>
                        <option value="warm">따뜻한 오디언스 (관심 있음)</option>
                        <option value="hot">뜨거운 오디언스 (구매 의도 높음)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">브랜드 강도</label>
                      <select 
                        value={brandStrategy.brandWeight}
                        onChange={(e) => setBrandStrategy({...brandStrategy, brandWeight: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="none">0 (순수 정보)</option>
                        <option value="low">낮음 (정보 중심)</option>
                        <option value="medium">중간 (비교 강조)</option>
                        <option value="high">높음 (브랜드 강조)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">고객 채널</label>
                      <select 
                        value={brandStrategy.customerChannel}
                        onChange={(e) => setBrandStrategy({...brandStrategy, customerChannel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">선택 안함</option>
                        <option value="local_customers">내방고객 (경기 근방)</option>
                        <option value="online_customers">온라인고객 (전국 단위)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">고객 페르소나</label>
                      <select 
                        value={brandStrategy.customerPersona}
                        onChange={(e) => setBrandStrategy({...brandStrategy, customerPersona: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="high_rebound_preferrer">고반발 드라이버 선호 상급 골퍼</option>
                        <option value="health_conscious_senior">건강을 고려한 비거리 증가 시니어 골퍼</option>
                        <option value="competitive_maintainer">경기력을 유지하고 싶은 중상급 골퍼</option>
                        <option value="returning_senior">최근 골프를 다시 시작한 60대 이상 골퍼</option>
                        <option value="beginner_distance">골프 입문자를 위한 비거리 향상 초급 골퍼</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">페인 포인트</label>
                      <select 
                        value={brandStrategy.painPoint}
                        onChange={(e) => setBrandStrategy({...brandStrategy, painPoint: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">선택 안함</option>
                        <option value="distance_decrease">비거리 감소</option>
                        <option value="service_dissatisfaction">서비스 불만족</option>
                        <option value="equipment_durability">장비 내구성</option>
                        <option value="fitting_accuracy">피팅 정확도</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button 
                      type="button"
                      onClick={() => generateAIContent('excerpt')} 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      🤖 AI 요약
                    </button>
                    <button 
                      type="button"
                      onClick={() => generateAIContent('content')} 
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      🤖 AI 본문
                    </button>
                    <button 
                      type="button"
                      onClick={() => improveAIContent('all')} 
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
                      title="기존 내용과 이미지를 AI가 분석하여 교정하고 개선합니다"
                    >
                      🔧 AI 개선 (고급)
                    </button>
                    <button 
                      type="button"
                      onClick={() => generateAIContent('meta')} 
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    >
                      🤖 AI 메타
                    </button>
                    {/* ChatGPT 프롬프트 미리보기 버튼들은 하단의 이미지 생성 버튼으로 통합됨 */}
                  </div>

                  {/* 간단 AI 개선 기능 */}
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium mb-2 text-blue-800">✨ 간단 AI 개선</h4>
                    <textarea 
                      placeholder="예: 전문성을 높여주세요, CTA 버튼을 추가해주세요, 관련 링크를 넣어주세요, 스토리텔링을 강화해주세요..."
                      className="w-full p-3 border border-blue-300 rounded text-sm resize-none"
                      rows={3}
                      value={simpleAIRequest}
                      onChange={(e) => setSimpleAIRequest(e.target.value)}
                    />
                    <div className="flex gap-2 mt-2">
                      <button 
                        type="button"
                        onClick={() => applySimpleAIImprovement()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        disabled={!simpleAIRequest.trim()}
                      >
                        ✨ AI 개선 적용
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSimpleAIRequest('')}
                        className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        🗑️ 지우기
                      </button>
                    </div>
                  </div>

                  {/* 스토리텔링 AI 기능 */}
                  <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium mb-2 text-purple-800">🎬 스토리텔링 AI</h4>
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        type="button"
                        onClick={() => generatePixarStory()}
                        className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                      >
                        🎬 픽사 스토리
                      </button>
                      <button 
                        type="button"
                        onClick={() => generateStoryBrand()}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        ⚔️ 무기가 되는 스토리
                      </button>
                      <button 
                        type="button"
                        onClick={() => generateCustomerJourney()}
                        className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        🛤️ 고객 여정 스토리
                      </button>
                    </div>
                  </div>

                  {/* 이미지 개수 선택 */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      생성할 이미지 개수 선택:
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 4].map(count => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setSelectedImageCount(count)}
                          className={`px-3 py-1 text-sm rounded ${
                            selectedImageCount === count
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {count}개
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 프롬프트 미리보기 */}
                  {showPromptPreview && previewPrompt && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-800 mb-2">🤖 ChatGPT 생성 프롬프트:</h5>
                      <p className="text-sm text-blue-700 leading-relaxed">{previewPrompt}</p>
                      <button 
                        onClick={() => setShowPromptPreview(false)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        닫기
                      </button>
                    </div>
                  )}

                  {/* 이미지 생성 진행사항 */}
                  {showGenerationProcess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h5 className="text-sm font-medium text-green-800 mb-2">🔄 {imageGenerationModel} 진행사항:</h5>
                      <p className="text-sm text-green-700">{imageGenerationStep}</p>
                    </div>
                  )}

                  {/* AI 이미지 생성 버튼들 */}
                  <div className="flex flex-wrap gap-2">
                    <button 
                      type="button"
                      onClick={() => generateMultipleAIImages(selectedImageCount)} 
                      disabled={isGeneratingImages}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50 relative"
                      title="DALL-E 3 크레딧 필요"
                    >
                      {isGeneratingImages ? '🤖 생성 중...' : `🤖 ChatGPT + DALL-E 3 ${selectedImageCount}개`}
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center" title="DALL-E 3 크레딧 부족">
                        !
                      </span>
                    </button>
                    <div className="flex flex-col gap-1">
                      <button 
                        type="button"
                        onClick={() => generateFALAIImages(selectedImageCount, false)} 
                        disabled={isGeneratingImages}
                        className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm disabled:opacity-50 relative"
                        title="FAL AI 크레딧 필요"
                      >
                        {isGeneratingImages ? '🤖 생성 중...' : `🤖 ChatGPT + FAL AI ${selectedImageCount}개 (깔끔한 이미지)`}
                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center" title="FAL AI 크레딧 부족">
                          !
                        </span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => generateFALAIImages(selectedImageCount, true)} 
                        disabled={isGeneratingImages}
                        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm disabled:opacity-50 relative"
                        title="FAL AI 크레딧 필요 (광고 카피 포함)"
                      >
                        {isGeneratingImages ? '🤖 생성 중...' : `🤖 ChatGPT + FAL AI ${selectedImageCount}개 (광고 카피 포함)`}
                        <span className="absolute -top-1 -right-1 bg-orange-400 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center" title="FAL AI 크레딧 부족">
                          !
                        </span>
                      </button>
                    </div>
                    
                    {/* Kie AI 버튼 복구 */}
                    <button 
                      type="button"
                      onClick={() => generateKieAIImages(selectedImageCount)} 
                      disabled={isGeneratingImages}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm disabled:opacity-50 relative"
                      title="Kie AI 크레딧 필요"
                    >
                      {isGeneratingImages ? '🎨 생성 중...' : `🤖 ChatGPT + Kie AI ${selectedImageCount}개`}
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center" title="Kie AI 크레딧 부족">
                        !
                      </span>
                    </button>
                    
                    {/* 구글 이미지 생성 버튼 */}
                    <button 
                      type="button"
                      onClick={() => generateGoogleImages(selectedImageCount)} 
                      disabled={isGeneratingImages}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50 relative"
                      title="Google AI 크레딧 필요"
                    >
                      {isGeneratingImages ? '🤖 생성 중...' : `🤖 ChatGPT + Google AI ${selectedImageCount}개`}
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center" title="Google AI 크레딧 부족">
                        !
                      </span>
                    </button>
                    
                    {/* 단락별 이미지 생성 버튼 */}
                    <button 
                      type="button"
                      onClick={generateParagraphImages} 
                      disabled={isGeneratingParagraphImages}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm disabled:opacity-50"
                    >
                      {isGeneratingParagraphImages ? '📝 생성 중...' : '📝 단락별 이미지 생성'}
                    </button>
                  </div>

                  {/* AI 생성 이미지 선택 아코디언 (상단으로 이동) */}
                  {generatedImages.length > 0 && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <button
                        onClick={() => setShowAIImageAccordion(!showAIImageAccordion)}
                        className="w-full text-left flex items-center justify-between p-3 bg-white hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div>
                          <h4 className="text-lg font-semibold text-orange-800">
                            🎨 AI 생성 이미지 선택 ({generatedImages.length}개)
                          </h4>
                          <p className="text-sm text-orange-700 mt-1">
                            AI가 생성한 이미지 중에서 원하는 이미지를 선택하세요
                          </p>
                        </div>
                        <div className="text-orange-600 text-xl">
                          {showAIImageAccordion ? '▼' : '▶'}
                        </div>
                      </button>
                      
                      {showAIImageAccordion && (
                        <div className="mt-4 p-4 bg-white border border-orange-200 rounded-lg">
                          <p className="text-sm text-orange-700 mb-4">
                            AI가 생성한 {generatedImages.length}개의 이미지 중에서 원하는 이미지를 선택하세요. 클릭하면 대표 이미지로 설정됩니다.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {generatedImages.map((imageUrl, index) => (
                              <div 
                                key={index}
                                className="cursor-pointer border-2 border-gray-200 rounded-lg overflow-hidden hover:border-orange-500 transition-colors"
                              >
                                <div 
                                  className="h-48 flex items-center justify-center bg-gray-100"
                                  onClick={() => {
                                    setSelectedGeneratedImage(imageUrl);
                                    setShowGeneratedImageModal(true);
                                  }}
                                  title="클릭하여 이미지 확대 보기"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`AI 생성 이미지 ${index + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                                <div className="p-3">
                                  <h5 className="font-medium text-sm text-gray-900 mb-1">AI 생성 이미지 {index + 1}</h5>
                                  <div className="flex gap-1 mb-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyImageUrl(imageUrl);
                                      }}
                                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                    >
                                      📋 복사
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        insertImageToContentLegacy(imageUrl);
                                      }}
                                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                    >
                                      ➕ 삽입
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        selectGeneratedImage(imageUrl);
                                      }}
                                      className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                                    >
                                      ⭐ 대표
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-600">클릭하여 이미지 확대 보기</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 저장된 프롬프트 섹션 (이미지 생성 버튼 바로 아래) */}
                  {savedPrompts.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-800">
                          📝 저장된 프롬프트 ({savedPrompts.length}개)
                        </h4>
                        <button
                          onClick={deleteAllPrompts}
                          className="text-xs text-red-600 hover:text-red-800 underline"
                        >
                          🗑️ 모두 삭제
                        </button>
                      </div>
                      <div className="space-y-2">
                        {normalizePrompts(savedPrompts).map((prompt) => (
                          <div key={prompt.id} className="border border-gray-200 rounded-lg">
                            <button
                              onClick={() => setExpandedPromptId(
                                expandedPromptId === prompt.id ? null : prompt.id
                              )}
                              className="w-full p-3 text-left bg-white hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-800">
                                    {prompt.model} {prompt.imageCount ? `- ${prompt.imageCount}개 이미지` : ''}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(prompt.createdAt || prompt.timestamp || Date.now()).toLocaleString('ko-KR')}
                                    {prompt.improvementRequest && (
                                      <span className="ml-2 text-blue-600">
                                        요청: {prompt.improvementRequest}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deletePrompt(prompt.id);
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 underline"
                                    title="프롬프트 삭제"
                                  >
                                    🗑️
                                  </button>
                                  <div className="text-gray-400">
                                    {expandedPromptId === prompt.id ? '▼' : '▶'}
                                  </div>
                                </div>
                              </div>
                            </button>
                            {expandedPromptId === prompt.id && (
                              <div className="p-3 bg-gray-50 border-t border-gray-200">
                                <div className="mb-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <h6 className="text-xs font-medium text-gray-700">한글 프롬프트:</h6>
                                    <button 
                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                      onClick={() => {
                                        setEditingPromptId(prompt.id);
                                        setEditingKoreanPrompt(prompt.koreanPrompt);
                                      }}
                                    >
                                      ✏️ 수정
                                    </button>
                                  </div>
                                  {editingPromptId === prompt.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editingKoreanPrompt}
                                        onChange={(e) => setEditingKoreanPrompt(e.target.value)}
                                        className="w-full text-xs text-gray-600 bg-yellow-50 p-2 rounded border resize-none"
                                        rows={3}
                                        placeholder="한글 프롬프트를 수정하세요..."
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={async () => {
                                            // 한글 프롬프트 저장 및 영문 번역
                                            try {
                                              const translationResponse = await fetch('/api/translate-korean-to-english', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ 
                                                  koreanPrompt: editingKoreanPrompt,
                                                  originalEnglishPrompt: prompt.prompt,
                                                  model: prompt.model.includes('FAL') ? 'fal' : 
                                                         prompt.model.includes('Replicate') ? 'replicate' :
                                                         prompt.model.includes('Stability') ? 'stability' : 'fal'
                                                })
                                              });
                                              
                                              if (translationResponse.ok) {
                                                const translationData = await translationResponse.json();
                                                
                                                const imageResponse = await fetch('/api/regenerate-image-from-prompt', {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    translatedPrompt: translationData.translatedPrompt,
                                                    model: prompt.model.includes('FAL') ? 'fal' : 
                                                           prompt.model.includes('Replicate') ? 'replicate' :
                                                           prompt.model.includes('Stability') ? 'stability' : 'fal',
                                                    originalImageUrl: prompt.originalImage || null
                                                  })
                                                });
                                                
                                                if (imageResponse.ok) {
                                                  const imageData = await imageResponse.json();
                                                  
                                                  setSavedPrompts(prev => prev.map(p => 
                                                    p.id === prompt.id 
                                                      ? { 
                                                          ...p, 
                                                          koreanPrompt: editingKoreanPrompt,
                                                          prompt: translationData.translatedPrompt,
                                                          regeneratedImage: imageData.newImageUrl,
                                                          regeneratedAt: new Date().toISOString()
                                                        }
                                                      : p
                                                  ));
                                                  
                                                  if (imageData.newImageUrl) {
                                                    const newImage = {
                                                      url: imageData.newImageUrl,
                                                      fileName: `regenerated-${Date.now()}.png`,
                                                      model: prompt.model,
                                                      prompt: translationData.translatedPrompt,
                                                      koreanPrompt: editingKoreanPrompt,
                                                      isRegenerated: true
                                                    };
                                                    setGeneratedImages(prev => [...prev, newImage]);
                                                  }
                                                  
                                                  alert('✅ 한글 프롬프트가 수정되고 영문으로 번역되어 새 이미지가 생성되었습니다!');
                                                } else {
                                                  throw new Error('이미지 재생성 실패');
                                                }
                                              } else {
                                                throw new Error('번역 실패');
                                              }
                                            } catch (error) {
                                              console.error('프롬프트 수정 및 재생성 오류:', error);
                                              alert('❌ 프롬프트 수정 중 오류가 발생했습니다: ' + error.message);
                                            }
                                            
                                            setEditingPromptId(null);
                                            setEditingKoreanPrompt('');
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                          🔄 번역 & 재생성
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingPromptId(null);
                                            setEditingKoreanPrompt('');
                                          }}
                                          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                          ❌ 취소
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border">
                                      {prompt.koreanPrompt || '한글 프롬프트가 없습니다.'}
                                    </p>
                                  )}
                                </div>
                                <div className="mb-2">
                                  <h6 className="text-xs font-medium text-gray-700 mb-1">영문 프롬프트:</h6>
                                  <p className="text-xs text-gray-700 leading-relaxed bg-white p-2 rounded border">
                                    {prompt.prompt}
                                  </p>
                                </div>
                                {prompt.regeneratedImage && (
                                  <div className="mb-2">
                                    <h6 className="text-xs font-medium text-gray-700 mb-1">🔄 재생성된 이미지:</h6>
                                    <div className="flex items-center gap-2">
                                      <img 
                                        src={prompt.regeneratedImage} 
                                        alt="재생성된 이미지" 
                                        className="w-16 h-16 object-cover rounded border"
                                      />
                                      <div className="text-xs text-gray-500">
                                        {prompt.regeneratedAt && new Date(prompt.regeneratedAt).toLocaleString('ko-KR')}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 이미지 변형 섹션 */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium mb-3 text-purple-800 flex items-center">
                      🎨 이미지 변형 시스템
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">NEW</span>
                    </h4>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        변형할 기본 이미지 선택:
                      </label>
                      
                      {/* 선택된 이미지 미리보기 */}
                      {selectedBaseImage && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                          <p className="text-sm font-medium text-gray-700 mb-2">선택된 이미지:</p>
                          <div className="flex items-center space-x-3">
                            <img 
                              src={selectedBaseImage} 
                              alt="선택된 기본 이미지"
                              className="w-16 h-16 object-cover rounded border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-16 h-16 bg-gray-200 rounded border items-center justify-center">
                              <span className="text-xs text-gray-500">이미지 로드 실패</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 truncate">
                                {selectedBaseImage.split('/').pop()}
                              </p>
                              <button
                                onClick={() => setSelectedBaseImage('')}
                                className="text-xs text-red-600 hover:text-red-800 mt-1"
                              >
                                선택 해제
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 이미지 썸네일 선택 그리드 */}
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {/* AI 생성 이미지 */}
                        {generatedImages.filter(img => isValidImageUrl(img)).length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              🤖 AI 생성 이미지 ({generatedImages.filter(img => isValidImageUrl(img)).length}개)
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                              {generatedImages.filter(img => isValidImageUrl(img)).map((imgUrl, index) => (
                                <div
                                  key={`ai-${index}`}
                                  onClick={() => setSelectedBaseImage(imgUrl)}
                                  className={`relative cursor-pointer rounded-lg border-2 transition-all group ${
                                    selectedBaseImage === imgUrl 
                                      ? 'border-blue-500 ring-2 ring-blue-200' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <img 
                                    src={imgUrl} 
                                    alt={`AI 생성 이미지 ${index + 1}`}
                                    className="w-full h-20 object-cover rounded"
                                    onError={(e) => {
                                      console.error('이미지 로드 실패:', imgUrl);
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                                      
                                      // 로드 실패한 이미지를 상태에서 제거
                                      setTimeout(() => {
                                        setGeneratedImages(prev => prev.filter(img => img !== imgUrl));
                                        console.log('로드 실패한 이미지 제거:', imgUrl);
                                      }, 1000);
                                    }}
                                    onLoad={() => {
                                      console.log('이미지 로드 성공:', imgUrl);
                                    }}
                                  />
                                  <div className="hidden w-full h-20 bg-gray-100 rounded items-center justify-center">
                                    <span className="text-xs text-gray-500">로드 실패</span>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b">
                                    <div className="truncate">AI 생성</div>
                                  </div>
                                  {/* 삭제 버튼 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteImage(imgUrl, 'generated');
                                    }}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="이미지 삭제"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 스크래핑 이미지 */}
                        {postImages.filter(img => isValidImageUrl(img.url)).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              📥 스크래핑 이미지 ({postImages.filter(img => isValidImageUrl(img.url)).length}개)
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                              {postImages.filter(img => isValidImageUrl(img.url)).map((img, index) => (
                                <div
                                  key={`scraped-${index}`}
                                  onClick={() => setSelectedBaseImage(img.url)}
                                  className={`relative cursor-pointer rounded-lg border-2 transition-all group ${
                                    selectedBaseImage === img.url 
                                      ? 'border-blue-500 ring-2 ring-blue-200' 
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <img 
                                    src={img.url} 
                                    alt={`스크래핑 이미지 ${index + 1}`}
                                    className="w-full h-20 object-cover rounded"
                                    onError={(e) => {
                                      console.error('스크래핑 이미지 로드 실패:', img.url);
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                                    }}
                                    onLoad={() => {
                                      console.log('스크래핑 이미지 로드 성공:', img.url);
                                    }}
                                  />
                                  <div className="hidden w-full h-20 bg-gray-100 rounded items-center justify-center">
                                    <span className="text-xs text-gray-500">로드 실패</span>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b">
                                    <div className="truncate">스크래핑</div>
                                  </div>
                                  {/* 삭제 버튼 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteImage(img.url, 'scraped');
                                    }}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="이미지 삭제"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 이미지가 없는 경우 */}
                        {generatedImages.filter(img => isValidImageUrl(img)).length === 0 && postImages.filter(img => isValidImageUrl(img.url)).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">🖼️</div>
                            <p className="text-sm">변형할 이미지가 없습니다.</p>
                            <p className="text-xs mt-1">AI 이미지 생성이나 스크래핑을 먼저 해주세요.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        변형 강도: {variationStrength}
                      </label>
                      <input 
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={variationStrength}
                        onChange={(e) => setVariationStrength(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>약함 (0.1)</span>
                        <span>강함 (1.0)</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button 
                        type="button"
                        onClick={() => generateImageVariation('fal')}
                        disabled={!selectedBaseImage || isGeneratingVariation}
                        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm disabled:opacity-50"
                      >
                        {isGeneratingVariation ? '🎨 변형 중...' : '🎨 FAL AI 변형'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => generateImageVariation('replicate')}
                        disabled={!selectedBaseImage || isGeneratingVariation}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50"
                      >
                        {isGeneratingVariation ? '🎨 변형 중...' : '🎨 Replicate Flux 변형'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => generateImageVariation('stability')}
                        disabled={!selectedBaseImage || isGeneratingVariation}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:opacity-50"
                      >
                        {isGeneratingVariation ? '🎨 변형 중...' : '🎨 Stability AI 변형'}
                    </button>
                    </div>

                    <p className="text-xs text-gray-600 mt-2">
                      <span className="text-purple-600 font-medium">📥 AI 생성 이미지 + 스크래핑 이미지 모두 변형 가능</span><br/>
                      <span className="text-orange-600 font-medium">🎨 FAL AI: 실사 스타일 변형 (빠름, 저비용)</span><br/>
                      <span className="text-blue-600 font-medium">🎨 Replicate Flux: 고품질 변형 (중간 속도, 중간 비용)</span><br/>
                      <span className="text-green-600 font-medium">🎨 Stability AI: 안정적 변형 (느림, 저비용)</span>
                    </p>
                  </div>

                  {/* 간단 AI 이미지 개선 섹션 */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium mb-3 text-green-800 flex items-center">
                      🎨 간단 AI 이미지 개선
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">NEW</span>
                    </h4>
                    
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        개선할 이미지 선택:
                      </label>
                      
                      {/* 선택된 이미지 미리보기 */}
                      {selectedImageForImprovement && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                          <p className="text-sm font-medium text-gray-700 mb-2">선택된 이미지:</p>
                          <div className="flex items-center space-x-3">
                            <img 
                              src={selectedImageForImprovement} 
                              alt="선택된 개선 이미지"
                              className="w-16 h-16 object-cover rounded border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                              }}
                            />
                            <div className="hidden w-16 h-16 bg-gray-200 rounded border items-center justify-center">
                              <span className="text-xs text-gray-500">이미지 로드 실패</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 truncate">
                                {selectedImageForImprovement.split('/').pop()}
                              </p>
                              <button
                                onClick={() => setSelectedImageForImprovement('')}
                                className="text-xs text-red-600 hover:text-red-800 mt-1"
                              >
                                선택 해제
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 이미지 썸네일 선택 그리드 */}
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {/* AI 생성 이미지 */}
                        {generatedImages.filter(img => isValidImageUrl(img)).length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              🤖 AI 생성 이미지 ({generatedImages.filter(img => isValidImageUrl(img)).length}개)
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                              {generatedImages.filter(img => isValidImageUrl(img)).map((imgUrl, index) => (
                                <div key={`ai-${index}`} className="relative group">
                                  <img
                                    src={imgUrl}
                                    alt={`AI 생성 이미지 ${index + 1}`}
                                    className={`w-full h-20 object-cover rounded border cursor-pointer transition-all ${
                                      selectedImageForImprovement === imgUrl 
                                        ? 'ring-2 ring-green-500 border-green-500' 
                                        : 'hover:border-green-300'
                                    }`}
                                    onClick={() => setSelectedImageForImprovement(imgUrl)}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                                      
                                      // 로드 실패한 이미지를 상태에서 제거
                                      setTimeout(() => {
                                        setGeneratedImages(prev => prev.filter(img => img !== imgUrl));
                                        console.log('로드 실패한 이미지 제거:', imgUrl);
                                      }, 1000);
                                    }}
                                  />
                                  <div className="hidden w-full h-20 bg-gray-100 rounded items-center justify-center">
                                    <span className="text-xs text-gray-500">로드 실패</span>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b">
                                    <div className="truncate">AI 생성</div>
                                  </div>
                                  {/* 삭제 버튼 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteImage(imgUrl, 'generated');
                                    }}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="이미지 삭제"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 스크래핑 이미지 */}
                        {scrapedImages.filter(img => isValidImageUrl(img.url)).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              📥 스크래핑 이미지 ({scrapedImages.filter(img => isValidImageUrl(img.url)).length}개)
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                              {scrapedImages.filter(img => isValidImageUrl(img.url)).map((img, index) => (
                                <div key={`scraped-${index}`} className="relative group">
                                  <img
                                    src={img.url}
                                    alt={`스크래핑 이미지 ${index + 1}`}
                                    className={`w-full h-20 object-cover rounded border cursor-pointer transition-all ${
                                      selectedImageForImprovement === img.url 
                                        ? 'ring-2 ring-green-500 border-green-500' 
                                        : 'hover:border-green-300'
                                    }`}
                                    onClick={() => setSelectedImageForImprovement(img.url)}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      ((e.target as HTMLImageElement).nextSibling as HTMLElement).style.display = 'flex';
                                    }}
                                    onLoad={() => {
                                      console.log('스크래핑 이미지 로드 성공:', img.url);
                                    }}
                                  />
                                  <div className="hidden w-full h-20 bg-gray-100 rounded items-center justify-center">
                                    <span className="text-xs text-gray-500">로드 실패</span>
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b">
                                    <div className="truncate">스크래핑</div>
                                  </div>
                                  {/* 삭제 버튼 */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteImage(img.url, 'scraped');
                                    }}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="이미지 삭제"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 이미지가 없는 경우 */}
                        {generatedImages.filter(img => isValidImageUrl(img)).length === 0 && 
                         scrapedImages.filter(img => isValidImageUrl(img.url)).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">개선할 이미지가 없습니다.</p>
                            <p className="text-xs mt-1">먼저 이미지를 생성하거나 스크래핑해주세요.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 빠른 텍스트 제거 버튼들 */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        빠른 텍스트 제거:
                      </label>
                      <div className="flex gap-2 mb-2">
                        <button 
                          type="button"
                          onClick={() => setSimpleAIImageRequest('모든 텍스트와 글자를 완전히 제거해주세요. 깔끔한 이미지로 만들어주세요.')}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        >
                          🚫 모든 텍스트 제거
                        </button>
                        <button 
                          type="button"
                          onClick={() => setSimpleAIImageRequest('배너와 오버레이 텍스트만 제거해주세요.')}
                          className="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs"
                        >
                          🏷️ 배너 제거
                        </button>
                        <button 
                          type="button"
                          onClick={() => setSimpleAIImageRequest('브랜드명과 로고만 제거해주세요.')}
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-xs"
                        >
                          🏢 브랜드명 제거
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이미지 개선 요청사항:
                      </label>
                      <textarea 
                        placeholder="예: 글자/텍스트를 제거해주세요, 드라이버를 제거해주세요, 배경을 바꿔주세요, 색상을 더 밝게 해주세요..."
                        className="w-full p-3 border border-green-300 rounded text-sm resize-none"
                        rows={3}
                        value={simpleAIImageRequest}
                        onChange={(e) => setSimpleAIImageRequest(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => applySimpleAIImageImprovement('fal')}
                        disabled={!selectedImageForImprovement || !simpleAIImageRequest.trim() || isImprovingImage}
                        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm disabled:opacity-50"
                      >
                        {isImprovingImage ? '🤖 개선 중...' : '🤖 ChatGPT + FAL AI 개선'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => applySimpleAIImageImprovement('replicate')}
                        disabled={!selectedImageForImprovement || !simpleAIImageRequest.trim() || isImprovingImage}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm disabled:opacity-50"
                      >
                        {isImprovingImage ? '🤖 개선 중...' : '🤖 ChatGPT + Replicate 개선'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => applySimpleAIImageImprovement('stability')}
                        disabled={!selectedImageForImprovement || !simpleAIImageRequest.trim() || isImprovingImage}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm disabled:opacity-50"
                      >
                        {isImprovingImage ? '🤖 개선 중...' : '🤖 ChatGPT + Stability 개선'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => applySimpleAIImageImprovement('dalle')}
                        disabled={!selectedImageForImprovement || !simpleAIImageRequest.trim() || isImprovingImage}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm disabled:opacity-50"
                      >
                        {isImprovingImage ? '🤖 개선 중...' : '🤖 ChatGPT + DALL-E 3 개선'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => applySimpleAIImageImprovement('google')}
                        disabled={!selectedImageForImprovement || !simpleAIImageRequest.trim() || isImprovingImage}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:opacity-50"
                      >
                        {isImprovingImage ? '🤖 개선 중...' : '🤖 ChatGPT + Google AI 개선'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => applySimpleAIImageImprovement('vision-enhanced')}
                        disabled={!selectedImageForImprovement || !simpleAIImageRequest.trim() || isImprovingImage}
                        className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-sm disabled:opacity-50"
                      >
                        {isImprovingImage ? '🔍 분석 중...' : '🔍 Google Vision + FAL AI 개선'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setSimpleAIImageRequest('');
                          setSelectedImageForImprovement('');
                        }}
                        className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        🗑️ 지우기
                      </button>
                    </div>

                    <p className="text-xs text-gray-600 mt-2">
                      <span className="text-green-600 font-medium">🤖 ChatGPT + AI 이미지 개선: 원본 이미지 분석 후 각 모델 특성에 맞는 최적화된 프롬프트로 개선</span><br/>
                    <span className="text-orange-600 font-medium">🤖 ChatGPT + FAL AI: 빠른 실사 스타일 개선 (저비용)</span><br/>
                    <span className="text-blue-600 font-medium">🤖 ChatGPT + Replicate: 안정적인 고품질 개선 (중간 비용)</span><br/>
                    <span className="text-green-600 font-medium">🤖 ChatGPT + Stability AI: 전문적 고해상도 개선 (저비용)</span><br/>
                    <span className="text-red-600 font-medium">🤖 ChatGPT + Google AI: 구글 Imagen 기반 고품질 이미지 생성 및 개선</span><br/>
                      <span className="text-purple-600 font-medium">🤖 ChatGPT + DALL-E 3: 창의적 고품질 개선 (중간 비용)</span><br/>
                      <span className="text-indigo-600 font-medium">🔍 Google Vision + FAL AI: 이미지 분석 후 새로운 이미지 생성 (고품질)</span>
                    </p>
                  </div>

                  {/* 간단 AI 이미지 개선 과정 표시 */}
                  {showGenerationProcess && improvementProcess && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800 mb-2">
                        🤖 {imageGenerationModel} 이미지 개선 과정
                      </h4>
                      <div className="text-sm text-green-700 mb-2">
                        {imageGenerationStep}
                      </div>
                      <div className="text-xs text-green-600">
                        {improvementProcess}
                      </div>
                    </div>
                  )}
                  
                  {/* 설명 텍스트는 하단의 이미지 생성 섹션에서만 표시 */}
                  
                  {/* 이미지 생성 과정 표시 */}
                  {showGenerationProcess && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        🎨 {imageGenerationModel} 이미지 생성 과정
                      </h4>
                      <div className="text-sm text-blue-700 mb-2">
                        {imageGenerationStep}
                      </div>
                    </div>
                  )}

                  {/* 저장된 프롬프트 아코디언 */}
                  {savedPrompts.length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-800 mb-3">
                        📝 저장된 프롬프트 ({savedPrompts.length}개)
                      </h4>
                      <div className="space-y-2">
                        {normalizePrompts(savedPrompts).map((prompt) => (
                          <div key={prompt.id} className="border border-gray-200 rounded-lg">
                            <button
                              onClick={() => setExpandedPromptId(
                                expandedPromptId === prompt.id ? null : prompt.id
                              )}
                              className="w-full p-3 text-left bg-white hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-medium text-gray-800">
                                    {prompt.model} {prompt.imageCount ? `- ${prompt.imageCount}개 이미지` : ''}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(prompt.createdAt || prompt.timestamp || Date.now()).toLocaleString('ko-KR')}
                                    {prompt.improvementRequest && (
                                      <span className="ml-2 text-blue-600">
                                        요청: {prompt.improvementRequest}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deletePrompt(prompt.id);
                                    }}
                                    className="text-xs text-red-600 hover:text-red-800 underline"
                                    title="프롬프트 삭제"
                                  >
                                    🗑️
                                  </button>
                                  <div className="text-gray-400">
                                    {expandedPromptId === prompt.id ? '▼' : '▶'}
                                  </div>
                                </div>
                              </div>
                            </button>
                            {expandedPromptId === prompt.id && (
                              <div className="p-3 bg-gray-50 border-t border-gray-200">
                                {prompt.imageAnalysis && (
                                  <div className="mb-3">
                                    <h6 className="text-xs font-medium text-gray-700 mb-1">이미지 분석:</h6>
                                    <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded border">
                                      {prompt.imageAnalysis}
                                    </p>
                                  </div>
                                )}
                                <div className="mb-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <h6 className="text-xs font-medium text-gray-700">한글 프롬프트:</h6>
                                    <button 
                                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                                      onClick={() => {
                                        setEditingPromptId(prompt.id);
                                        setEditingKoreanPrompt(prompt.koreanPrompt);
                                      }}
                                    >
                                      ✏️ 수정
                                    </button>
                                  </div>
                                  {editingPromptId === prompt.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editingKoreanPrompt}
                                        onChange={(e) => setEditingKoreanPrompt(e.target.value)}
                                        className="w-full text-xs text-gray-600 bg-yellow-50 p-2 rounded border resize-none"
                                        rows={3}
                                        placeholder="한글 프롬프트를 수정하세요..."
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          onClick={async () => {
                                            // 한글 프롬프트 저장 및 영문 번역
                                            try {
                                              // 1단계: 한글 프롬프트를 영문으로 번역
                                              const translationResponse = await fetch('/api/translate-korean-to-english', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ 
                                                  koreanPrompt: editingKoreanPrompt,
                                                  originalEnglishPrompt: prompt.prompt,
                                                  model: prompt.model.includes('FAL') ? 'fal' : 
                                                         prompt.model.includes('Replicate') ? 'replicate' :
                                                         prompt.model.includes('Stability') ? 'stability' : 'fal'
                                                })
                                              });
                                              
                                              if (translationResponse.ok) {
                                                const translationData = await translationResponse.json();
                                                
                                                // 2단계: 번역된 영문 프롬프트로 이미지 재생성
                                                const imageResponse = await fetch('/api/regenerate-image-from-prompt', {
                                                  method: 'POST',
                                                  headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({
                                                    translatedPrompt: translationData.translatedPrompt,
                                                    model: prompt.model.includes('FAL') ? 'fal' : 
                                                           prompt.model.includes('Replicate') ? 'replicate' :
                                                           prompt.model.includes('Stability') ? 'stability' : 'fal',
                                                    originalImageUrl: prompt.originalImage || null
                                                  })
                                                });
                                                
                                                if (imageResponse.ok) {
                                                  const imageData = await imageResponse.json();
                                                  
                                                  // 3단계: 프롬프트 업데이트 및 새 이미지 추가
                                                  setSavedPrompts(prev => prev.map(p => 
                                                    p.id === prompt.id 
                                                      ? { 
                                                          ...p, 
                                                          koreanPrompt: editingKoreanPrompt,
                                                          prompt: translationData.translatedPrompt,
                                                          regeneratedImage: imageData.newImageUrl,
                                                          regeneratedAt: new Date().toISOString()
                                                        }
                                                      : p
                                                  ));
                                                  
                                                  // 새 이미지를 generatedImages에 추가
                                                  if (imageData.newImageUrl) {
                                                    const newImage = {
                                                      url: imageData.newImageUrl,
                                                      fileName: `regenerated-${Date.now()}.png`,
                                                      model: prompt.model,
                                                      prompt: translationData.translatedPrompt,
                                                      koreanPrompt: editingKoreanPrompt,
                                                      isRegenerated: true
                                                    };
                                                    setGeneratedImages(prev => [...prev, newImage]);
                                                  }
                                                  
                                                  alert('✅ 한글 프롬프트가 수정되고 영문으로 번역되어 새 이미지가 생성되었습니다!');
                                                } else {
                                                  throw new Error('이미지 재생성 실패');
                                                }
                                              } else {
                                                throw new Error('번역 실패');
                                              }
                                            } catch (error) {
                                              console.error('프롬프트 수정 및 재생성 오류:', error);
                                              alert('❌ 프롬프트 수정 중 오류가 발생했습니다: ' + error.message);
                                            }
                                            
                                            setEditingPromptId(null);
                                            setEditingKoreanPrompt('');
                                          }}
                                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                          🔄 번역 & 재생성
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingPromptId(null);
                                            setEditingKoreanPrompt('');
                                          }}
                                          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                        >
                                          ❌ 취소
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border">
                                      {prompt.koreanPrompt || '한글 프롬프트가 없습니다.'}
                                    </p>
                                  )}
                                </div>
                                <div className="mb-2">
                                  <h6 className="text-xs font-medium text-gray-700 mb-1">영문 프롬프트:</h6>
                                  <p className="text-xs text-gray-700 leading-relaxed bg-white p-2 rounded border">
                                    {prompt.prompt}
                                  </p>
                                </div>
                                {prompt.regeneratedImage && (
                                  <div className="mb-2">
                                    <h6 className="text-xs font-medium text-gray-700 mb-1">🔄 재생성된 이미지:</h6>
                                    <div className="flex items-center gap-2">
                                      <img 
                                        src={prompt.regeneratedImage} 
                                        alt="재생성된 이미지" 
                                        className="w-16 h-16 object-cover rounded border"
                                      />
                                      <div className="text-xs text-gray-500">
                                        {prompt.regeneratedAt && new Date(prompt.regeneratedAt).toLocaleString('ko-KR')}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {prompt.allPrompts && (
                                  <div className="mt-3">
                                    <h6 className="text-xs font-medium text-gray-700 mb-2">모든 모델별 프롬프트:</h6>
                                    <div className="space-y-2">
                                      {prompt.allPrompts.fal_prompt && (
                                        <div>
                                          <span className="text-xs font-medium text-orange-600">FAL AI:</span>
                                          <p className="text-xs text-gray-600 bg-orange-50 p-2 rounded border">
                                            {prompt.allPrompts.fal_prompt}
                                          </p>
                                        </div>
                                      )}
                                      {prompt.allPrompts.replicate_prompt && (
                                        <div>
                                          <span className="text-xs font-medium text-blue-600">Replicate:</span>
                                          <p className="text-xs text-gray-600 bg-blue-50 p-2 rounded border">
                                            {prompt.allPrompts.replicate_prompt}
                                          </p>
                                        </div>
                                      )}
                                      {prompt.allPrompts.stability_prompt && (
                                        <div>
                                          <span className="text-xs font-medium text-green-600">Stability AI:</span>
                                          <p className="text-xs text-gray-600 bg-green-50 p-2 rounded border">
                                            {prompt.allPrompts.stability_prompt}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>


                {/* AI 생성 이미지 선택 UI는 상단 아코디언으로 이동됨 */}

                {/* 단락별 이미지 표시 */}
                {showParagraphImages && paragraphImages.length > 0 && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="text-lg font-semibold text-purple-800 mb-3">📝 단락별 생성된 이미지</h4>
                    <p className="text-sm text-purple-700 mb-4">
                      내용의 각 단락에 맞는 {paragraphImages.length}개의 이미지가 생성되었습니다. 이 이미지들을 복사하여 블로그 내용에 삽입하세요.
                    </p>
                    <div className="space-y-4">
                      {paragraphImages.map((item, index) => (
                        <div key={index} className="border border-purple-200 rounded-lg p-4 bg-white">
                          <div className="flex gap-4">
                            <img 
                              src={item.imageUrl} 
                              alt={`Paragraph ${item.paragraphIndex + 1}`}
                              className="w-32 h-20 object-contain rounded border"
                            />
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-purple-800 mb-2">
                                단락 {item.paragraphIndex + 1}
                              </h5>
                              <p className="text-xs text-gray-600 mb-2">
                                {item.paragraph}
                              </p>
                              <div className="flex gap-2 mb-2">
                                <button
                                  onClick={() => copyImageUrl(item.imageUrl)}
                                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  📋 URL 복사
                                </button>
                                <button
                                  onClick={() => insertImageToContentLegacy(item.imageUrl)}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                >
                                  ➕ 내용에 삽입
                                </button>
                </div>
                              <details className="text-xs text-gray-500">
                                <summary className="cursor-pointer text-purple-600 hover:text-purple-800">
                                  프롬프트 보기
                                </summary>
                                <p className="mt-1 italic">{item.prompt}</p>
                              </details>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowParagraphImages(false)}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                )}

        {/* 스크래핑 이미지 및 대표 이미지 관리 섹션 - 최우선 위치 (이미지 갤러리 위) */}
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
          <h4 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
            🖼️ 스크래핑 이미지 및 대표 이미지 관리
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">최우선</span>
          </h4>
          <div className="space-y-4">
            {/* 네이버 블로그에서 가져온 이미지들이 있는 경우 */}
            {postImages.length > 0 && postImages.some(img => img.isNaverImage) ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h5 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
                    📸 네이버 블로그에서 가져온 이미지들 ({postImages.filter(img => img.isNaverImage).length}개)
                    {postImages.filter(img => img.isNaverImage).length === 1 && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        💡 아래 "갤러리 열기" 버튼으로 Supabase 저장 기능을 사용하세요
                      </span>
                    )}
                  </h5>
                  <div className={`grid gap-4 ${postImages.filter(img => img.isNaverImage).length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                    {postImages.filter(img => img.isNaverImage).map((image, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                        <div 
                          className="bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-200 transition-colors h-48"
                          onClick={() => {
                            // 스크래핑 이미지 확대 모달 열기
                            setSelectedScrapingImage(image);
                            setShowScrapingImageModal(true);
                          }}
                          title="클릭하여 이미지 확대 보기"
                        >
                          <img 
                            src={image.src} 
                            alt={image.alt || `이미지 ${index + 1}`}
                            className="max-w-full max-h-full object-contain rounded"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              console.log('❌ 이미지 로드 실패:', image.src);
                              const target = e.target as HTMLImageElement;
                              
                              // 네이버 이미지인 경우 프록시 시도
                              if (image.src.includes('pstatic.net') && !image.src.includes('/api/image-proxy')) {
                                console.log('🔄 네이버 이미지 프록시 시도:', image.src);
                                target.src = `/api/image-proxy?url=${encodeURIComponent(image.src)}`;
                                return;
                              }
                              
                              // 프록시도 실패한 경우 에러 표시
                              target.style.display = 'none';
                              const nextSibling = target.nextSibling as HTMLElement;
                              if (nextSibling) nextSibling.style.display = 'flex';
                            }}
                            onLoad={() => {
                              console.log('✅ 이미지 로드 성공:', image.src);
                            }}
                          />
                          <div className="hidden text-gray-500 text-sm items-center justify-center">
                            <div className="text-center p-2">
                              <p className="mb-2">이미지 로드 실패</p>
                              <div className="space-y-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(image.src);
                                    alert('이미지 URL이 클립보드에 복사되었습니다!');
                                  }}
                                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                >
                                  URL 복사
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // 네이버 이미지의 경우 프록시를 통해 새 탭에서 열기
                                    if (image.src.includes('pstatic.net') || image.src.includes('naver.com')) {
                                      const proxyUrl = `/api/admin/image-proxy?url=${encodeURIComponent(image.src)}`;
                                      const newWindow = window.open('', '_blank');
                                      newWindow.document.write(`
                                        <html>
                                          <head>
                                            <title>이미지 미리보기</title>
                                            <style>
                                              body { margin: 0; padding: 20px; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                                              .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                                              img { max-width: 100%; max-height: 80vh; object-fit: contain; }
                                              .error { color: #e74c3c; text-align: center; }
                                              .url { font-size: 12px; color: #666; margin-top: 10px; word-break: break-all; }
                                              .loading { color: #3498db; text-align: center; }
                                            </style>
                                          </head>
                                          <body>
                                            <div class="container">
                                              <div class="loading" id="loading">이미지 로딩 중...</div>
                                              <img src="${proxyUrl}" 
                                                   alt="이미지 미리보기" 
                                                   style="display: none;"
                                                   onload="document.getElementById('loading').style.display='none'; this.style.display='block';"
                                                   onerror="document.getElementById('loading').style.display='none'; this.nextElementSibling.style.display='block';">
                                              <div class="error" style="display: none;">
                                                <p>이미지를 불러올 수 없습니다</p>
                                                <p>네이버 이미지는 직접 접근이 제한될 수 있습니다</p>
                                                <div class="url">원본 URL: ${image.src}</div>
                                                <div class="url">프록시 URL: ${proxyUrl}</div>
                                              </div>
                                            </div>
                                          </body>
                                        </html>
                                      `);
                                      newWindow.document.close();
                                    } else {
                                      window.open(image.src, '_blank');
                                    }
                                  }}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                                >
                                  새 탭에서 열기
                                </button>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">이미지 영역 클릭해도 새 탭에서 열림</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 mb-2 truncate" title={image.fileName}>
                          {image.fileName}
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              console.log('💾 Supabase 저장 버튼 클릭됨:', image.src);
                              console.log('📤 저장할 이미지 객체:', image);
                              
                              const requestBody = { 
                                imageUrl: image.src,
                                fileName: image.fileName || `naver-image-${Date.now()}.${image.fileExtension || 'jpg'}`
                              };
                              
                              console.log('📤 요청 본문:', requestBody);
                              
                              const response = await fetch('/api/admin/save-external-image/', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(requestBody)
                              });
                              
                              console.log('📡 API 응답 상태:', response.status);
                              console.log('📡 API 응답 헤더:', response.headers);
                              
                              if (response.ok) {
                                const result = await response.json();
                                console.log('✅ 이미지 저장 성공:', result);
                                alert('✅ 이미지가 Supabase에 성공적으로 저장되었습니다!');
                                
                                // 첫 번째 이미지를 대표 이미지로 자동 설정
                                if (index === 0) {
                                  setFormData({...formData, featured_image: result.supabaseUrl});
                                }
                              } else {
                                const errorText = await response.text();
                                console.error('❌ API 응답 실패:', response.status, errorText);
                                throw new Error(`저장 실패: ${response.status} - ${errorText}`);
                              }
                            } catch (error) {
                              console.error('❌ 이미지 저장 오류:', error);
                              console.error('❌ 오류 스택:', error.stack);
                              alert('❌ 이미지 저장 중 오류가 발생했습니다: ' + error.message);
                            }
                          }}
                          className="w-full px-3 py-2 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors"
                        >
                          Supabase에 저장
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
              </div>
            ) : (
              /* 스크래핑된 이미지가 없는 경우 안내 메시지 */
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📷</div>
                <p className="text-lg font-medium mb-2">스크래핑된 이미지가 없습니다</p>
                <p className="text-sm">네이버 블로그 스크래핑을 통해 이미지를 가져오세요.</p>
              </div>
            )}
            
            {/* 현재 대표 이미지 섹션 제거 - 전체 이미지 갤러리에서 대표 설정 가능 */}
          </div>
        </div>

        {/* 이미지 갤러리 관리 */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-800">🖼️ 이미지 갤러리</h4>
            <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
              💡 이미지를 Supabase에 저장한 후 "◆ 대표" 버튼으로 대표 이미지 설정
              {postImages.length === 1 && postImages.some(img => img.isNaverImage) && (
                <span className="block mt-1 text-yellow-700">
                  🔥 네이버 이미지 1개 발견! "갤러리 열기"로 저장하세요
                </span>
              )}
            </div>
              <div className="flex gap-2">
                <button
                  type="button"
                onClick={() => setShowImageGallery(!showImageGallery)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                {showImageGallery ? '갤러리 닫기' : '갤러리 열기'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAllImages(!showAllImages);
                  if (!showAllImages) {
                    loadAllImages();
                  } else {
                    // 갤러리를 닫을 때 선택 상태 초기화
                    setSelectedImages(new Set());
                  }
                }}
                className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
              >
                {showAllImages ? '전체 갤러리 닫기' : '전체 이미지 보기'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDuplicates(!showDuplicates);
                  if (!showDuplicates) {
                    findDuplicateImages();
                  }
                }}
                className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
              >
                {showDuplicates ? '중복 관리 닫기' : '중복 이미지 찾기'}
              </button>
              <button
                type="button"
                onClick={() => setShowWebpageScraper(!showWebpageScraper)}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                {showWebpageScraper ? '웹페이지 수집 닫기' : '🌐 웹페이지 이미지 수집'}
              </button>
              
              
        {postImages.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
              {postImages.length}개 이미지
            </span>
            {postImages.length >= 5 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                📦 {Math.ceil(postImages.length / 5)}개 묶음 (5개씩 그룹)
              </span>
            )}
          </div>
        )}
            </div>
          </div>
                  
            {showImageGallery && (
              <div className="mt-4">
                {/* 게시물별 이미지 갤러리 */}
              {editingPost ? (
                // 게시물 편집 모드: 해당 게시물의 이미지만 표시
                postImages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    이 게시물에 연결된 이미지가 없습니다. 이미지를 업로드하거나 AI로 생성해보세요.
                  </p>
                ) : (
                <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">
                      📁 이 게시물의 이미지 ({postImages.length}개)
                    </h5>
                    {/* 이미지 그룹 썸네일 표시 (5개씩 그룹) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: Math.ceil(postImages.length / 5) }, (_, groupIndex) => {
                        const startIndex = groupIndex * 5;
                        const endIndex = Math.min(startIndex + 5, postImages.length);
                        const groupImages = postImages.slice(startIndex, endIndex);
                        
                        return (
                          <ImageGroupThumbnail
                            key={groupIndex}
                            images={groupImages}
                            groupIndex={groupIndex}
                            onImageSelect={(image) => insertImageToContentNew(image.url, image.name || '이미지')}
                            onSetFeatured={(image) => setFeaturedImage(image.url)}
                            onCopyImage={(image) => copyImageUrl(image.url)}
                          />
                        );
                      })}
                </div>

                    {/* 기존 개별 이미지 표시 (개발/디버깅용) */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-8">
                        <h6 className="text-sm font-medium text-gray-600 mb-3">🔧 개발용: 개별 이미지 목록</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {postImages.map((image, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                              <div className="relative">
                                <img
                                  src={image.url}
                                  alt={image.name || `Image ${index + 1}`}
                                  className="w-full h-32 object-contain"
                                />
                                <div className="absolute top-2 right-2 flex gap-1">
                                  {formData.featured_image === image.url && (
                                    <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 font-bold">
                                      ⭐ 대표
                                    </span>
                                  )}
                                  <button
                                    onClick={() => deleteImageByName(image.name)}
                                    className="w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                              <div className="p-3">
                                <div className="text-xs text-gray-600 mb-2 truncate" title={image.name}>
                                  {image.name}
                                </div>
                                <div className="flex gap-1 mb-2">
                                  <button
                                    onClick={() => setFeaturedImage(image.url)}
                                    className={`px-2 py-1 text-xs rounded ${
                                      formData.featured_image === image.url 
                                        ? 'bg-yellow-600 text-white' 
                                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                                    }`}
                                  >
                                    ⭐ 대표
                                  </button>
                                  <button
                                    onClick={() => copyImageUrl(image.url)}
                                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                  >
                                    📋 복사
                                  </button>
                                  <button
                                    onClick={() => selectImageFromGallery(image.url, 'individual')}
                                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                    title="이미지 변형 및 AI 개선용으로 선택"
                                  >
                                    🎨 선택
                                  </button>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => insertImageToContentNew(image.url, image.name || '이미지')}
                                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                  >
                                    📝 삽입
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                // 새 게시물 작성 모드: 전역 이미지 갤러리 표시
                imageGallery.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    아직 이미지가 없습니다. 이미지를 업로드하거나 AI로 생성해보세요.
                  </p>
                ) : (
                <div>
                    <h5 className="text-md font-medium text-gray-800 mb-3">📁 내 이미지 갤러리</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {imageGallery.map((image) => (
                        <div key={image.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                          <div className="relative">
                            <img
                              src={image.url}
                              alt={`Gallery Image ${image.id}`}
                              className="w-full h-32 object-contain"
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                              <span className={`px-2 py-1 text-xs rounded ${
                                image.type === 'upload' ? 'bg-blue-100 text-blue-800' :
                                image.type === 'ai-generated' ? 'bg-purple-100 text-purple-800' :
                                image.type === 'paragraph' ? 'bg-green-100 text-green-800' :
                                image.type === 'recommended' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {image.type === 'upload' ? '업로드' :
                                 image.type === 'ai-generated' ? 'AI생성' :
                                 image.type === 'paragraph' ? '단락' :
                                 image.type === 'recommended' ? '추천' : '기타'}
                              </span>
                              <button
                                onClick={() => removeFromImageGallery(image.id)}
                                className="w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                              >
                                ×
                              </button>
                </div>
                          </div>
                          <div className="p-3">
                            <div className="flex gap-1 mb-2">
                              <button
                                onClick={() => setAsFeaturedImage(image.url)}
                                className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                              >
                                ⭐ 대표
                              </button>
                              <button
                                onClick={() => copyImageUrl(image.url)}
                                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                              >
                                📋 복사
                              </button>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => insertImageToContent(image.url, 'start')}
                                className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                              >
                                앞
                              </button>
                              <button
                                onClick={() => insertImageToContent(image.url, 'middle')}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                중간
                              </button>
                              <button
                                onClick={() => insertImageToContent(image.url, 'end')}
                                className="px-2 py-1 bg-green-700 text-white text-xs rounded hover:bg-green-800"
                              >
                                뒤
                              </button>
                            </div>
                            {image.metadata && (
                              <details className="mt-2 text-xs text-gray-500">
                                <summary className="cursor-pointer">메타데이터</summary>
                                <div className="mt-1 text-xs">
                                  {image.metadata.model && <p>모델: {image.metadata.model}</p>}
                                  {image.metadata.fileName && <p>파일: {image.metadata.fileName}</p>}
                                  {image.metadata.paragraphIndex !== undefined && <p>단락: {image.metadata.paragraphIndex + 1}</p>}
                                  {image.metadata.relevance && <p>관련도: {image.metadata.relevance}%</p>}
                                  {image.metadata.matchedKeywords && <p>키워드: {image.metadata.matchedKeywords.join(', ')}</p>}
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
          
          {/* 전체 이미지 갤러리 */}
          {showAllImages && (
            <div className="mt-4">
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <h5 className="text-md font-medium text-purple-800 mb-2">
                  🌟 전체 이미지 갤러리
                </h5>
                <p className="text-sm text-purple-600">
                  업로드된 모든 이미지를 확인하고 현재 게시물에 삽입할 수 있습니다.
                </p>
              </div>
              
              {isLoadingAllImages ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  <p className="text-gray-500 mt-2">이미지를 불러오는 중...</p>
                </div>
              ) : allImages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  업로드된 이미지가 없습니다.
                </p>
              ) : (
        <div>
                  <div className="flex justify-between items-center mb-3">
                    <h6 className="text-sm font-medium text-gray-700">
                      총 {allImagesPagination.total}개의 이미지 (페이지 {allImagesPagination.currentPage}/{allImagesPagination.totalPages})
                    </h6>
                    <div className="text-xs text-gray-500">
                      💡 이미지를 클릭하여 현재 게시물에 삽입하세요
                    </div>
                  </div>
                  
                  {/* 체크박스 선택 컨트롤 */}
                  <div className="flex justify-between items-center mb-3 p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedImages.size === allImages.length && allImages.length > 0}
                          onChange={handleSelectAllImages}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {selectedImages.size === allImages.length && allImages.length > 0 ? '전체 해제' : '전체 선택'}
                        </span>
          </label>
                      {selectedImages.size > 0 && (
                        <span className="text-sm text-blue-600 font-medium">
                          {selectedImages.size}개 선택됨
                        </span>
                      )}
                    </div>
                    
                    {selectedImages.size > 0 && (
                      <button
                        type="button"
                        onClick={handleBulkDeleteImages}
                        disabled={isDeletingImages}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {isDeletingImages ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            삭제 중...
                          </>
                        ) : (
                          <>
                            🗑️ 선택된 {selectedImages.size}개 삭제
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                    {(() => {
                      // 이미지를 그룹화
                      const imageGroups = groupImagesByBaseName(allImages);
                      const groupEntries = Object.entries(imageGroups);
                      
                      return groupEntries.map(([baseName, imageGroup], groupIndex) => {
                        const representativeImage = getRepresentativeImage(imageGroup as any[]);
                        const versionCount = (imageGroup as any[]).length;
                        
                        // representativeImage가 없는 경우 렌더링하지 않음
                        if (!representativeImage) {
                          return null;
                        }
                        
                        return (
                          <div key={groupIndex} className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
                            (imageGroup as any[]).some((img: any) => selectedImages.has(img.name)) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}>
                            <div className="relative">
                              {/* 체크박스 */}
                              <div className="absolute top-1 left-1 z-10">
                                <input
                                  type="checkbox"
                                  checked={(imageGroup as any[]).some((img: any) => selectedImages.has(img.name))}
                                  onChange={() => {
                                    // 그룹의 모든 이미지 선택/해제
                                    const allSelected = (imageGroup as any[]).every((img: any) => selectedImages.has(img.name));
                                    if (allSelected) {
                                      // 모두 선택된 경우 해제
                                      (imageGroup as any[]).forEach((img: any) => {
                                        if (selectedImages.has(img.name)) {
                                          handleImageSelect(img.name);
                                        }
                                      });
                                    } else {
                                      // 일부만 선택된 경우 모두 선택
                                      (imageGroup as any[]).forEach((img: any) => {
                                        if (!selectedImages.has(img.name)) {
                                          handleImageSelect(img.name);
                                        }
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              
                              <div 
                                className="h-40 flex items-center justify-center bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  // AI 생성 이미지인 경우 확대 보기 모달 열기
                                  if (representativeImage.isGenerated || representativeImage.url?.includes('generated-') || representativeImage.url?.includes('fal-ai') || representativeImage.url?.includes('replicate-') || representativeImage.url?.includes('stability-')) {
                                    setSelectedGeneratedImage(representativeImage.url);
                                    setShowGeneratedImageModal(true);
                                  } else {
                                    // 일반 이미지인 경우 그룹 버전 모달 열기
                                    setSelectedImageGroup(imageGroup as any[]);
                                    setShowImageGroupModal(true);
                                  }
                                }}
                                title={representativeImage.isGenerated ? "클릭하여 AI 생성 이미지 확대 보기" : "클릭하여 이미지 그룹 상세 보기"}
                              >
                                <img
                                  src={representativeImage.url || '/placeholder-image.jpg'}
                                  alt={baseName || `Image Group ${groupIndex + 1}`}
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                              <div className="absolute top-1 right-1">
                                <span className="px-1 py-0.5 text-xs rounded bg-white bg-opacity-80 text-gray-600">
                                  {versionCount}개
                                </span>
                              </div>
                              <div className="absolute bottom-1 right-1">
                                <span className="px-1 py-0.5 text-xs rounded bg-green-500 text-white">
                                  그룹
                                </span>
                              </div>
                            </div>
                            <div className="p-3">
                              <div className="text-sm text-gray-600 truncate font-medium" title={baseName}>
                                {baseName}
                              </div>
                              {/* 그룹 정보 표시 */}
                              <div className="text-sm text-gray-500 mt-1">
                                📦 {versionCount}개 버전 그룹
                              </div>
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {/* 이미지 변형/개선용 선택 버튼 */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectImageFromGallery(representativeImage.url, 'gallery');
                                  }}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                                  title="이미지 변형 및 AI 개선용으로 선택"
                                >
                                  🎨 선택
                                </button>
                <button
                  type="button"
                                  onClick={() => {
                                    // 그룹의 대표 이미지를 현재 게시물에 삽입
                                    if (useWysiwyg) {
                                      const imageHtml = `<img src="${representativeImage.url}" alt="${baseName || '이미지'}" style="max-width: 100%; height: auto;" />`;
                                      const newHtmlContent = htmlContent + imageHtml;
                                      setHtmlContent(newHtmlContent);
                                      const markdownContent = convertHtmlToMarkdown(newHtmlContent);
                                      setFormData(prev => ({ ...prev, content: markdownContent }));
                                    } else {
                                      const imageMarkdown = `![${baseName || '이미지'}](${representativeImage.url})`;
                                      setFormData(prev => ({ ...prev, content: prev.content + '\n' + imageMarkdown }));
                                    }
                                    
                                    // 이미지 갤러리 섹션에 실시간 추가
                                    const newImage = {
                                      id: `temp-${Date.now()}`,
                                      name: representativeImage.name,
                                      url: representativeImage.url,
                                      created_at: new Date().toISOString(),
                                      size: representativeImage.size || 0
                                    };
                                    setPostImages(prev => [newImage, ...prev]);
                                    
                                    alert('대표 이미지가 본문과 갤러리에 삽입되었습니다!');
                                  }}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                >
                                  📝 삽입
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, featured_image: representativeImage.url });
                                    alert('대표 이미지로 설정되었습니다!');
                                  }}
                                  className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                                >
                                  ⭐ 대표
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(representativeImage.url);
                                    alert('대표 이미지 URL이 복사되었습니다!');
                                  }}
                                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  📋 복사
                                </button>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`"${baseName}" 이미지 그룹을 이 게시물에서만 제거하시겠습니까?\n\n(Supabase에는 유지됩니다)`)) {
                                        (imageGroup as any[]).forEach((img: any) => removeImageFromPost(img.name));
                                      }
                                    }}
                                    className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                                    title="게시물에서만 제거 (Supabase 유지)"
                                  >
                                    🔗 링크제거
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`"${baseName}" 이미지 그룹의 모든 버전(${versionCount}개)을 완전히 삭제하시겠습니까?\n\n⚠️ 삭제될 버전들:\n${(imageGroup as any[]).map((img: any) => `• ${getImageVersionInfo(img.name)}`).join('\n')}\n\n이 작업은 되돌릴 수 없습니다!`)) {
                                        // 그룹의 모든 이미지 삭제
                                        (imageGroup as any[]).forEach((img: any) => {
                                          deleteImageFromStorage(img.name);
                                        });
                                      }
                                    }}
                                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                    title={`이미지 그룹의 모든 버전(${versionCount}개)을 Supabase에서 완전 삭제`}
                                  >
                                    🗑️ 완전삭제
                </button>
              </div>
            </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                  
                  {/* 페이지네이션 */}
                  {allImagesPagination.totalPages > 1 && (
                    <div className="mt-4 flex justify-center items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadAllImages(allImagesPagination.currentPage - 1)}
                        disabled={!allImagesPagination.hasPrevPage}
                        className={`px-3 py-1 text-sm rounded ${
                          allImagesPagination.hasPrevPage
                            ? 'bg-gray-500 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        ← 이전
                      </button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, allImagesPagination.totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, allImagesPagination.currentPage - 2) + i;
                          if (pageNum > allImagesPagination.totalPages) return null;
                          
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => loadAllImages(pageNum)}
                              className={`px-2 py-1 text-sm rounded ${
                                pageNum === allImagesPagination.currentPage
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => loadAllImages(allImagesPagination.currentPage + 1)}
                        disabled={!allImagesPagination.hasNextPage}
                        className={`px-3 py-1 text-sm rounded ${
                          allImagesPagination.hasNextPage
                            ? 'bg-gray-500 text-white hover:bg-gray-600'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        다음 →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* 중복 이미지 관리 */}
          {showDuplicates && (
            <div className="mt-4">
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h5 className="text-lg font-semibold text-red-800 mb-3">
                  🔍 중복 이미지 관리
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border border-red-200">
                    <h6 className="font-medium text-red-800 mb-2">📊 중복 검사 결과</h6>
                    <p className="text-sm text-gray-600">
                      • MD5 해시 기반 중복 감지<br/>
                      • 자동 중복 이미지 식별<br/>
                      • 저장 공간 절약 최적화
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-red-200">
                    <h6 className="font-medium text-red-800 mb-2">⚡ 자동 처리</h6>
                    <p className="text-sm text-gray-600">
                      • 중복 이미지 자동 감지<br/>
                      • 기존 레코드 재사용<br/>
                      • 불필요한 저장 방지
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>팁:</strong> 이미지 저장 시 자동으로 중복을 체크하고 기존 이미지를 재사용합니다.
                  </p>
                </div>
              </div>
              
              {isLoadingDuplicates ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  <p className="text-gray-500 mt-2">중복 이미지를 분석하는 중...</p>
                </div>
              ) : duplicateImages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  중복된 이미지가 없습니다! 🎉
                </p>
              ) : (
        <div>
                  <div className="flex justify-between items-center mb-3">
                    <h6 className="text-sm font-medium text-gray-700">
                      중복 이미지 {duplicateImages.length}개 그룹 발견
                    </h6>
                    <div className="text-xs text-gray-500">
                      💡 첫 번째 이미지는 유지하고 나머지를 삭제하세요
            </div>
          </div>
          
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {duplicateImages.map((group, groupIndex) => (
                      <div key={groupIndex} className="bg-white border border-red-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h6 className="text-sm font-medium text-red-700">
                            그룹 {groupIndex + 1}: {group.hash} ({group.count}개 중복)
                          </h6>
                          <button
                            type="button"
                            onClick={() => {
                              const toDelete = group.images.slice(1); // 첫 번째 제외하고 삭제
                              
                              // 사용 중인 이미지가 있는지 확인 (전체 사이트 범위)
                              const usedImages = toDelete.filter(img => img.usageSummary && img.usageSummary.isUsed);
                              if (usedImages.length > 0) {
                                const usedDetails = usedImages.map(img => {
                                  const usageTypes = [];
                                  if (img.usageSummary.blogPosts > 0) usageTypes.push(`블로그 ${img.usageSummary.blogPosts}개`);
                                  if (img.usageSummary.funnelPages > 0) usageTypes.push(`퍼널 ${img.usageSummary.funnelPages}개`);
                                  if (img.usageSummary.staticPages > 0) usageTypes.push(`정적페이지 ${img.usageSummary.staticPages}개`);
                                  
                                  return `${img.name}: ${usageTypes.join(', ')}`;
                                }).join('\n');
                                
                                alert(`⚠️ 전체 사이트에서 사용 중인 이미지가 있습니다!\n\n${usedDetails}\n\n이미지를 삭제하면 해당 페이지들에서 이미지가 깨질 수 있습니다.\n\n삭제를 계속하려면 확인을 다시 눌러주세요.`);
                                return;
                              }
                              
                              deleteDuplicateImages(toDelete.map(img => img.name));
                            }}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          >
                            안전한 중복 삭제 ({group.count - 1}개)
                          </button>
                        </div>
                        
                        {/* 나란히 비교 보기 */}
            <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">📊 나란히 비교 보기</h5>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {group.images.slice(0, 2).map((image, imageIndex) => (
                              <div key={imageIndex} className={`border-2 rounded-lg overflow-hidden ${
                                imageIndex === 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                              }`}>
                                <div className="p-3">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className={`px-3 py-1 text-sm font-medium rounded ${
                                      imageIndex === 0 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-red-500 text-white'
                                    }`}>
                                      {imageIndex === 0 ? '✅ 유지할 이미지' : '❌ 삭제할 이미지'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {new Date(image.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  {/* 큰 이미지 표시 */}
                                  <div className="mb-3">
                                    <img
                                      src={image.url}
                                      alt={image.name}
                                      className="w-full h-48 object-contain rounded border"
                                    />
                                  </div>
                                  
                                  <div className="text-sm text-gray-700 font-medium mb-2" title={image.name}>
                                    {image.name}
                                  </div>
                                  
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div>📁 파일명: {image.name}</div>
                                    <div>📅 생성일: {new Date(image.created_at).toLocaleString()}</div>
                                    <div>🔗 URL: {image.url.substring(0, 50)}...</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* 전체 이미지 목록 */}
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">📋 전체 중복 이미지 목록</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.images.map((image, imageIndex) => (
                              <div key={imageIndex} className={`border rounded-lg overflow-hidden ${
                                imageIndex === 0 ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                              }`}>
                                <div className="flex">
                                  <div className="w-20 h-20 flex-shrink-0">
                                    <img
                                      src={image.url}
                                      alt={image.name}
                  className="w-full h-full object-contain"
                />
                                  </div>
                                  <div className="flex-1 p-2">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className={`px-2 py-1 text-xs rounded ${
                                        imageIndex === 0 
                                          ? 'bg-green-500 text-white' 
                                          : 'bg-red-500 text-white'
                                      }`}>
                                        {imageIndex === 0 ? '유지' : '삭제'}
                                      </span>
                                    </div>
                                    
                                    <div className="text-xs text-gray-600 truncate mb-1" title={image.name}>
                                      {image.name}
                                    </div>
                                    
                                    <div className="text-xs text-gray-500">
                                      {new Date(image.created_at).toLocaleDateString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ <strong>주의:</strong> 중복 이미지 삭제는 되돌릴 수 없습니다. 
                      각 그룹에서 첫 번째 이미지는 유지되고 나머지는 삭제됩니다.
              </p>
            </div>
          </div>
              )}
            </div>
          )}

          {/* 웹페이지 이미지 수집 */}
          {showWebpageScraper && (
            <div className="mt-4">
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h5 className="text-md font-medium text-green-800 mb-2">
                  🌐 웹페이지 이미지 수집
                </h5>
                <p className="text-sm text-green-600">
                  웹페이지 URL을 입력하면 해당 페이지의 모든 이미지를 자동으로 수집하고 Supabase에 저장할 수 있습니다.
                </p>
              </div>
              
              {/* URL 입력 및 옵션 */}
              <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    웹페이지 URL
                  </label>
                  <div className="flex gap-2">
          <input
                      type="url"
                      value={webpageUrl}
                      onChange={(e) => setWebpageUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={handleScrapeWebpageImages}
                      disabled={isScrapingImages || !webpageUrl.trim()}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isScrapingImages ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          수집 중...
                        </>
                      ) : (
                        <>
                          🔍 이미지 수집
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* 고급 옵션 */}
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    ⚙️ 고급 옵션
                  </summary>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">최소 너비 (px)</label>
                      <input
                        type="number"
                        value={scraperOptions.minWidth}
                        onChange={(e) => setScraperOptions(prev => ({ ...prev, minWidth: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">최소 높이 (px)</label>
                      <input
                        type="number"
                        value={scraperOptions.minHeight}
                        onChange={(e) => setScraperOptions(prev => ({ ...prev, minHeight: parseInt(e.target.value) || 0 }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">허용 확장자</label>
                      <input
                        type="text"
                        value={scraperOptions.allowedExtensions.join(', ')}
                        onChange={(e) => setScraperOptions(prev => ({ 
                          ...prev, 
                          allowedExtensions: (e.target.value || '').split(',').map(ext => ext.trim().toLowerCase()).filter(Boolean)
                        }))}
                        placeholder="jpg, png, webp, gif"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="excludeExternal"
                        checked={scraperOptions.excludeExternal}
                        onChange={(e) => setScraperOptions(prev => ({ ...prev, excludeExternal: e.target.checked }))}
                        className="mr-2"
                      />
                      <label htmlFor="excludeExternal" className="text-xs text-gray-600">
                        외부 도메인 제외
          </label>
                    </div>
                  </div>
                </details>
              </div>
              
              {/* 수집된 이미지 목록 */}
              {scrapedImages.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-center">
                      <h6 className="text-sm font-medium text-gray-700">
                        수집된 이미지 {scrapedImages.length}개
                      </h6>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedScrapedImages.size === scrapedImages.length && scrapedImages.length > 0}
                            onChange={handleSelectAllScrapedImages}
                            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {selectedScrapedImages.size === scrapedImages.length && scrapedImages.length > 0 ? '전체 해제' : '전체 선택'}
                          </span>
            </label>
                        {selectedScrapedImages.size > 0 && (
                          <span className="text-sm text-green-600 font-medium">
                            {selectedScrapedImages.size}개 선택됨
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {selectedScrapedImages.size > 0 && (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleDownloadSelectedImages}
                          disabled={isDownloadingImages}
                          className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isDownloadingImages ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              다운로드 중...
                            </>
                          ) : (
                            <>
                              📥 선택된 {selectedScrapedImages.size}개 다운로드
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                      {scrapedImages.map((image, index) => (
                        <div key={index} className={`bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
                          selectedScrapedImages.has(image.src) ? 'border-green-500 bg-green-50' : 'border-gray-200'
                        }`}>
                          <div className="relative">
                            {/* 체크박스 */}
                            <div className="absolute top-1 left-1 z-10">
            <input
                                type="checkbox"
                                checked={selectedScrapedImages.has(image.src)}
                                onChange={() => handleScrapedImageSelect(image.src)}
                                className="w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            
                            <img
                              src={image.src}
                              alt={image.alt || `Image ${index + 1}`}
                              className="w-full h-24 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                
                                // 네이버 이미지인 경우 프록시 시도
                                if (image.src.includes('pstatic.net') && !image.src.includes('/api/image-proxy')) {
                                  console.log('🔄 네이버 이미지 프록시 시도:', image.src);
                                  target.src = `/api/image-proxy?url=${encodeURIComponent(image.src)}`;
                                  return;
                                }
                                
                                // 프록시도 실패한 경우 플레이스홀더 사용
                                target.src = '/placeholder-image.jpg';
                              }}
                            />
                            <div className="absolute top-1 right-1">
                              <span className="px-1 py-0.5 text-xs rounded bg-white bg-opacity-80 text-gray-600">
                                {index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="p-2">
                            <div className="text-xs text-gray-600 truncate" title={image.fileName}>
                              {image.fileName}
                            </div>
                            {image.width && image.height && (
                              <div className="text-xs text-gray-500">
                                {image.width}×{image.height}
                              </div>
                            )}
                            {image.isBackground && (
                              <div className="text-xs text-blue-600">
                                배경 이미지
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 이미지 미리보기 모달 */}
          {showImagePreview && previewImage && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-semibold">이미지 미리보기</h3>
                <button
                    onClick={() => setShowImagePreview(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <img
                      src={previewImage.url}
                      alt={previewImage.name}
                      className="max-w-full max-h-[60vh] object-contain mx-auto"
                    />
            </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">파일 정보</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>파일명:</strong> {previewImage.name}</p>
                      <p><strong>크기:</strong> {previewImage.size ? (previewImage.size / 1024 / 1024).toFixed(2) + ' MB' : '알 수 없음'}</p>
                      <p><strong>생성일:</strong> {new Date(previewImage.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* 이미지 사용 현황 정보 */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">사용 현황</h4>
                    {isLoadingUsageInfo ? (
                      <div className="text-sm text-gray-500">사용 현황을 조회 중...</div>
                    ) : imageUsageInfo ? (
                      <div className="text-sm">
                        {imageUsageInfo.summary.isUsed ? (
                          <div>
                            <div className="text-green-600 font-medium mb-2">
                              📝 전체 사이트에서 사용 중 ({imageUsageInfo.summary.totalUsage}곳)
                            </div>
                            
                            {/* 사용 현황 요약 */}
                            <div className="mb-3 text-gray-600">
                              {imageUsageInfo.summary.blogPosts > 0 && (
                                <span className="inline-block mr-3 mb-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  📰 블로그: {imageUsageInfo.summary.blogPosts}개
                                </span>
                              )}
                              {imageUsageInfo.summary.funnelPages > 0 && (
                                <span className="inline-block mr-3 mb-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                  🎯 퍼널: {imageUsageInfo.summary.funnelPages}개
                                </span>
                              )}
                              {imageUsageInfo.summary.staticPages > 0 && (
                                <span className="inline-block mr-3 mb-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                  📄 정적페이지: {imageUsageInfo.summary.staticPages}개
                                </span>
                              )}
                            </div>
                            
                            {/* 상세 사용 현황 */}
                            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                              {imageUsageInfo.usage.blogPosts.map((post, idx) => (
                                <div key={`blog-${idx}`} className="text-xs text-gray-600 mb-1">
                                  📰 <strong>{post.title}</strong>
                                  <div className="ml-4 text-gray-500">
                                    {post.isFeatured && <span className="text-yellow-600 mr-2">⭐ 대표이미지</span>}
                                    {post.isInContent && <span className="text-blue-600 mr-2">📝 본문</span>}
                                    <span className="text-gray-400">{post.url}</span>
                                  </div>
                                </div>
                              ))}
                              {imageUsageInfo.usage.funnelPages.map((page, idx) => (
                                <div key={`funnel-${idx}`} className="text-xs text-gray-600 mb-1">
                                  🎯 <strong>{page.title}</strong>
                                  <div className="ml-4 text-gray-500">
                                    {page.isFeatured && <span className="text-yellow-600 mr-2">⭐ 대표이미지</span>}
                                    {page.isInContent && <span className="text-blue-600 mr-2">📝 본문</span>}
                                    <span className="text-gray-400">{page.url}</span>
                                  </div>
                                </div>
                              ))}
                              {imageUsageInfo.usage.staticPages.map((page, idx) => (
                                <div key={`static-${idx}`} className="text-xs text-gray-600 mb-1">
                                  📄 <strong>{page.title}</strong>
                                  <div className="ml-4 text-gray-500">
                                    {page.isFeatured && <span className="text-yellow-600 mr-2">⭐ 대표이미지</span>}
                                    {page.isInContent && <span className="text-blue-600 mr-2">📝 본문</span>}
                                    <span className="text-gray-400">{page.url}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            📭 전체 사이트에서 사용되지 않음
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">사용 현황을 불러올 수 없습니다.</div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        // 현재 게시물에 이미지 삽입
                        if (useWysiwyg) {
                          const imageHtml = `<img src="${previewImage.url}" alt="${previewImage.name || '이미지'}" style="max-width: 100%; height: auto;" />`;
                          const newHtmlContent = htmlContent + imageHtml;
                          setHtmlContent(newHtmlContent);
                          const markdownContent = convertHtmlToMarkdown(newHtmlContent);
                          setFormData(prev => ({ ...prev, content: markdownContent }));
                        } else {
                          const imageMarkdown = `![${previewImage.name || '이미지'}](${previewImage.url})`;
                          setFormData(prev => ({ ...prev, content: prev.content + '\n' + imageMarkdown }));
                        }
                        setShowImagePreview(false);
                        alert('이미지가 본문에 삽입되었습니다!');
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      📝 본문에 삽입
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, featured_image: previewImage.url });
                        setShowImagePreview(false);
                        alert('대표 이미지로 설정되었습니다!');
                      }}
                      className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    >
                      ⭐ 대표 이미지로 설정
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(previewImage.url);
                        alert('이미지 URL이 복사되었습니다!');
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      📋 URL 복사
                    </button>
            </div>
          </div>
              </div>
            </div>
          )}
                </div>

                <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                    요약
            </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="게시물 요약"
            />
          </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                    내용 *
            </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              try {
                                // FormData 생성
                                const uploadFormData = new FormData();
                                uploadFormData.append('image', file);
                                
                                // 서버에 업로드
                                const response = await fetch('/api/upload-image', {
                                  method: 'POST',
                                  body: uploadFormData,
                                });
                                
                                if (response.ok) {
                                  const result = await response.json();
                                  const imageMarkdown = `\n\n![업로드 이미지](${result.imageUrl})\n\n`;
                                  
                                  // 먼저 formData 업데이트
                                  const updatedFormData = { 
                                    ...formData, 
                                    content: formData.content + imageMarkdown 
                                  };
                                  setFormData(updatedFormData);
                                  
                                  // 업로드된 이미지를 갤러리에 추가
                                  addToImageGallery(result.imageUrl, 'upload', {
                                    fileName: result.fileName,
                                    uploadedAt: new Date().toISOString()
                                  });
                                  
                                  // 현재 게시물의 이미지 목록에 직접 추가 (즉시 반영)
                                  if (editingPost) {
                                    const newImage = {
                                      id: Date.now() + Math.random(),
                                      name: result.fileName,
                                      size: 0, // 업로드 시에는 크기 정보가 없음
                                      created_at: new Date().toISOString(),
                                      updated_at: new Date().toISOString(),
                                      url: result.imageUrl,
                                      is_featured: false
                                    };
                                    
                                    setPostImages(prev => [newImage, ...prev]);
                                    
                                    // 이미지 업로드 후 게시물을 임시로 저장하여 데이터베이스에 최신 내용 반영
                                    try {
                                      const saveResponse = await fetch(`/api/admin/blog/${editingPost.id}`, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify(updatedFormData),
                                      });
                                      
                                      if (saveResponse.ok) {
                                        console.log('✅ 이미지 업로드 후 게시물 임시 저장 성공');
                                        // 저장 후 갤러리 새로고침
                                        setTimeout(async () => {
                                          await loadPostImages(editingPost.id);
                                        }, 500);
                                      }
                                    } catch (saveError) {
                                      console.error('❌ 게시물 임시 저장 실패:', saveError);
                                    }
                                  }
                                  
                                  alert('이미지가 업로드되었습니다!');
                                } else {
                                  throw new Error('업로드 실패');
                                }
                              } catch (error) {
                                console.error('이미지 업로드 오류:', error);
                                alert('이미지 업로드에 실패했습니다.');
                              }
                            }
                          };
                          input.click();
                        }}
                        className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                      >
                        📁 이미지 업로드
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const imageUrl = prompt('이미지 URL을 입력하세요:');
                          if (imageUrl) {
                            insertImageToContentLegacy(imageUrl);
                          }
                        }}
                        className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        🔗 URL 삽입
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowContentPreview(!showContentPreview)}
                        className={`px-3 py-1 text-xs rounded ${
                          showContentPreview 
                            ? 'bg-green-500 text-white hover:bg-green-600' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {showContentPreview ? '✏️ 편집' : '👁️ 미리보기'}
                      </button>
                      <button
                        type="button"
                        onClick={convertBase64ImagesInContent}
                        className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                      >
                        🔄 Base64 → URL
                      </button>
                    </div>
                  </div>
                  {showContentPreview ? (
                    <div className="w-full p-4 border border-gray-300 rounded-lg bg-white min-h-[300px]">
                      <div className="prose prose-lg prose-gray max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-700 prose-p:leading-relaxed prose-p:text-lg prose-a:text-blue-600 prose-a:font-medium prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:text-gray-700 prose-li:text-gray-700 prose-li:leading-relaxed">
                        {formData.content ? (
                          <MarkdownPreview content={formData.content} />
                        ) : (
                          <p className="text-gray-500 italic">내용이 없습니다. 편집 모드에서 내용을 입력하세요.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 에디터 모드 선택 */}
                      <div className="flex gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() => setUseWysiwyg(true)}
                          className={`px-3 py-1 text-sm rounded ${
                            useWysiwyg 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          🖼️ WYSIWYG (이미지 보기)
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseWysiwyg(false)}
                          className={`px-3 py-1 text-sm rounded ${
                            !useWysiwyg 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          📝 마크다운 (코드 보기)
                        </button>
        </div>

                      {useWysiwyg && !postImages.some(img => img.isNaverImage) ? (
                        <div className="wysiwyg-editor">
                          <style jsx>{`
                            .wysiwyg-editor .ql-editor {
                              min-height: 300px;
                              font-size: 16px;
                              line-height: 1.6;
                            }
                            .wysiwyg-editor .ql-editor img {
                              max-width: 100%;
                              height: auto;
                              border-radius: 8px;
                              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                              margin: 10px 0;
                            }
                            .wysiwyg-editor .ql-toolbar {
                              border-top: 1px solid #ccc;
                              border-left: 1px solid #ccc;
                              border-right: 1px solid #ccc;
                              border-radius: 8px 8px 0 0;
                            }
                            .wysiwyg-editor .ql-container {
                              border-bottom: 1px solid #ccc;
                              border-left: 1px solid #ccc;
                              border-right: 1px solid #ccc;
                              border-radius: 0 0 8px 8px;
                            }
                          `}</style>
                          <ReactQuill
                            key="quill-editor"
                            value={formData.content || htmlContent}
                            onChange={handleQuillChange}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="게시물 내용을 입력하세요. 이미지는 실제로 보입니다!"
                            style={{ minHeight: '300px' }}
                          />
                        </div>
                      ) : (
                        <div>
                          {postImages.some(img => img.isNaverImage) && (
                            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-sm text-yellow-800 flex items-center">
                                <span className="mr-2">⚠️</span>
                                네이버 블로그 이미지가 포함된 포스트는 성능 최적화를 위해 textarea 모드로 표시됩니다.
                              </p>
                            </div>
                          )}
                          <textarea
                            name="content"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            rows={10}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="게시물 내용을 입력하세요. 이미지는 마크다운 형식으로 삽입됩니다: ![설명](이미지URL)"
                            required
            />
                        </div>
                      )}
          </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    💡 {useWysiwyg ? 'WYSIWYG 모드: 이미지가 실제로 보입니다!' : '마크다운 모드: 이미지는 마크다운 형식으로 삽입됩니다: ![설명](이미지URL)'}
                  </p>
        </div>


                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      카테고리
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="고객 후기">고객 후기</option>
                      <option value="기술 및 성능">기술 및 성능</option>
                      <option value="골프 팁 & 가이드">골프 팁 & 가이드</option>
                      <option value="제품 소개">제품 소개</option>
                      <option value="브랜드 스토리">브랜드 스토리</option>
                      <option value="이벤트 & 프로모션">이벤트 & 프로모션</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상태
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="published">발행</option>
                      <option value="draft">초안</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      작성자
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="작성자명"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      조회수
                    </label>
                    <input
                      type="number"
                      value={formData.view_count || 0}
                      onChange={(e) => setFormData({ ...formData, view_count: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="조회수"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    작성일
                  </label>
                  <input
                    type="datetime-local"
                    value={editingPost && editingPost.published_at ? new Date(editingPost.published_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      if (editingPost) {
                        const updatedPost = { ...editingPost, published_at: new Date(e.target.value).toISOString() };
                        setEditingPost(updatedPost);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!editingPost}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingPost ? '작성일을 수정할 수 있습니다' : '새 게시물 작성 시 현재 시간으로 자동 설정됩니다'}
                  </p>
                </div>

                {/* SEO 메타 필드들 */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">SEO 메타 정보</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      메타 제목
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SEO 메타 제목"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      메타 설명
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SEO 메타 설명"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      메타 키워드
                    </label>
                    <input
                      type="text"
                      value={formData.meta_keywords}
                      onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SEO 메타 키워드 (쉼표로 구분)"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_featured" className="ml-2 block text-sm text-gray-700">
                      추천 게시물로 설정
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_scheduled"
                      checked={formData.is_scheduled}
                      onChange={(e) => setFormData({ ...formData, is_scheduled: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_scheduled" className="ml-2 block text-sm text-gray-700">
                      예약 발행 설정
                    </label>
                  </div>

                  {formData.is_scheduled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        발행 예약 시간
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.scheduled_at ? new Date(formData.scheduled_at).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <div className="flex space-x-2">
                  <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingPost(null);
                        resetForm();
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
                    >
                      <span>←</span>
                      <span>뒤로가기</span>
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                      className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    취소
                  </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      onClick={() => setIsManualSave(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingPost ? '수정' : '저장'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* 게시물 목록 */}
          {activeTab === 'list' && (
          <div className="bg-white rounded-lg shadow-md">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            ) : (
              <div className="p-6">
                {posts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">게시물이 없습니다.</p>
                  </div>
                ) : (
                  <>
                    {/* 안전한 선택적 삭제 기능 */}
                    <div className="mb-4 flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedPosts.length === posts.length && posts.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label className="text-sm font-medium text-gray-700">
                            모두 선택
                          </label>
                        </div>
                        
                        {selectedPosts.length > 0 && (
                          <button
                            onClick={handleSelectedDelete}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors flex items-center space-x-1 w-auto"
                          >
                            <span>🗑️</span>
                            <span>선택 삭제</span>
                          </button>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                          >
                            📋 목록
                          </button>
                          <button
                            onClick={() => setViewMode('card')}
                            className={`px-3 py-1 rounded text-sm ${viewMode === 'card' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                          >
                            🎴 카드
                          </button>
                        </div>
                        
                        {/* 정렬 옵션 */}
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium text-gray-700">정렬:</label>
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="published_at">📅 게시일</option>
                            <option value="created_at">⚡ 생성일</option>
                            <option value="updated_at">✏️ 수정일</option>
                            <option value="title">📝 제목</option>
                            <option value="view_count">👁️ 조회수</option>
                          </select>
                          <button
                            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                            className={`px-2 py-1 rounded text-sm ${sortOrder === 'desc' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                            title={sortOrder === 'desc' ? '내림차순 (최신순)' : '오름차순 (오래된순)'}
                          >
                            {sortOrder === 'desc' ? '↓' : '↑'}
                          </button>
                        </div>
                      </div>
                      
                      <span className="text-sm text-gray-500">
                        총 {posts.length}개 게시물
                      </span>
                    </div>
                    
                    {viewMode === 'list' ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${selectedPosts.includes(post.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedPosts.includes(post.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handlePostSelect(post.id);
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-1 cursor-pointer"
                            />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {post.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>카테고리: {post.category}</span>
                              <span>작성자: {post.author}</span>
                              <span>작성일: {new Date(post.published_at).toLocaleDateString('ko-KR')}</span>
                              <span>조회수: {post.view_count || 0}</span>
                              {post.is_featured && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  추천
                                </span>
                              )}
                            </div>
                          </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* 상태 라벨을 액션 버튼 근처로 이동 */}
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              post.status === 'published' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {post.status === 'published' ? '📢 발행됨' : '📝 초안'}
                            </span>
                            <button
                              onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors flex items-center space-x-1"
                            >
                              <span>👁️</span>
                              <span>보기</span>
                            </button>
                            <button
                              onClick={() => handleEdit(post)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                      ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {posts.map((post) => (
                          <div key={post.id} className={`group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-900/5 border overflow-hidden hover:shadow-2xl hover:shadow-slate-900/10 transition-all duration-500 hover:-translate-y-2 ${selectedPosts.includes(post.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200/50'}`}>
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={selectedPosts.includes(post.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handlePostSelect(post.id);
                                }}
                                className="absolute top-4 left-4 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 z-50 cursor-pointer"
                              />
                              <div className="relative h-64 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent z-10"></div>
                                <img
                                  src={post.featured_image || '/placeholder-image.jpg'}
                                  alt={post.title}
                                  className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                                  <span className="px-4 py-2 bg-gradient-to-r from-slate-900 to-slate-700 text-white text-xs font-semibold rounded-full shadow-lg">
                                    {post.category}
                                  </span>
                                </div>
                              </div>
                              <div className="p-6">
                                <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-slate-700 transition-colors duration-200">
                                  {post.title}
                                </h3>
                                <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                                  {post.excerpt}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <time className="font-medium">
                                      {new Date(post.published_at).toLocaleDateString('ko-KR')}
                                    </time>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {/* 상태 라벨을 액션 버튼 근처로 이동 */}
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                      post.status === 'published' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      {post.status === 'published' ? '📢 발행됨' : '📝 초안'}
                                    </span>
                                    <button
                                      onClick={() => {
                                        // 관리자 권한으로 게시물 보기
                                        const url = `/blog/${post.slug}?admin=true`;
                                        window.open(url, '_blank');
                                      }}
                                      className={`px-3 py-1 rounded text-sm transition-colors ${
                                        post.status === 'published'
                                          ? 'bg-green-500 text-white hover:bg-green-600'
                                          : 'bg-orange-500 text-white hover:bg-orange-600'
                                      }`}
                                      title={post.status === 'published' ? '발행된 게시물 보기' : '초안 게시물 보기 (관리자 전용)'}
                                    >
                                      {post.status === 'published' ? '보기' : '미리보기'}
                                    </button>
                                    <button
                                      onClick={() => handleEdit(post)}
                                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                                    >
                                      수정
                                    </button>
                                  </div>
                                </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {/* 이미지 그룹 모달 */}
      {showImageGroupModal && selectedImageGroup.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                📦 이미지 그룹 - {selectedImageGroup.length}개 버전
              </h3>
              <button
                onClick={() => setShowImageGroupModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedImageGroup.map((image, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="relative">
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-32 object-contain rounded mb-2"
                    />
                    <div className="absolute top-1 right-1">
                      <span className="px-2 py-1 text-xs rounded bg-white bg-opacity-80 text-gray-600">
                        {getImageVersionInfo(image.name)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-2 truncate" title={image.name}>
                    {image.name}
                  </div>
                  
                  <div className="flex gap-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        // 현재 게시물에 이미지 삽입
                        if (useWysiwyg) {
                          const imageHtml = `<img src="${image.url}" alt="${image.name || '이미지'}" style="max-width: 100%; height: auto;" />`;
                          const newHtmlContent = htmlContent + imageHtml;
                          setHtmlContent(newHtmlContent);
                          const markdownContent = convertHtmlToMarkdown(newHtmlContent);
                          setFormData(prev => ({ ...prev, content: markdownContent }));
                        } else {
                          const imageMarkdown = `![${image.name || '이미지'}](${image.url})`;
                          setFormData(prev => ({ ...prev, content: prev.content + '\n' + imageMarkdown }));
                        }
                        
                        // 이미지 갤러리 섹션에 실시간 추가
                        const newImage = {
                          id: `temp-${Date.now()}`,
                          name: image.name,
                          url: image.url,
                          created_at: new Date().toISOString(),
                          size: image.size || 0
                        };
                        setPostImages(prev => [newImage, ...prev]);
                        
                        alert('이미지가 본문과 갤러리에 삽입되었습니다!');
                      }}
                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      📝 삽입
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, featured_image: image.url });
                        alert('대표 이미지로 설정되었습니다!');
                      }}
                      className="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                    >
                      ⭐ 대표
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(image.url);
                        alert('이미지 URL이 복사되었습니다!');
                      }}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      📋 복사
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
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

      {/* 스크래핑 이미지 확대 모달 */}
      {showScrapingImageModal && selectedScrapingImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
            {/* 헤더 */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                🖼️ 스크래핑 이미지 확대 보기
              </h3>
              <button
                onClick={() => setShowScrapingImageModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            {/* 이미지 영역 */}
            <div className="p-4 flex justify-center items-center bg-gray-50 min-h-[400px]">
              <img
                src={selectedScrapingImage.src.includes('pstatic.net') 
                  ? `/api/image-proxy?url=${encodeURIComponent(selectedScrapingImage.src)}`
                  : selectedScrapingImage.src
                }
                alt={selectedScrapingImage.alt || '스크래핑 이미지'}
                className="max-w-full max-h-[70vh] object-contain rounded shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.jpg';
                }}
              />
            </div>
            
            {/* 이미지 정보 */}
            <div className="p-4 border-t bg-gray-50">
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>파일명:</strong> {selectedScrapingImage.name || '알 수 없음'}</div>
                <div><strong>원본 URL:</strong> 
                  <a 
                    href={selectedScrapingImage.src} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 ml-1 break-all"
                  >
                    {selectedScrapingImage.src}
                  </a>
                </div>
                {selectedScrapingImage.isNaverImage && (
                  <div className="text-orange-600 font-medium">📌 네이버 블로그 이미지</div>
                )}
              </div>
            </div>
            
            {/* 액션 버튼들 */}
            <div className="p-4 border-t flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedScrapingImage.src);
                    alert('이미지 URL이 복사되었습니다!');
                  }}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  📋 URL 복사
                </button>
                <button
                  onClick={() => {
                    window.open(selectedScrapingImage.src, '_blank');
                  }}
                  className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                >
                  🔗 새 탭에서 열기
                </button>
              </div>
              <button
                onClick={() => setShowScrapingImageModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI 생성 이미지 확대 모달 */}
      {showGeneratedImageModal && selectedGeneratedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden flex flex-col">
            {/* 모달 헤더 */}
            <div className="p-4 border-b bg-orange-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-orange-800">🎨 AI 생성 이미지 확대 보기</h3>
                <button
                  onClick={() => setShowGeneratedImageModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* 이미지 영역 - flex-1로 남은 공간 모두 사용 */}
            <div className="flex-1 p-6 flex items-center justify-center bg-gray-100 overflow-hidden">
              <img
                src={selectedGeneratedImage}
                alt="AI 생성 이미지"
                className="max-w-full max-h-full object-contain rounded shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.jpg';
                }}
              />
            </div>
            
            {/* 이미지 정보 */}
            <div className="p-4 border-t bg-gray-50 flex-shrink-0">
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>이미지 타입:</strong> AI 생성 이미지</div>
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
                <div className="text-orange-600 font-medium">🤖 AI가 생성한 이미지</div>
              </div>
            </div>
            
            {/* 액션 버튼들 */}
            <div className="p-4 border-t flex flex-col sm:flex-row justify-between items-center flex-shrink-0 gap-3">
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedGeneratedImage);
                    alert('이미지 URL이 복사되었습니다!');
                  }}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 whitespace-nowrap"
                >
                  📋 URL 복사
                </button>
                <button
                  onClick={() => {
                    insertImageToContentLegacy(selectedGeneratedImage);
                    setShowGeneratedImageModal(false);
                  }}
                  className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 whitespace-nowrap"
                >
                  ➕ 콘텐츠에 삽입
                </button>
                <button
                  onClick={() => {
                    selectGeneratedImage(selectedGeneratedImage);
                    setShowGeneratedImageModal(false);
                  }}
                  className="px-3 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 whitespace-nowrap"
                >
                  ⭐ 대표 이미지로 설정
                </button>
                <button
                  onClick={() => {
                    window.open(selectedGeneratedImage, '_blank');
                  }}
                  className="px-3 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 whitespace-nowrap"
                >
                  🔗 새 탭에서 열기
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
    </>
  );
}