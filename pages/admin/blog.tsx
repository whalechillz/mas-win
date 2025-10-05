import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
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
  const [imageGenerationPrompt, setImageGenerationPrompt] = useState('');
  const [imageGenerationModel, setImageGenerationModel] = useState('');
  const [showGenerationProcess, setShowGenerationProcess] = useState(false);

  // 이미지 관리 관련 상태
  const [postImages, setPostImages] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showImageGroupModal, setShowImageGroupModal] = useState(false);
  const [selectedImageGroup, setSelectedImageGroup] = useState([]);

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

  // 간단 AI 이미지 개선 관련 상태
  const [simpleAIImageRequest, setSimpleAIImageRequest] = useState('');
  const [selectedImageForImprovement, setSelectedImageForImprovement] = useState('');
  const [isImprovingImage, setIsImprovingImage] = useState(false);

  // 저장된 프롬프트 관리 상태
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [expandedPromptId, setExpandedPromptId] = useState(null);
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [editingKoreanPrompt, setEditingKoreanPrompt] = useState('');

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

  // 제목에서 슬러그 자동 생성
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // AI 이미지 생성 함수들
  const generateAIImage = async (count = 4) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('🎨 AI 이미지 생성 시작...', count, '개');
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
          contentType: formData.category,
          brandStrategy: {
            contentType: formData.category,
            customerPersona: 'competitive_maintainer',
            customerChannel: '',
            brandWeight: 'none'
          },
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
          contentType: formData.category,
          brandStrategy: {
            contentType: formData.category,
            customerPersona: 'competitive_maintainer',
            customerChannel: '',
            brandWeight: 'none'
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
  const generateFALAIImage = async (count = 4) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('🎨 FAL AI 이미지 생성 시작...', count, '개');
      setIsGeneratingImages(true);
      setShowGenerationProcess(true);
      setImageGenerationModel('ChatGPT + FAL AI');
      
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
            customerPersona: 'competitive_maintainer',
            customerChannel: '',
            brandWeight: 'none'
          },
          model: 'fal'
        })
      });

      if (!promptResponse.ok) {
        throw new Error('ChatGPT 프롬프트 생성 실패');
      }

      const { prompt: smartPrompt } = await promptResponse.json();
      setImageGenerationPrompt(smartPrompt);
      
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
            customerPersona: 'competitive_maintainer',
            customerChannel: '',
            brandWeight: 'none'
          },
          imageCount: count,
          customPrompt: smartPrompt
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ FAL AI 이미지 생성 완료:', result.imageUrls.length, '개');
        setImageGenerationStep('3단계: FAL AI 이미지 생성 완료!');
        
        // 생성된 이미지들을 상태에 추가
        setGeneratedImages(prev => [...prev, ...result.imageUrls]);
        setShowGeneratedImages(true);
        
        alert(`${result.imageUrls.length}개의 FAL AI 이미지가 생성되었습니다! 원하는 이미지를 선택하세요.`);
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
  const generateGoogleAIImage = async (count = 4) => {
    if (!formData.title) {
      alert('제목을 먼저 입력해주세요.');
      return;
    }

    try {
      console.log('🎨 Google AI 이미지 생성 시작...', count, '개');
      setIsGeneratingImages(true);
      setShowGenerationProcess(true);
      setImageGenerationModel('ChatGPT + Google AI');
      
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
            customerPersona: 'competitive_maintainer',
            customerChannel: '',
            brandWeight: 'none'
          },
          model: 'google'
        })
      });

      if (!promptResponse.ok) {
        throw new Error('ChatGPT 프롬프트 생성 실패');
      }

      const { prompt: smartPrompt } = await promptResponse.json();
      setImageGenerationPrompt(smartPrompt);
      
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
            customerPersona: 'competitive_maintainer',
            customerChannel: '',
            brandWeight: 'none'
          },
          imageCount: count,
          customPrompt: smartPrompt
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Google AI 이미지 생성 완료:', result.imageUrls.length, '개');
        setImageGenerationStep('3단계: Google AI 이미지 생성 완료!');
        
        // 생성된 이미지들을 상태에 추가
        setGeneratedImages(prev => [...prev, ...result.imageUrls]);
        setShowGeneratedImages(true);
        
        alert(`${result.imageUrls.length}개의 Google AI 이미지가 생성되었습니다! 원하는 이미지를 선택하세요.`);
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

  // 이미지를 내용에 삽입
  const insertImageToContent = (imageUrl) => {
    const imageMarkdown = `\n\n![이미지](${imageUrl})\n\n`;
    setFormData({ 
      ...formData, 
      content: formData.content + imageMarkdown 
    });
    alert('이미지가 내용에 삽입되었습니다!');
  };

  // 이미지 관리 관련 함수들
  const fetchImageGallery = async () => {
    try {
      const response = await fetch('/api/admin/all-images?page=1&limit=50');
      const data = await response.json();
      
      if (response.ok) {
        setAllImages(data.images || []);
        console.log('✅ 이미지 갤러리 로드 성공:', data.images?.length || 0, '개');
      } else {
        console.error('❌ 이미지 갤러리 로드 실패:', data.error);
      }
    } catch (error) {
      console.error('❌ 이미지 갤러리 로드 에러:', error);
    }
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
        baseImageUrl: selectedBaseImage,
        strength: variationStrength
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
                  imageUrl: result.images[i].publicUrl || result.images[i],
                  fileName: `${model.toLowerCase().replace(' ', '-')}-variation-${Date.now()}-${i + 1}.png`,
                  blogPostId: editingPost?.id || null
                })
              });
              
              if (saveResponse.ok) {
                const { storedUrl } = await saveResponse.json();
                savedImages.push(storedUrl);
              } else {
                savedImages.push(result.images[i].publicUrl || result.images[i]);
              }
            } catch (error) {
              console.warn(`이미지 ${i + 1} 저장 실패:`, error);
              savedImages.push(result.images[i].publicUrl || result.images[i]);
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

  // 정렬 옵션 변경 시 새로고침
  useEffect(() => {
    if (posts.length > 0) {
      fetchPosts(sortBy, sortOrder);
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
                  window.open('/admin/ai-dashboard', '_blank');
                }}
                className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
              >
                🤖 AI 관리
              </button>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    제목 *
          </label>
                                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      title: e.target.value,
                      slug: generateSlug(e.target.value)
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="게시물 제목을 입력하세요"
                    required
                                    />
                                  </div>
                                  
                {/* 슬러그 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    슬러그
                  </label>
                      <input
                        type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="url-friendly-slug"
                  />
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

                {/* 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    내용 *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="게시물 내용을 입력하세요"
                    required
                  />
                </div>

                {/* AI 이미지 생성 섹션 */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">🎨 AI 이미지 생성</h3>
                    <span className="text-sm text-gray-500">제목과 내용을 바탕으로 AI가 이미지를 생성합니다</span>
                  </div>

                  {/* AI 이미지 생성 버튼들 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => generateAIImage(4)}
                      disabled={isGeneratingImages}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGeneratingImages && imageGenerationModel === 'ChatGPT + DALL-E 3' ? (
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <span>🎨</span>
                      )}
                      ChatGPT + DALL-E 3
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => generateFALAIImage(4)}
                      disabled={isGeneratingImages}
                      className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGeneratingImages && imageGenerationModel === 'ChatGPT + FAL AI' ? (
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <span>🎨</span>
                      )}
                      ChatGPT + FAL AI
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => generateGoogleAIImage(4)}
                      disabled={isGeneratingImages}
                      className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isGeneratingImages && imageGenerationModel === 'ChatGPT + Google AI' ? (
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <span>🎨</span>
                      )}
                      ChatGPT + Google AI
                    </button>
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
                              src={imageUrl}
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
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectGeneratedImage(imageUrl);
                                  }}
                                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  ⭐ 대표
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    insertImageToContent(imageUrl);
                                  }}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                >
                                  ➕ 삽입
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyImageUrl(imageUrl);
                                  }}
                                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                >
                                  📋 복사
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

                {/* 이미지 변형 시스템 섹션 */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center space-x-2 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">🎨 이미지 변형 시스템</h3>
                    <span className="text-sm text-gray-500">기존 이미지를 AI로 변형하고 개선할 수 있습니다</span>
                  </div>

                  <div className="space-y-6">
                    {/* 기본 이미지 선택 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        변형할 기본 이미지 선택
                      </label>
                      {selectedBaseImage ? (
                        <div className="flex items-center space-x-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <img
                            src={selectedBaseImage}
                            alt="선택된 기본 이미지"
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-image.jpg';
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800">기본 이미지가 선택되었습니다</p>
                            <p className="text-xs text-green-600 truncate">{selectedBaseImage}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedBaseImage('')}
                            className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                          >
                            선택 해제
                          </button>
                        </div>
                      ) : (
                        <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
                          <p className="text-gray-500 mb-2">아래 이미지 갤러리에서 변형할 이미지를 선택하세요</p>
                          <p className="text-xs text-gray-400">이미지에 마우스를 올리고 "🎨 변형" 버튼을 클릭하세요</p>
                        </div>
                      )}
                    </div>

                    {/* 변형 강도 설정 */}
                    {selectedBaseImage && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          변형 강도: {Math.round(variationStrength * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={variationStrength}
                          onChange={(e) => setVariationStrength(parseFloat(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>약간 변형 (10%)</span>
                          <span>강하게 변형 (100%)</span>
                        </div>
                      </div>
                    )}

                    {/* AI 모델 선택 및 변형 버튼 */}
                    {selectedBaseImage && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          AI 변형 모델 선택
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => generateImageVariation('FAL AI')}
                            disabled={isGeneratingVariation}
                            className="p-4 border border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-2">🎨</div>
                              <div className="font-medium text-gray-900">FAL AI</div>
                              <div className="text-xs text-gray-500 mt-1">고품질 이미지 변형</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => generateImageVariation('Replicate Flux')}
                            disabled={isGeneratingVariation}
                            className="p-4 border border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-2">⚡</div>
                              <div className="font-medium text-gray-900">Replicate Flux</div>
                              <div className="text-xs text-gray-500 mt-1">빠른 이미지 변형</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => generateImageVariation('Stability AI')}
                            disabled={isGeneratingVariation}
                            className="p-4 border border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-2">🌟</div>
                              <div className="font-medium text-gray-900">Stability AI</div>
                              <div className="text-xs text-gray-500 mt-1">안정적인 변형</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 변형 과정 표시 */}
                    {isGeneratingVariation && showGenerationProcess && imageGenerationStep && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">
                          🎨 {imageGenerationModel} 이미지 변형 과정
                        </h4>
                        <div className="text-sm text-blue-700">
                          {imageGenerationStep}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 이미지 갤러리 섹션 */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">🖼️ 이미지 갤러리</h3>
                      <span className="text-sm text-gray-500">전체 이미지를 관리하고 선택할 수 있습니다</span>
                    </div>
                    <button
                      type="button"
                      onClick={fetchImageGallery}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                    >
                      🔄 새로고침
                    </button>
                  </div>

                  {/* 이미지 갤러리 컨트롤 */}
                  {allImages.length > 0 && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedImages.size === allImages.length && allImages.length > 0}
                              onChange={handleSelectAllImages}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">
                              전체 선택 ({selectedImages.size}/{allImages.length})
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
                  {allImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {Object.entries(groupImagesByBaseName(allImages)).map(([baseName, imageGroup]) => {
                        const group = imageGroup as any[];
                        const representativeImage = getRepresentativeImage(group);
                        if (!representativeImage) return null;

                        return (
                          <div key={baseName} className="relative group">
                            <div
                              className="cursor-pointer border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 transition-colors"
                              onClick={() => handleImageGroupClick(group)}
                            >
                              <img
                                src={representativeImage.url}
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
                                <div className="text-xs text-gray-500">
                                  {group.length}개 버전
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFormData({ ...formData, featured_image: representativeImage.url });
                                    alert('대표 이미지로 설정되었습니다!');
                                  }}
                                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                                >
                                  ⭐ 대표
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    insertImageToContent(representativeImage.url);
                                  }}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                >
                                  ➕ 삽입
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyImageUrl(representativeImage.url);
                                  }}
                                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                                >
                                  📋 복사
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    selectBaseImage(representativeImage.url);
                                  }}
                                  className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                                >
                                  🎨 변형
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>이미지가 없습니다. 위의 AI 이미지 생성 기능을 사용하거나 이미지를 업로드하세요.</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl max-h-[95vh] w-full overflow-hidden flex flex-col">
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
                    insertImageToContent(selectedGeneratedImage);
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
                        src={image.url}
                        alt={image.name}
                        className="w-full h-40 object-cover"
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
                      <div className="text-xs text-gray-500 mt-1">
                        크기: {image.size ? `${(image.size / 1024).toFixed(1)}KB` : '알 수 없음'}
                      </div>
                      <div className="flex gap-1 flex-wrap mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, featured_image: image.url });
                            alert('대표 이미지로 설정되었습니다!');
                          }}
                          className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          ⭐ 대표
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            insertImageToContent(image.url);
                          }}
                          className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                        >
                          ➕ 삽입
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            copyImageUrl(image.url);
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
    </>
  );
}