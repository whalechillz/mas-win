import { useState, useEffect } from 'react';
import Head from 'next/head';
// import WysiwygEditor from '../../components/WysiwygEditor';

export default function BlogAdmin() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'migration'
  
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
    category: '비거리 향상 드라이버',
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
    setMigrationStatus('프로덕션 최적화된 마이그레이션 처리 중...');
    
    try {
      // 향상된 고화질 마이그레이션 (강석님 블로그 방식)
        const migrationResponse = await fetch('/api/migrate-blog-production/', {
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

  // AI 제목 생성 관련 상태
  const [contentSource, setContentSource] = useState('');
  const [generatedTitles, setGeneratedTitles] = useState([]);
  const [showTitleOptions, setShowTitleOptions] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // 추천 이미지 관련 상태
  const [recommendedImages, setRecommendedImages] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  
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
      
      const response = await fetch('/api/admin/blog');
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
      category: '비거리 향상 드라이버',
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

  // 게시물 수정 모드로 전환
  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      ...post,
      tags: Array.isArray(post.tags) ? post.tags : []
    });
    setShowForm(true);
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
                blogPostId: formData.id || null
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
    const imageMarkdown = `\n\n![이미지](${imageUrl})\n\n`;
    setFormData({ 
      ...formData, 
      content: formData.content + imageMarkdown 
    });
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

  // 추천 이미지 로드
  const loadRecommendedImages = async () => {
    if (!formData.title && !formData.excerpt) {
      alert('제목이나 요약을 먼저 입력해주세요.');
      return;
    }

    setIsLoadingRecommendations(true);
    
    try {
      const response = await fetch('/api/get-recommended-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          excerpt: formData.excerpt,
          contentType: brandStrategy.contentType,
          customerPersona: brandStrategy.customerPersona
        })
      });

      if (!response.ok) {
        throw new Error('추천 이미지 로드에 실패했습니다.');
      }

      const data = await response.json();
      setRecommendedImages(data.recommendedImages || []);
      
      console.log('✅ 추천 이미지 로드 완료:', data.recommendedImages?.length || 0, '개');
      alert(`${data.recommendedImages?.length || 0}개의 추천 이미지를 찾았습니다!`);
    } catch (error) {
      console.error('추천 이미지 로드 오류:', error);
      alert(`추천 이미지 로드에 실패했습니다: ${error.message}`);
    } finally {
      setIsLoadingRecommendations(false);
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
                blogPostId: formData.id || null
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

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <>
      <Head>
        <title>블로그 관리자 - MAS Golf</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">블로그 관리</h1>
            <button
              onClick={() => {
                console.log('새 게시물 작성 버튼 클릭됨');
                setActiveTab('create');
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium cursor-pointer z-10 relative"
              style={{ minWidth: '150px', minHeight: '50px' }}
            >
              새 게시물 작성
            </button>
          </div>

          {/* 탭 네비게이션 */}
          <div className="mb-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 블로그 목록
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ✍️ 새 게시물 작성
              </button>
              <button
                onClick={() => setActiveTab('migration')}
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
          프로덕션 환경에 최적화된 마이그레이션으로 안정적인 콘텐츠와 이미지 처리를 제공합니다.
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
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ✕ 닫기
                </button>
              </div>
              
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

        {/* 이미지 갤러리 관리 */}
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-gray-800">🖼️ 이미지 갤러리</h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadRecommendedImages}
                disabled={isLoadingRecommendations}
                className="px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1"
              >
                {isLoadingRecommendations ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    추천 로딩...
                  </>
                ) : (
                  <>
                    🔍 추천 이미지
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowImageGallery(!showImageGallery)}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                {showImageGallery ? '갤러리 닫기' : '갤러리 열기'}
              </button>
              {imageGallery.length > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                  {imageGallery.length}개 이미지
                </span>
              )}
            </div>
          </div>
                  
          {showImageGallery && (
            <div className="mt-4">
              {/* 추천 이미지 섹션 */}
              {recommendedImages.length > 0 && (
                <div className="mb-6">
                  <h5 className="text-md font-medium text-purple-800 mb-3">🎯 현재 콘텐츠에 맞는 추천 이미지</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendedImages.map((image, index) => (
                      <div key={`recommended-${index}`} className="bg-purple-50 border border-purple-200 rounded-lg overflow-hidden shadow-sm">
                        <div className="relative">
                          <img
                            src={image.url}
                            alt={`Recommended Image ${index + 1}`}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute top-2 right-2 flex gap-1">
                            <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                              추천
                            </span>
                            <button
                              onClick={() => addToImageGallery(image.url, 'recommended', {
                                source: 'recommended',
                                relevance: image.relevance,
                                matchedKeywords: image.matchedKeywords
                              })}
                              className="w-5 h-5 bg-purple-500 text-white rounded-full text-xs hover:bg-purple-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="text-xs text-purple-600 mb-2">
                            관련도: {image.relevance}% | 키워드: {image.matchedKeywords?.join(', ')}
                          </div>
                          <div className="flex gap-1">
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 기존 이미지 갤러리 */}
              {imageGallery.length === 0 ? (
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
              )}
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
                                  setFormData({ 
                                    ...formData, 
                                    content: formData.content + imageMarkdown 
                                  });
                                  
                                  // 업로드된 이미지를 갤러리에 추가
                                  addToImageGallery(result.imageUrl, 'upload', {
                                    fileName: result.fileName,
                                    uploadedAt: new Date().toISOString()
                                  });
                                  
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
                      <div className="prose prose-sm max-w-none">
                        {formData.content ? (
                          <div dangerouslySetInnerHTML={{
                            __html: formData.content
                              .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg shadow-sm border mb-4" />')
                              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                              .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                              .replace(/### ([^\n]+)/g, '<h3 class="text-lg font-bold mb-2 text-gray-900">$1</h3>')
                              .replace(/## ([^\n]+)/g, '<h2 class="text-xl font-bold mb-3 text-gray-900">$1</h2>')
                              .replace(/# ([^\n]+)/g, '<h1 class="text-2xl font-bold mb-4 text-gray-900">$1</h1>')
                              .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">')
                              .replace(/^/, '<p class="mb-4 leading-relaxed">')
                              .replace(/$/, '</p>')
                          }} />
                        ) : (
                          <p className="text-gray-500 italic">내용이 없습니다. 편집 모드에서 내용을 입력하세요.</p>
                        )}
                      </div>
                    </div>
                  ) : (
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="게시물 내용을 입력하세요. 이미지는 마크다운 형식으로 삽입됩니다: ![설명](이미지URL)"
                    required
                  />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    💡 이미지는 마크다운 형식으로 삽입됩니다: ![설명](이미지URL)
                  </p>
                </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            대표 이미지
          </label>
          
          {/* 이미지 미리보기 */}
          {formData.featured_image && (
            <div className="mb-4">
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                <img
                  src={formData.featured_image}
                  alt="미리보기"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleImageDelete}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  title="이미지 삭제"
                >
                  ×
                </button>
              </div>
              {/* 대표이미지 본문 삽입 버튼 */}
              <div className="mt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => insertFeaturedImageToContent('start')}
                  className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  📝 앞에 삽입
                </button>
                <button
                  type="button"
                  onClick={() => insertFeaturedImageToContent('middle')}
                  className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                >
                  📝 중간 삽입
                </button>
                <button
                  type="button"
                  onClick={() => insertFeaturedImageToContent('end')}
                  className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                >
                  📝 뒤에 삽입
                </button>
              </div>
            </div>
          )}
          
          {/* 드래그 앤 드롭 영역 */}
          <div
            className={`w-full h-32 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
              isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              handleImageUpload(e.dataTransfer.files[0]);
            }}
          >
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">
                이미지를 드래그하거나 클릭하여 업로드
              </p>
            </div>
          </div>
          
          {/* 파일 선택 버튼 */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files[0])}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="mt-2 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            이미지 선택
          </label>
          
          {/* URL 직접 입력 */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              또는 URL 직접 입력
            </label>
            <div className="flex gap-2">
            <input
              type="url"
              value={formData.featured_image}
              onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg 또는 /blog/images/image.png"
            />
              {formData.featured_image && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => insertFeaturedImageToContent('start')}
                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    앞
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFeaturedImageToContent('middle')}
                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    중간
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFeaturedImageToContent('end')}
                    className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                  >
                    뒤
                  </button>
                </div>
              )}
            </div>
          </div>
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
                      <option value="비거리 향상 드라이버">비거리 향상 드라이버</option>
                      <option value="맞춤형 드라이버">맞춤형 드라이버</option>
                      <option value="고객 성공 스토리">고객 성공 스토리</option>
                      <option value="골프 팁 & 가이드">골프 팁 & 가이드</option>
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

                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingPost ? '수정' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    취소
                  </button>
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
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {post.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {post.excerpt}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>카테고리: {post.category}</span>
                              <span>상태: {post.status === 'published' ? '발행' : '초안'}</span>
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
                          <div className="flex space-x-2">
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