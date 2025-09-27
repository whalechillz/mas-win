import { useState, useEffect } from 'react';
import Head from 'next/head';
import { marked } from 'marked';
import dynamic from 'next/dynamic';
// import WysiwygEditor from '../../components/WysiwygEditor';

// React Quill을 동적으로 로드 (SSR 문제 방지)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
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
const convertMarkdownToHtml = (markdown) => {
  if (!markdown) return '';
  
  // marked 설정
  marked.setOptions({
    breaks: true, // 줄바꿈을 <br>로 변환
    gfm: true, // GitHub Flavored Markdown 지원
  });
  
  return marked(markdown);
};

export default function BlogAdmin() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'migration'
  const [selectedPosts, setSelectedPosts] = useState([]); // 선택된 게시물 ID들
  const [viewMode, setViewMode] = useState('list'); // 'list' 또는 'card'
  const [sortBy, setSortBy] = useState('published_at'); // 정렬 기준
  const [sortOrder, setSortOrder] = useState('desc'); // 정렬 순서
  const [postImages, setPostImages] = useState([]); // 게시물 이미지 목록
  
  // 디버깅용 useEffect
  useEffect(() => {
    console.log('showForm 상태:', showForm);
  }, [showForm]);
  const [editingPost, setEditingPost] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
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

  // AI 제목 생성 관련 상태
  const [contentSource, setContentSource] = useState('');
  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [showTitleOptions, setShowTitleOptions] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // WYSIWYG 에디터 상태
  const [useWysiwyg, setUseWysiwyg] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  
  // 이미지 생성 과정 투명성 상태
  const [imageGenerationStep, setImageGenerationStep] = useState('');
  const [imageGenerationPrompt, setImageGenerationPrompt] = useState('');
  const [imageGenerationModel, setImageGenerationModel] = useState('');
  const [showGenerationProcess, setShowGenerationProcess] = useState(false);
  
  // 프롬프트 미리보기 상태
  const [previewPrompt, setPreviewPrompt] = useState('');
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [selectedImageCount, setSelectedImageCount] = useState(1);

  // 게시물 목록 불러오기
  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log('🔍 게시물 목록 불러오는 중...');
      
      // 정렬 파라미터 추가
      const sortParams = new URLSearchParams({
        sortBy: sortBy,
        sortOrder: sortOrder
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
  };

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

  // WYSIWYG 에디터 내용 변경 핸들러
  const handleQuillChange = (content) => {
    setHtmlContent(content);
    // HTML을 마크다운으로 변환하여 formData에 저장
    const markdownContent = convertHtmlToMarkdown(content);
    setFormData(prev => ({
      ...prev,
      content: markdownContent
    }));
  };

  // 게시물 저장/수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 디버깅: 어떤 이벤트가 폼 제출을 트리거했는지 확인
    console.log('🚨 handleSubmit 호출됨!');
    console.log('🚨 이벤트 타입:', e.type);
    console.log('🚨 이벤트 타겟:', e.target);
    console.log('🚨 이벤트 현재 타겟:', e.currentTarget);
    
    // 의도하지 않은 호출인지 확인 (이벤트 타겟이 submit 버튼이 아닌 경우)
    // 단, 명시적으로 저장 버튼을 클릭한 경우는 허용
    if (e.target && e.target.type !== 'submit' && e.target.tagName !== 'BUTTON' && !e.target.textContent?.includes('수정') && !e.target.textContent?.includes('저장')) {
      console.log('🚨 의도하지 않은 폼 제출 감지, 무시합니다.');
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
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
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

  // 게시물 수정 모드로 전환
  const handleEdit = async (post) => {
    setEditingPost(post);
    setFormData({
      ...post,
      tags: Array.isArray(post.tags) ? post.tags : []
    });
    
    // 마크다운을 HTML로 변환하여 WYSIWYG 에디터에 표시
    const htmlContent = await convertMarkdownToHtml(post.content);
    setHtmlContent(htmlContent);
    
    // 대표 이미지가 있으면 이미지 갤러리에 추가
    if (post.featured_image) {
      addToImageGallery(post.featured_image, 'featured', {
        isFeatured: true,
        loadedAt: new Date().toISOString()
      });
    }
    
    setShowForm(true);
    // 게시물 이미지 목록 로드
    loadPostImages(post.id);
  };

  // 게시물 이미지 목록 로드
  const loadPostImages = async (postId) => {
    try {
      const response = await fetch(`/api/admin/blog-images?postId=${postId}`);
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
  };

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

  // 블로그 분석 데이터 로드
  const [blogAnalytics, setBlogAnalytics] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  // AI 사용량 통계 데이터 로드
  const [aiUsageStats, setAiUsageStats] = useState(null);
  const [isLoadingAIStats, setIsLoadingAIStats] = useState(false);

  const loadBlogAnalytics = async (period = '7d', excludeInternal = false) => {
    setIsLoadingAnalytics(true);
    try {
      const url = `/api/admin/blog-analytics?period=${period}${excludeInternal ? '&excludeInternal=true' : ''}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBlogAnalytics(data);
        console.log('✅ 블로그 분석 로드 성공:', data.totalViews, '조회수', excludeInternal ? '(내부 제외)' : '');
      } else {
        console.error('❌ 블로그 분석 로드 실패');
      }
    } catch (error) {
      console.error('❌ 블로그 분석 로드 에러:', error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const resetBlogAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/blog-analytics-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ 블로그 분석 데이터 리셋 성공');
        alert('모든 블로그 분석 데이터가 삭제되었습니다.');
        setBlogAnalytics(null);
      } else {
        console.error('❌ 블로그 분석 리셋 실패');
        alert('데이터 리셋에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 블로그 분석 리셋 에러:', error);
      alert('데이터 리셋 중 오류가 발생했습니다.');
    }
  };

  // AI 사용량 통계 로드
  const loadAIUsageStats = async (period = '7d') => {
    setIsLoadingAIStats(true);
    try {
      const url = `/api/admin/ai-usage-stats?period=${period}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAiUsageStats(data);
        console.log('✅ AI 사용량 통계 로드 성공:', data.stats.totalRequests, '요청', data.stats.totalCost.toFixed(6), '달러');
      } else {
        console.error('❌ AI 사용량 통계 로드 실패');
      }
    } catch (error) {
      console.error('❌ AI 사용량 통계 로드 에러:', error);
    } finally {
      setIsLoadingAIStats(false);
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
  const deleteImage = async (imageName) => {
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
        setFormData({
          ...formData,
          slug
        });
      } else {
        console.error('AI 슬러그 생성 실패');
      }
    } catch (error) {
      console.error('AI 슬러그 생성 에러:', error);
      alert('AI 슬러그 생성 중 오류가 발생했습니다.');
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
      const extension = mimeType.split('/')[1] || 'jpg';
      
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
    const lines = content.split('\n');
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
  const addToImageGallery = (imageUrl, type = 'upload', metadata = {}) => {
    const newImage = {
      id: Date.now() + Math.random(),
      url: imageUrl,
      type: type, // 'upload', 'ai-generated', 'paragraph', 'featured'
      metadata: metadata,
      addedAt: new Date().toISOString()
    };
    
    setImageGallery(prev => [newImage, ...prev]);
    return newImage;
  };

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
      const lines = content.split('\n');
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

  // ChatGPT 프롬프트로 FAL AI 이미지 생성
  const generateFALAIImages = async (count = 4) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('📸 ChatGPT + FAL AI 실사 이미지 생성 시작...', count, '개');
      setIsGeneratingImages(true);
      setShowGenerationProcess(true);
      setImageGenerationModel('ChatGPT + FAL AI (hidream-i1-dev)');
      
      // 1단계: ChatGPT로 스마트 프롬프트 생성
      setImageGenerationStep('1단계: ChatGPT로 실사 프롬프트 생성 중...');
      const promptResponse = await fetch('/api/generate-smart-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: brandStrategy.contentType,
          brandStrategy: brandStrategy,
          model: 'fal'
        })
      });

      if (!promptResponse.ok) {
        throw new Error('ChatGPT 프롬프트 생성 실패');
      }

      const { prompt: smartPrompt } = await promptResponse.json();
      setImageGenerationPrompt(smartPrompt);
      
      // 2단계: FAL AI API 호출
      setImageGenerationStep('2단계: FAL AI 서버에 이미지 생성 요청 중...');
      const response = await fetch('/api/generate-blog-image-fal', {
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
            // 마크다운을 HTML로 변환
            const htmlContent = convertMarkdownToHtml(data.improvedContent);
            setHtmlContent(htmlContent);
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

  useEffect(() => {
    fetchPosts();
  }, []);

  // 정렬 옵션 변경 시 자동 새로고침
  useEffect(() => {
    if (posts.length > 0) { // 초기 로드가 아닐 때만
      fetchPosts();
    }
  }, [sortBy, sortOrder]);

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


          {/* 게시물 작성/수정 폼 */}
          {(activeTab === 'create' || showForm) && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                {editingPost ? '게시물 수정' : '새 게시물 작성'}
              </h2>
              
              {/* 블로그 분석 및 AI 사용량 버튼 - 최상단으로 이동 */}
              {editingPost && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      loadBlogAnalytics('7d');
                    }}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center gap-2"
                  >
                    📊 블로그 분석
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      loadAIUsageStats('7d');
                    }}
                    className="px-4 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 flex items-center gap-2"
                  >
                    🤖 AI 사용량
                  </button>
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

              {/* 블로그 분석 대시보드 - 상단으로 이동 */}
              {blogAnalytics && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-blue-800">
                      📊 블로그 분석 대시보드
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('내부 카운터(테스트, localhost 등)를 제외하시겠습니까?')) {
                            loadBlogAnalytics('7d', true);
                          }
                        }}
                        className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                        title="내부 카운터 제외"
                      >
                        🔍 내부 제외
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('정말로 모든 블로그 분석 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                            resetBlogAnalytics();
                          }
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                        title="모든 데이터 삭제"
                      >
                        🗑️ 리셋
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlogAnalytics(null)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">총 조회수</h4>
                      <p className="text-2xl font-bold text-blue-600">{blogAnalytics.totalViews.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">트래픽 소스</h4>
                      <p className="text-lg font-semibold text-green-600">{blogAnalytics.trafficSources.length}개</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">검색어</h4>
                      <p className="text-lg font-semibold text-purple-600">{blogAnalytics.searchKeywords.length}개</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">캠페인</h4>
                      <p className="text-lg font-semibold text-orange-600">{blogAnalytics.utmCampaigns.length}개</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 트래픽 소스 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-800 mb-3">🚦 트래픽 소스</h4>
                      <div className="space-y-2">
                        {blogAnalytics.trafficSources.slice(0, 5).map((source, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{source.source}</span>
                            <span className="text-sm font-medium text-blue-600">{source.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 검색어 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-800 mb-3">🔍 검색어</h4>
                      <div className="space-y-2">
                        {blogAnalytics.searchKeywords.slice(0, 5).map((keyword, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 truncate">{keyword.keyword}</span>
                            <span className="text-sm font-medium text-green-600">{keyword.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* UTM 캠페인 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-800 mb-3">📢 UTM 캠페인</h4>
                      <div className="space-y-2">
                        {blogAnalytics.utmCampaigns.slice(0, 5).map((campaign, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 truncate">{campaign.campaign}</span>
                            <span className="text-sm font-medium text-purple-600">{campaign.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 블로그별 조회수 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-800 mb-3">📝 블로그별 조회수</h4>
                      <div className="space-y-2">
                        {blogAnalytics.blogViews.slice(0, 5).map((blog, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-600 truncate">{blog.title}</p>
                              <p className="text-xs text-gray-400">{blog.category}</p>
                            </div>
                            <span className="text-sm font-medium text-orange-600">{blog.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* AI 사용량 대시보드 */}
              {aiUsageStats && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-purple-800">
                      🤖 AI 사용량 대시보드
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('다른 기간의 AI 사용량을 조회하시겠습니까?')) {
                            loadAIUsageStats('30d');
                          }
                        }}
                        className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
                        title="30일간 사용량 조회"
                      >
                        📅 30일
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiUsageStats(null)}
                        className="text-purple-600 hover:text-purple-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">총 요청수</h4>
                      <p className="text-2xl font-bold text-purple-600">{aiUsageStats.stats.totalRequests.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">총 토큰</h4>
                      <p className="text-2xl font-bold text-blue-600">{aiUsageStats.stats.totalTokens.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">총 비용</h4>
                      <p className="text-2xl font-bold text-green-600">${aiUsageStats.stats.totalCost.toFixed(6)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">평균 비용/요청</h4>
                      <p className="text-2xl font-bold text-orange-600">${aiUsageStats.stats.avgCostPerRequest.toFixed(6)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 엔드포인트별 통계 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-800 mb-3">🔗 엔드포인트별 사용량</h4>
                      <div className="space-y-2">
                        {aiUsageStats.stats.endpointStats.slice(0, 5).map((endpoint, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{endpoint.endpoint}</span>
                            <div className="text-right">
                              <span className="text-sm font-medium text-purple-600">{endpoint.requests}회</span>
                              <br />
                              <span className="text-xs text-gray-500">${endpoint.cost.toFixed(6)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 모델별 통계 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-800 mb-3">🤖 모델별 사용량</h4>
                      <div className="space-y-2">
                        {aiUsageStats.stats.modelStats.slice(0, 5).map((model, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{model.model}</span>
                            <div className="text-right">
                              <span className="text-sm font-medium text-blue-600">{model.requests}회</span>
                              <br />
                              <span className="text-xs text-gray-500">${model.cost.toFixed(6)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 일별 통계 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-800 mb-3">📅 일별 사용량</h4>
                      <div className="space-y-2">
                        {aiUsageStats.stats.dailyStats.slice(0, 5).map((day, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">{day.date}</span>
                            <div className="text-right">
                              <span className="text-sm font-medium text-green-600">{day.requests}회</span>
                              <br />
                              <span className="text-xs text-gray-500">${day.cost.toFixed(6)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 최근 사용 로그 */}
                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="text-sm font-medium text-gray-800 mb-3">📋 최근 사용 로그</h4>
                      <div className="space-y-2">
                        {aiUsageStats.recentLogs.slice(0, 5).map((log, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-600 truncate">{log.api_endpoint}</p>
                              <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
                            </div>
                            <span className="text-sm font-medium text-orange-600">${log.cost.toFixed(6)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
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

                {/* AI 제목 생성 버튼 */}
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
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      title="AI로 SEO 최적화된 슬러그 생성"
                    >
                      🤖 AI
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
                      🔧 AI 개선
                    </button>
                    <button 
                      type="button"
                      onClick={() => generateAIContent('meta')} 
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                    >
                      🤖 AI 메타
                    </button>
                    {/* ChatGPT 프롬프트 미리보기 버튼들 */}
                    <button 
                      type="button"
                      onClick={() => previewImagePrompt('dalle3')} 
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                    >
                      🤖 ChatGPT + DALL-E 3 프롬프트 미리보기
                    </button>
                    <button 
                      type="button"
                      onClick={() => previewImagePrompt('fal')} 
                      className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs"
                    >
                      🤖 ChatGPT + FAL AI 프롬프트 미리보기
                    </button>
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

                  {/* AI 이미지 생성 버튼들 */}
                  <div className="flex flex-wrap gap-2">
                    <button 
                      type="button"
                      onClick={() => generateMultipleAIImages(selectedImageCount)} 
                      disabled={isGeneratingImages}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm disabled:opacity-50"
                    >
                      {isGeneratingImages ? '🤖 생성 중...' : `🤖 ChatGPT + DALL-E 3 ${selectedImageCount}개`}
                    </button>
                    <button 
                      type="button"
                      onClick={() => generateFALAIImages(selectedImageCount)} 
                      disabled={isGeneratingImages}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm disabled:opacity-50"
                    >
                      {isGeneratingImages ? '🤖 생성 중...' : `🤖 ChatGPT + FAL AI ${selectedImageCount}개`}
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
                  
                  <p className="text-xs text-gray-600 mt-2">
                    선택한 전략에 따라 마쓰구 브랜드가 자연스럽게 통합된 콘텐츠를 생성합니다.
                    <br />
                    <span className="text-blue-600 font-medium">🔍 브랜드 정보 검색 기능이 포함되어 정확한 정보를 반영합니다.</span>
                    <br />
                    <span className="text-orange-600 font-medium">🤖 ChatGPT + DALL-E 3: 요약 기반으로 ChatGPT가 프롬프트를 생성하고 DALL-E 3로 고품질 실사 이미지를 만듭니다.</span>
                    <br />
                    <span className="text-red-600 font-medium">🤖 ChatGPT + FAL AI: 요약 기반으로 ChatGPT가 프롬프트를 생성하고 FAL AI로 초고품질 실사 이미지를 만듭니다.</span>
                    <br />
                    <span className="text-orange-500 font-medium">✨ 여러 이미지 생성: 1개, 2개 또는 4개의 다양한 이미지를 생성하여 선택할 수 있습니다.</span>
                    <br />
                    <span className="text-purple-600 font-medium">📝 단락별 이미지: 내용의 각 단락에 맞는 다양한 이미지를 생성하여 글을 완성할 수 있습니다.</span>
                  </p>
                  
                  {/* 프롬프트 미리보기 표시 */}
                  {showPromptPreview && previewPrompt && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-green-800">
                          🤖 ChatGPT 생성 프롬프트 미리보기
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowPromptPreview(false)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          ✕ 닫기
                        </button>
                </div>
                      <div className="p-3 bg-white border border-green-200 rounded">
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {previewPrompt}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 이미지 생성 과정 표시 */}
                  {showGenerationProcess && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        🎨 {imageGenerationModel} 이미지 생성 과정
                      </h4>
                      <div className="text-sm text-blue-700 mb-2">
                        {imageGenerationStep}
                      </div>
                      {imageGenerationPrompt && (
                        <div className="mt-3 p-3 bg-white border border-blue-200 rounded">
                          <h5 className="text-xs font-medium text-blue-800 mb-1">생성된 프롬프트:</h5>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {imageGenerationPrompt}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>


                {/* AI 생성 이미지 선택 UI */}
                {showGeneratedImages && generatedImages.length > 0 && (
                  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="text-lg font-semibold text-orange-800 mb-3">🎨 AI 생성 이미지 선택</h4>
                    <p className="text-sm text-orange-700 mb-4">
                      AI가 생성한 {generatedImages.length}개의 이미지 중에서 원하는 이미지를 선택하세요. 클릭하면 대표 이미지로 설정됩니다.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {generatedImages.map((imageUrl, index) => (
                        <div 
                          key={index}
                          className="cursor-pointer border-2 border-gray-200 rounded-lg overflow-hidden hover:border-orange-500 transition-colors"
                          onClick={() => selectGeneratedImage(imageUrl)}
                        >
                          <div className="aspect-w-16 aspect-h-9">
                            <img
                              src={imageUrl}
                              alt={`AI 생성 이미지 ${index + 1}`}
                              className="w-full h-32 object-cover"
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
                            </div>
                            <p className="text-xs text-gray-600">클릭하여 대표이미지 선택</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowGeneratedImages(false)}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                )}

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
                              className="w-32 h-20 object-cover rounded border"
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

        {/* 대표 이미지 섹션 - 최우선 위치 (이미지 갤러리 위) */}
        <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
          <h4 className="text-xl font-bold text-blue-900 mb-4 flex items-center">
            🖼️ 대표 이미지 관리
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">최우선</span>
          </h4>
          <div className="space-y-4">
        <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                대표 이미지 URL
          </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="대표 이미지 URL을 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, featured_image: '' })}
                  className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  title="대표 이미지 제거"
                >
                  🗑️ 제거
                </button>
              </div>
            </div>
            
            {formData.featured_image ? (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-green-700 flex items-center">
                    ✅ 현재 대표 이미지
                  </p>
                  {/* 외부 링크인 경우 Supabase에 저장 버튼 */}
                  {formData.featured_image.includes('unsplash.com') || formData.featured_image.includes('http') ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/admin/save-external-image', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              imageUrl: formData.featured_image,
                              fileName: `featured-image-${Date.now()}.jpg`
                            })
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            setFormData({ ...formData, featured_image: result.supabaseUrl });
                            
                            // 이미지 갤러리에 자동 추가 (원본 URL 메타데이터로 보존)
                            addToImageGallery(result.supabaseUrl, 'featured', {
                              originalUrl: result.originalUrl,
                              savedAt: new Date().toISOString(),
                              fileName: result.fileName,
                              source: 'external-import'
                            });
                            
                            alert('✅ 외부 이미지가 Supabase에 저장되고 이미지 갤러리에 추가되었습니다!');
                          } else {
                            alert('❌ 이미지 저장에 실패했습니다.');
                          }
                        } catch (error) {
                          console.error('이미지 저장 오류:', error);
                          alert('❌ 이미지 저장 중 오류가 발생했습니다.');
                        }
                      }}
                      className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                      title="외부 이미지를 Supabase에 저장하고 최적화"
                    >
                      💾 Supabase에 저장
                    </button>
                  ) : null}
                </div>
                
                <div className="relative w-full max-w-lg">
                <img
                  src={formData.featured_image}
                    alt="대표 이미지 미리보기"
                    className="w-full h-40 object-cover rounded-lg border-2 border-gray-200 shadow-md"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <div className="hidden w-full h-40 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center text-gray-500 text-sm">
                    이미지를 불러올 수 없습니다
                  </div>
                </div>
                
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 break-all">
                  <strong>현재 URL:</strong> {formData.featured_image}
                </div>
                
                {/* 원본 URL 정보 표시 (메타데이터에서) */}
                {(() => {
                  const featuredImageInGallery = imageGallery.find(img => 
                    img.url === formData.featured_image && img.metadata?.originalUrl
                  );
                  return featuredImageInGallery?.metadata?.originalUrl ? (
                    <div className="mt-1 p-2 bg-blue-50 rounded text-xs text-blue-600 break-all">
                      <strong>원본 출처:</strong> {featuredImageInGallery.metadata.originalUrl}
                    </div>
                  ) : null;
                })()}
                
                {/* 이미지 상태 표시 */}
                <div className="mt-2 flex items-center gap-2">
                  {formData.featured_image.includes('supabase.co') ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      ✅ Supabase 최적화됨
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      ⚠️ 외부 링크 (불안정)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium">
                  ⚠️ 대표 이미지가 설정되지 않았습니다. 블로그 목록에서 이미지가 표시되지 않을 수 있습니다.
                </p>
              </div>
            )}
            
            <div className="bg-blue-100 p-3 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 <strong>권장사항:</strong> 외부 URL (Unsplash 등)은 불안정할 수 있으니 "💾 Supabase에 저장" 버튼을 눌러 안정적인 호스팅과 최적화를 받으세요.
              </p>
            </div>
          </div>
        </div>

        {/* 이미지 갤러리 관리 */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-800">🖼️ 이미지 갤러리</h4>
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
              
              
              {postImages.length > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {postImages.length}개 이미지
                </span>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {postImages.map((image, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                          <div className="relative">
                            <img
                              src={image.url}
                              alt={image.name || `Image ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute top-2 right-2 flex gap-1">
                              {formData.featured_image === image.url && (
                                <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 font-bold">
                                  ⭐ 대표
                                </span>
                              )}
                              <button
                                onClick={() => deleteImage(image.name)}
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
                              className="w-full h-32 object-cover"
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
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto">
                    {allImages.map((image, index) => (
                      <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative">
                          <img
                            src={image.url}
                            alt={image.name || `Image ${index + 1}`}
                            className="w-full h-24 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              // 이미지 미리보기 모달 열기
                              setPreviewImage(image);
                              setShowImagePreview(true);
                              // 이미지 사용 현황 자동 로드
                              loadImageUsageInfo(image.url);
                            }}
                          />
                          <div className="absolute top-1 right-1">
                            <span className="px-1 py-0.5 text-xs rounded bg-white bg-opacity-80 text-gray-600">
                              {index + 1}
                            </span>
                </div>
                        </div>
                        <div className="p-2">
                          <div className="text-xs text-gray-600 truncate" title={image.name}>
                            {image.name}
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
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
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`"${image.name}" 이미지를 이 게시물에서만 제거하시겠습니까?\n\n(Supabase에는 유지됩니다)`)) {
                                    removeImageFromPost(image.name);
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
                                  if (confirm(`정말로 "${image.name}" 이미지를 Supabase에서 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`)) {
                                    deleteImageFromStorage(image.name);
                                  }
                                }}
                                className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                                title="Supabase에서 완전 삭제"
                              >
                                🗑️ 완전삭제
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 페이지네이션 */}
                  {allImagesPagination.totalPages > 1 && (
                    <div className="mt-4 flex justify-center items-center gap-2">
                      <button
                        type="button"
                        onClick={() => loadAllImages(allImagesPagination.prevPage)}
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
                        onClick={() => loadAllImages(allImagesPagination.nextPage)}
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
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <h5 className="text-md font-medium text-red-800 mb-2">
                  🔍 중복 이미지 관리
                </h5>
                <p className="text-sm text-red-600">
                  중복된 이미지를 찾아서 정리하고 저장 공간을 절약하세요.
                </p>
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
                          <h7 className="text-sm font-medium text-red-700">
                            그룹 {groupIndex + 1}: {group.hash} ({group.count}개 중복)
                          </h7>
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
                                      className="w-full h-48 object-cover rounded border"
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
                  className="w-full h-full object-cover"
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
                          <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(formData.content) }} />
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

                      {useWysiwyg ? (
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
                            value={htmlContent}
                            onChange={handleQuillChange}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="게시물 내용을 입력하세요. 이미지는 실제로 보입니다!"
                            style={{ minHeight: '300px' }}
                          />
                        </div>
                      ) : (
                        <textarea
                          name="content"
                          value={formData.content}
                          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="게시물 내용을 입력하세요. 이미지는 마크다운 형식으로 삽입됩니다: ![설명](이미지URL)"
                          required
            />
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
                    value={editingPost ? new Date(editingPost.published_at).toISOString().slice(0, 16) : ''}
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
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                                      onClick={() => window.open(`/blog/${post.slug}`, '_blank')}
                                      className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                                    >
                                      보기
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
    </>
  );
}