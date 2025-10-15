import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import AdminNav from '../../components/admin/AdminNav';
import { useSession } from 'next-auth/react';

interface ContentCalendarItem {
  id: string;
  title: string;
  content_type: string;
  content_date: string;
  status: string;
  target_audience: {
    persona: string;
    stage: string;
  };
  conversion_tracking: {
    landingPage: string;
    goal: string;
    utmParams: any;
  };
  published_channels: string[];
  blog_post_id?: string;
  // 멀티채널 관련 필드 추가
  parent_content_id?: string;
  target_audience_type?: 'existing_customer' | 'new_customer';
  channel_type?: string;
  is_root_content?: boolean;
  derived_content_count?: number;
  multichannel_status?: 'pending' | 'generating' | 'completed' | 'failed';
  naver_blog_account?: string;
  naver_blog_account_name?: string;
  generated_images?: any[];
  image_generation_status?: 'pending' | 'generating' | 'completed' | 'failed';
  landing_page_url?: string;
  landing_page_strategy?: any;
  utm_parameters?: any;
  performance_metrics?: any;
  conversion_goals?: string[];
  tracking_enabled?: boolean;
  // 트리 구조용
  children?: ContentCalendarItem[];
  level?: number;
}

export default function ContentCalendar() {
  const { data: session, status } = useSession();
  const [contents, setContents] = useState<ContentCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'calendar' | 'tree' | 'tab' | 'table'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // 멀티채널 뷰 관련 상태
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedTargetAudience, setSelectedTargetAudience] = useState<'all' | 'existing_customer' | 'new_customer'>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [treeContents, setTreeContents] = useState<ContentCalendarItem[]>([]);

  // 연간 콘텐츠 생성 관련 상태
  const [showAnnualGenerator, setShowAnnualGenerator] = useState(false);
  const [annualGenerationPeriod, setAnnualGenerationPeriod] = useState('3months');
  const [annualContentCategory, setAnnualContentCategory] = useState('funnel_campaigns');
  const [annualPublishFrequency, setAnnualPublishFrequency] = useState('weekly');
  const [isGeneratingAnnual, setIsGeneratingAnnual] = useState(false);
  const [generatedAnnualContent, setGeneratedAnnualContent] = useState(null);
  const [selectedContentItems, setSelectedContentItems] = useState<string[]>([]);
  const [contentDates, setContentDates] = useState<{[key: string]: string}>({});
  
  // 빠른 추가 상태
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddDate, setQuickAddDate] = useState('');
  
  // 템플릿 기반 생성 상태
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateDate, setTemplateDate] = useState('');
  
  // 달력뷰 추가 상태
  const [showDateModal, setShowDateModal] = useState(false);
  const [uploadedMdFiles, setUploadedMdFiles] = useState<any[]>([]);
  const [showUploadedFiles, setShowUploadedFiles] = useState(false);
  
  // 섹션 접기/펼치기 상태
  const [isFileUploadCollapsed, setIsFileUploadCollapsed] = useState(true);
  const [isAnnualGeneratorCollapsed, setIsAnnualGeneratorCollapsed] = useState(true);

  // 인증 체크
  useEffect(() => {
    if (status === 'loading') return; // 로딩 중이면 대기
    
    if (!session) {
      // 인증되지 않은 경우 로그인 페이지로 리다이렉트
      window.location.href = '/admin/login';
      return;
    }
  }, [session, status]);

  useEffect(() => {
    if (session) { // 인증된 경우에만 데이터 로드
      fetchContentCalendar();
      loadMdFiles(); // MD 파일 로드
    }
  }, [session]);

  // 트리 구조로 변환하는 함수
  const convertToTreeStructure = (contents: ContentCalendarItem[]): ContentCalendarItem[] => {
    const rootContents = contents.filter(content => content.is_root_content);
    const derivedContents = contents.filter(content => !content.is_root_content);
    
    return rootContents.map(root => {
      const children = derivedContents.filter(derived => derived.parent_content_id === root.id);
      return {
        ...root,
        children: children,
        level: 0
      };
    });
  };

  // 블로그 포스트 동기화 함수
  const handleSyncBlogToCalendar = async () => {
    try {
      const confirmed = confirm('기존 블로그 포스트들을 콘텐츠 캘린더에 동기화하시겠습니까?\n\n주의: 기존 콘텐츠 캘린더 데이터가 모두 삭제됩니다.');
      if (!confirmed) return;

      const response = await fetch('/api/admin/sync-blog-to-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`동기화 완료!\n\n${result.message}\n연결된 항목: ${result.verifiedCount}개`);
        fetchContentCalendar(); // 데이터 새로고침
      } else {
        const errorData = await response.json();
        alert(`동기화 실패: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('동기화 오류:', error);
      alert('동기화 중 오류가 발생했습니다.');
    }
  };

  // 멀티채널 콘텐츠 생성 함수
  const handleMultichannelGeneration = async (contentId: string) => {
    try {
      // 콘텐츠 정보에서 blog_post_id 찾기
      const content = contents.find(c => c.id === contentId);
      const blogPostId = content?.blog_post_id;
      
      if (!blogPostId) {
        alert('멀티채널 생성을 위해 블로그 포스트가 연결되어야 합니다.');
        return;
      }
      
      console.log('멀티채널 생성 요청:', { contentId, blogPostId, content });
      
      const response = await fetch('/api/multichannel/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogPostId: blogPostId,
          targetAudiences: ['existing_customer', 'new_customer']
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`멀티채널 콘텐츠가 생성되었습니다! 총 ${result.totalChannels}개 채널`);
        fetchContentCalendar(); // 데이터 새로고침
      } else {
        const errorData = await response.json();
        console.error('멀티채널 생성 오류 응답:', errorData);
        alert(`멀티채널 생성에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('멀티채널 생성 오류:', error);
      alert('멀티채널 생성 중 오류가 발생했습니다.');
    }
  };

  // 이미지 생성 함수
  const handleImageGeneration = async (contentId: string, targetAudience: string, platforms: string[]) => {
    try {
      const response = await fetch('/api/multichannel/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentId,
          targetAudience: targetAudience,
          platforms: platforms,
          generateNaverBlogImages: true,
          blogImageCount: 3
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`이미지가 생성되었습니다! 총 ${result.totalImages}개 이미지`);
        fetchContentCalendar(); // 데이터 새로고침
      } else {
        alert('이미지 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    }
  };

  // 트리 노드 확장/축소
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const updateContentStatus = async (contentId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/blog/update-calendar-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogPostId: contentId,
          status: newStatus,
          publishedAt: newStatus === 'published' ? new Date().toISOString() : null,
          publishedChannels: newStatus === 'published' ? ['blog'] : []
        })
      });

      if (response.ok) {
        alert(`콘텐츠 상태가 "${newStatus}"로 변경되었습니다!`);
        fetchContentCalendar(); // 데이터 새로고침
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('상태 변경 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 연간 콘텐츠 생성 함수 (퍼널 캠페인 기반)
  const handleAnnualContentGeneration = async () => {
    setIsGeneratingAnnual(true);
    setGeneratedAnnualContent(null);
    setSelectedContentItems([]);

    try {
      const response = await fetch('/api/content-calendar/generate-annual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: annualGenerationPeriod,
          category: annualContentCategory,
          frequency: annualPublishFrequency,
          includeFunnelCampaigns: true,
          uploadedMdFiles: uploadedMdFiles.map(file => ({
            name: file.name,
            content: file.content
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedAnnualContent(data.contentPlan);
        alert(`✅ ${data.contentPlan.length}개의 연간 콘텐츠 계획이 생성되었습니다!`);
      } else {
        throw new Error('연간 콘텐츠 생성 실패');
      }
    } catch (error) {
      console.error('연간 콘텐츠 생성 오류:', error);
      alert('연간 콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingAnnual(false);
    }
  };

  // 파일 업로드 처리 (MD, TXT, HTML, PDF 지원)
  const handleMdFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files).map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      content: '', // 파일 내용은 나중에 읽어옴
      file: file
    }));

    // 파일 내용 읽기
    for (let i = 0; i < newFiles.length; i++) {
      try {
        const content = await readFileContent(newFiles[i].file);
        newFiles[i].content = content;
      } catch (error) {
        console.error('파일 읽기 오류:', error);
        alert(`파일 ${newFiles[i].name} 읽기 실패`);
      }
    }

    const updatedFiles = [...uploadedMdFiles, ...newFiles];
    setUploadedMdFiles(updatedFiles);
    
    // 자동으로 데이터베이스에 저장
    try {
      const response = await fetch('/api/content-calendar/save-md-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: updatedFiles })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ MD 파일이 자동 저장되었습니다:', data.message);
        }
      }
    } catch (error) {
      console.error('MD 파일 자동 저장 오류:', error);
    }
  };

  // 파일 내용 읽기 함수
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string || '');
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // MD 파일 삭제
  const removeMdFile = async (index: number) => {
    const updatedFiles = uploadedMdFiles.filter((_, i) => i !== index);
    setUploadedMdFiles(updatedFiles);
    
    // 데이터베이스에서도 삭제
    try {
      const response = await fetch('/api/content-calendar/save-md-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: updatedFiles })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ MD 파일이 삭제되었습니다:', data.message);
        }
      }
    } catch (error) {
      console.error('MD 파일 삭제 오류:', error);
    }
  };

  // 제목 다시 생성 함수
  const handleRegenerateTitles = async () => {
    if (!generatedAnnualContent || generatedAnnualContent.length === 0) {
      alert('먼저 콘텐츠를 생성해주세요.');
      return;
    }

    setIsGeneratingAnnual(true);

    try {
      const response = await fetch('/api/content-calendar/regenerate-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingContent: generatedAnnualContent,
          category: annualContentCategory
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedAnnualContent(data.regeneratedContent);
        alert('✅ 제목이 다시 생성되었습니다!');
      } else {
        throw new Error('제목 재생성 실패');
      }
    } catch (error) {
      console.error('제목 재생성 오류:', error);
      alert('제목 재생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingAnnual(false);
    }
  };

  // 편집 버튼 - 블로그 편집기로 이동
  const handleEditContent = async (content: any) => {
    try {
      // 연결되어 있으면 바로 편집기로 이동
      if (content.blog_post_id) {
        window.open(`/admin/blog?edit=${content.blog_post_id}`, '_blank');
        return;
      }
      // 연결 없으면 API 호출로 초안 생성 후 연결
      const resp = await fetch('/api/admin/calendar/attach-to-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId: content.id })
      });
      if (!resp.ok) throw new Error('Attach failed');
      const { blogPostId } = await resp.json();
      window.open(`/admin/blog?edit=${blogPostId}`, '_blank');
      fetchContentCalendar();
    } catch (e) {
      console.error('편집 연결 오류:', e);
      alert('블로그 편집기로 연결 중 오류가 발생했습니다.');
    }
  };

  // 멀티채널 생성
  const handleMultiChannelGenerate = async (content: any) => {
    try {
      const response = await fetch('/api/multichannel/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogContent: {
            title: content.title,
            content: content.content_body || content.description,
            category: content.content_type
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ 멀티채널 콘텐츠가 생성되었습니다!\n\n생성된 채널: ${data.channels.join(', ')}`);
      } else {
        throw new Error('멀티채널 생성 실패');
      }
    } catch (error) {
      console.error('멀티채널 생성 오류:', error);
      alert('멀티채널 콘텐츠 생성 중 오류가 발생했습니다.');
    }
  };

  // 초안으로 보관
  const handleSaveAsDraft = async (content: any) => {
    try {
      const response = await fetch('/api/blog/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.title,
          content: content.content_body || content.description,
          category: content.content_type || 'blog',
          status: 'draft',
          meta_description: content.seo_meta?.description || '',
          meta_keywords: content.seo_meta?.keywords || ''
        })
      });

      if (response.ok) {
        alert('✅ 콘텐츠가 초안으로 저장되었습니다.');
        fetchContentCalendar();
      } else {
        throw new Error('초안 저장 실패');
      }
    } catch (error) {
      console.error('초안 저장 오류:', error);
      alert('초안 저장 중 오류가 발생했습니다.');
    }
  };

  // 빠른 추가 함수
  const handleQuickAdd = async () => {
    if (!quickAddTitle || !quickAddDate) {
      alert('제목과 날짜를 모두 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/content-calendar/add-generated-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItems: [{
            title: quickAddTitle,
            description: `${quickAddTitle}에 대한 블로그 포스트입니다.`,
            content_type: 'blog',
            target_audience: {
              persona: '시니어 골퍼',
              stage: 'awareness'
            },
            conversion_tracking: {
              goal: '홈페이지 방문',
              landingPage: 'https://win.masgolf.co.kr'
            },
            estimatedPublishDate: quickAddDate,
            status: 'draft'
          }]
        })
      });

      if (response.ok) {
        alert('✅ 콘텐츠가 빠르게 추가되었습니다!');
        setQuickAddTitle('');
        setQuickAddDate('');
        fetchContentCalendar();
      } else {
        throw new Error('빠른 추가 실패');
      }
    } catch (error) {
      console.error('빠른 추가 오류:', error);
      alert('빠른 추가 중 오류가 발생했습니다.');
    }
  };

  // 템플릿 기반 빠른 생성
  const handleTemplateGenerate = async () => {
    if (!selectedTemplate || !templateDate) {
      alert('템플릿과 날짜를 선택해주세요.');
      return;
    }

    const templates = {
      'seasonal': {
        title: '계절별 골프 가이드',
        description: '현재 계절에 맞는 골프 연습법과 주의사항을 안내합니다.',
        category: 'seasonal_campaign'
      },
      'product_review': {
        title: '제품 리뷰 및 후기',
        description: '마쓰구프 제품에 대한 상세한 리뷰와 고객 후기를 소개합니다.',
        category: 'product_review'
      },
      'tips': {
        title: '골프 실력 향상 팁',
        description: '시니어 골퍼를 위한 실용적인 골프 팁과 노하우를 제공합니다.',
        category: 'golf_tips'
      },
      'news': {
        title: '골프 업계 뉴스',
        description: '최신 골프 업계 동향과 이슈를 전달합니다.',
        category: 'golf_news'
      }
    };

    const template = templates[selectedTemplate];
    if (!template) return;

    try {
      const response = await fetch('/api/content-calendar/add-generated-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItems: [{
            title: template.title,
            description: template.description,
            content_type: 'blog',
            target_audience: {
              persona: '시니어 골퍼',
              stage: 'awareness'
            },
            conversion_tracking: {
              goal: '홈페이지 방문',
              landingPage: 'https://win.masgolf.co.kr'
            },
            estimatedPublishDate: templateDate,
            status: 'draft'
          }]
        })
      });

      if (response.ok) {
        alert('✅ 템플릿 기반 콘텐츠가 추가되었습니다!');
        setSelectedTemplate('');
        setTemplateDate('');
        fetchContentCalendar();
      } else {
        throw new Error('템플릿 생성 실패');
      }
    } catch (error) {
      console.error('템플릿 생성 오류:', error);
      alert('템플릿 생성 중 오류가 발생했습니다.');
    }
  };

  // 달력 유틸리티 함수들
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getContentForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return contents.filter(content => {
      const contentDate = content.content_date;
      return contentDate && contentDate.startsWith(dateStr);
    });
  };


  // 달력 네비게이션
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDateModal(true);
  };

  // 선택된 콘텐츠를 캘린더에 추가
  const addSelectedContentToCalendar = async () => {
    if (selectedContentItems.length === 0) {
      alert('추가할 콘텐츠를 선택해주세요.');
      return;
    }

    try {
      const selectedContent = generatedAnnualContent.filter((_, index) => 
        selectedContentItems.includes(index.toString())
      );

      const response = await fetch('/api/content-calendar/add-generated-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentItems: selectedContent
        })
      });

      if (response.ok) {
        alert(`✅ ${selectedContent.length}개의 콘텐츠가 캘린더에 추가되었습니다!`);
        setSelectedContentItems([]);
        setGeneratedAnnualContent(null);
        fetchContentCalendar(); // 데이터 새로고침
      } else {
        throw new Error('캘린더 추가 실패');
      }
    } catch (error) {
      console.error('캘린더 추가 오류:', error);
      alert('캘린더 추가 중 오류가 발생했습니다.');
    }
  };

  // MD 파일 로드 함수
  const loadMdFiles = async () => {
    try {
      const response = await fetch('/api/content-calendar/load-md-files');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.files) {
          setUploadedMdFiles(data.files.map((file: any) => ({
            name: file.filename,
            type: file.file_type,
            size: file.file_size,
            content: file.content
          })));
        }
      }
    } catch (error) {
      console.error('MD 파일 로드 오류:', error);
    }
  };

  // MD 파일 저장 함수
  const saveMdFiles = async () => {
    if (uploadedMdFiles.length === 0) return;
    
    try {
      const response = await fetch('/api/content-calendar/save-md-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: uploadedMdFiles })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ MD 파일이 저장되었습니다:', data.message);
        }
      }
    } catch (error) {
      console.error('MD 파일 저장 오류:', error);
    }
  };

  const fetchContentCalendar = async () => {
    try {
      setLoading(true);
      
      // 실제 Supabase에서 콘텐츠 캘린더 데이터 가져오기
      const response = await fetch('/api/admin/content-calendar');
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 콘텐츠 캘린더 API 응답:', data);
        console.log('📝 받은 콘텐츠:', data.contents ? data.contents.length : 0, '개');
        console.log('🔍 디버그 정보:', data.debug);
        console.log('📅 캘린더 데이터:', data.calendarCount, '개');
        console.log('📄 블로그 데이터:', data.blogCount, '개');
        
        if (data.contents) {
          data.contents.forEach((content, index) => {
            console.log(`📋 콘텐츠 ${index + 1}: "${content.title}" (${content.content_date})`);
          });
        }
        
        setContents(data.contents || []);
      } else {
        console.error('❌ 콘텐츠 캘린더 API 호출 실패');
        setContents([]);
      }
    } catch (error) {
      console.error('콘텐츠 캘린더 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'awareness': return 'bg-blue-100 text-blue-800';
      case 'consideration': return 'bg-yellow-100 text-yellow-800';
      case 'decision': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // 로딩 중이거나 인증되지 않은 경우
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return null; // 리다이렉트 중
  }

  return (
    <>
      <Head>
        <title>콘텐츠 캘린더 - MASGOLF Admin</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">📅 콘텐츠 캘린더</h1>
                <p className="mt-2 text-gray-600">월별 콘텐츠 계획 및 발행 일정을 관리합니다</p>
              </div>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/admin" 
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  ← 메인 대시보드로 돌아가기
                </Link>
              </div>
            </div>
          </div>

          {/* 뷰 전환 버튼 */}
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAnnualGenerator(!showAnnualGenerator)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 flex items-center space-x-2"
              >
                <span>📅</span>
                <span>연간 콘텐츠 생성</span>
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                📋 리스트 뷰
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                📅 달력 뷰
              </button>
              <button
                onClick={() => setView('tree')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === 'tree'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                🌳 트리 뷰
              </button>
              <button
                onClick={() => setView('tab')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === 'tab'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                📑 탭 뷰
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === 'table'
                    ? 'bg-orange-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                📊 테이블 뷰
              </button>
            </div>
          </div>

          {/* 파일 업로드 섹션 */}
          <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">📁 파일 업로드 (MD, TXT, HTML, PDF)</h3>
              <button
                onClick={() => setIsFileUploadCollapsed(!isFileUploadCollapsed)}
                className="text-sm text-green-600 hover:text-green-800 flex items-center space-x-1"
              >
                <span>{isFileUploadCollapsed ? '펼치기' : '접기'}</span>
                <span>{isFileUploadCollapsed ? '▼' : '▲'}</span>
              </button>
            </div>
            
            {!isFileUploadCollapsed && (
              <div>
            <p className="text-gray-600 mb-4">
              퍼널 관련 아이디어나 마케팅 캠페인 내용이 담긴 파일을 업로드하여 AI가 참고할 수 있도록 합니다.
            </p>
            
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".md,.txt,.html,.pdf"
                multiple
                onChange={handleMdFileUpload}
                className="hidden"
                id="md-file-upload"
              />
              <label
                htmlFor="md-file-upload"
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 cursor-pointer flex items-center space-x-2"
              >
                <span>📁</span>
                <span>MD 파일 선택</span>
              </label>
              
              {uploadedMdFiles.length > 0 && (
                <div className="text-sm text-gray-600">
                  업로드된 파일: {uploadedMdFiles.length}개
                </div>
              )}
            </div>
            
            {uploadedMdFiles.length > 0 && (
              <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">업로드된 파일들: {uploadedMdFiles.length}개</h4>
                  <button
                    onClick={() => {
                      setUploadedMdFiles([]);
                      setShowUploadedFiles(false);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    전체 삭제
                  </button>
                </div>
                
                {showUploadedFiles && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uploadedMdFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {file.type === 'text/markdown' ? '📝' : 
                             file.type === 'text/plain' ? '📄' :
                             file.type === 'text/html' ? '🌐' :
                             file.type === 'application/pdf' ? '📕' : '📁'}
                          </span>
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)}KB)</span>
                        </div>
                        <button
                          onClick={() => removeMdFile(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
              </div>
            )}
          </div>

          {/* 연간 콘텐츠 생성 패널 */}
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-800">📅 연간 콘텐츠 자동생성 (퍼널 캠페인 기반)</h3>
              <button
                onClick={() => setIsAnnualGeneratorCollapsed(!isAnnualGeneratorCollapsed)}
                className="text-sm text-purple-600 hover:text-purple-800 flex items-center space-x-1"
              >
                <span>{isAnnualGeneratorCollapsed ? '펼치기' : '접기'}</span>
                <span>{isAnnualGeneratorCollapsed ? '▼' : '▲'}</span>
              </button>
            </div>
            
            {!isAnnualGeneratorCollapsed && (
              <div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">생성 기간</label>
                  <select 
                    value={annualGenerationPeriod}
                    onChange={(e) => setAnnualGenerationPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="1month">1개월 (4주)</option>
                    <option value="3months">3개월 (12주)</option>
                    <option value="6months">6개월 (24주)</option>
                    <option value="1year">1년 (52주)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">블로그 카테고리</label>
                  <select 
                    value={annualContentCategory}
                    onChange={(e) => setAnnualContentCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="funnel_campaigns">퍼널 캠페인 (마케팅 캠페인 기반)</option>
                    <option value="storytelling_campaigns">스토리텔링 캠페인</option>
                    <option value="seasonal_campaigns">계절별 캠페인</option>
                    <option value="mixed">혼합 (퍼널 + 스토리 + 계절)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    선택한 카테고리에 맞는 블로그 콘텐츠를 생성합니다
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">발행 빈도</label>
                  <select 
                    value={annualPublishFrequency}
                    onChange={(e) => setAnnualPublishFrequency(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="weekly">주 1회</option>
                    <option value="biweekly">주 2회</option>
                    <option value="daily">일 1회</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleAnnualContentGeneration}
                  disabled={isGeneratingAnnual}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isGeneratingAnnual ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>생성 중...</span>
                    </>
                  ) : (
                    <>
                      <span>📅</span>
                      <span>퍼널 캠페인 기반 콘텐츠 생성</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleRegenerateTitles}
                  disabled={isGeneratingAnnual}
                  className="px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>🔄</span>
                  <span>제목 다시 생성</span>
                </button>
              </div>
              
              {generatedAnnualContent && (
                <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">생성된 콘텐츠 계획 (선별하여 추가)</h4>
                  <div className="text-sm text-gray-600 mb-3">
                    총 {generatedAnnualContent.length}개의 콘텐츠가 생성되었습니다.
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                    {generatedAnnualContent.map((content, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedContentItems.includes(index.toString())}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContentItems([...selectedContentItems, index.toString()]);
                            } else {
                              setSelectedContentItems(selectedContentItems.filter(item => item !== index.toString()));
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{content.title}</div>
                          <div className="text-sm text-gray-600 mt-1">{content.description}</div>
                          <div className="flex space-x-2 mt-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {content.contentType}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {content.campaignType}
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {content.storyFramework}
                            </span>
                          </div>
                          
                          {/* 날짜 선택 */}
                          {selectedContentItems.includes(index.toString()) && (
                            <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                발행 날짜 선택:
                              </label>
                              <input
                                type="date"
                                value={contentDates[index.toString()] || content.estimatedPublishDate || ''}
                                onChange={(e) => {
                                  setContentDates(prev => ({
                                    ...prev,
                                    [index.toString()]: e.target.value
                                  }));
                                }}
                                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={addSelectedContentToCalendar}
                      disabled={selectedContentItems.length === 0}
                      className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      선택된 {selectedContentItems.length}개 콘텐츠 캘린더에 추가
                    </button>
                    <button
                      onClick={() => {
                        setGeneratedAnnualContent(null);
                        setSelectedContentItems([]);
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>

          {/* 리스트 뷰 */}
          {/* 빠른 추가 섹션 - 간소화 */}
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900">⚡ 빠른 추가</h3>
              <input
                type="text"
                value={quickAddTitle}
                onChange={(e) => setQuickAddTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={quickAddDate}
                onChange={(e) => setQuickAddDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
              <button
                onClick={handleQuickAdd}
                disabled={!quickAddTitle || !quickAddDate}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                추가
              </button>
            </div>
          </div>

          {/* 블로그 포스트 동기화 - 간소화 */}
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">🔄 블로그 포스트 동기화</h3>
                <p className="text-sm text-gray-600">기존 블로그 포스트들을 콘텐츠 캘린더에 연결합니다</p>
              </div>
              <button
                onClick={handleSyncBlogToCalendar}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                동기화
              </button>
            </div>
          </div>

          {/* 템플릿 기반 생성 - 간소화 */}
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900">📝 템플릿 생성</h3>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">템플릿 선택</option>
                <option value="seasonal">계절별 골프 가이드</option>
                <option value="product_review">제품 리뷰 및 후기</option>
                <option value="tips">골프 실력 향상 팁</option>
                <option value="news">골프 업계 뉴스</option>
              </select>
              <input
                type="date"
                value={templateDate}
                onChange={(e) => setTemplateDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
              <button
                onClick={handleTemplateGenerate}
                disabled={!selectedTemplate || !templateDate}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                생성
              </button>
            </div>
          </div>

          {view === 'list' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">콘텐츠 목록</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        날짜
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        타입
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        오디언스 단계
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        전환 목표
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        발행 채널
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contents.map((content) => (
                      <tr key={content.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(content.content_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {content.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {content.content_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(content.target_audience.stage)}`}>
                            {content.target_audience.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <a 
                            href={content.conversion_tracking.landingPage} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {content.conversion_tracking.goal}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex flex-wrap gap-1">
                            {content.published_channels.map((channel) => (
                              <span key={channel} className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                                {channel}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(content.status)}`}>
                            {content.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-1">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEditContent(content)}
                                className="text-blue-600 hover:text-blue-900 text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100"
                              >
                                편집
                              </button>
                              <button 
                                onClick={() => handleMultiChannelGenerate(content)}
                                className="text-green-600 hover:text-green-900 text-xs bg-green-50 px-2 py-1 rounded hover:bg-green-100"
                              >
                                멀티채널 생성
                              </button>
                            </div>
                            <div className="flex space-x-1">
                              {content.status === 'draft' && (
                                <button 
                                  onClick={() => updateContentStatus(content.blog_post_id || content.id, 'published')}
                                  className="text-green-600 hover:text-green-900 text-xs bg-green-50 px-2 py-1 rounded"
                                >
                                  발행하기
                                </button>
                              )}
                              {content.status === 'published' && (
                                <button 
                                  onClick={() => handleSaveAsDraft(content)}
                                  className="text-yellow-600 hover:text-yellow-900 text-xs bg-yellow-50 px-2 py-1 rounded hover:bg-yellow-100"
                                >
                                  초안으로
                                </button>
                              )}
                              <button 
                                onClick={() => updateContentStatus(content.blog_post_id || content.id, 'archived')}
                                className="text-gray-600 hover:text-gray-900 text-xs bg-gray-50 px-2 py-1 rounded"
                              >
                                보관하기
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 달력 뷰 */}
          {view === 'calendar' && (
            <div className="bg-white shadow rounded-lg">
              {/* 달력 헤더 */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">달력 뷰</h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={goToPreviousMonth}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      ←
                    </button>
                    <h3 className="text-lg font-medium text-gray-900">
                      {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
                    </h3>
                    <button
                      onClick={goToNextMonth}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      →
                    </button>
                    <button
                      onClick={goToToday}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      오늘
                    </button>
                  </div>
                </div>
              </div>

              {/* 달력 그리드 */}
              <div className="p-6">
                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                {/* 달력 날짜들 */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getFirstDayOfMonth(currentMonth) }, (_, i) => (
                    <div key={`empty-${i}`} className="h-24"></div>
                  ))}
                  
                  {Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => {
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                    const dayContent = getContentForDate(date);
                    const isToday = formatDate(date) === formatDate(new Date());
                    const isSelected = selectedDate && formatDate(date) === formatDate(selectedDate);
                    
                    return (
                      <div
                        key={i + 1}
                        onClick={() => handleDateClick(date)}
                        className={`
                          h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50
                          ${isToday ? 'bg-blue-50 border-blue-300' : ''}
                          ${isSelected ? 'bg-blue-100 border-blue-400' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                            {i + 1}
                          </span>
                          {dayContent.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                              {dayContent.length}
                            </span>
                          )}
                        </div>
                        
                        {/* 콘텐츠 미리보기 */}
                        <div className="space-y-1">
                          {dayContent.slice(0, 2).map((content, idx) => (
                            <div
                              key={idx}
                              className={`
                                text-xs p-1 rounded truncate
                                ${content.target_audience?.stage === 'awareness' ? 'bg-blue-100 text-blue-800' : 
                                  content.target_audience?.stage === 'consideration' ? 'bg-yellow-100 text-yellow-800' :
                                  content.target_audience?.stage === 'conversion' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'}
                              `}
                              title={content.title}
                            >
                              {content.title}
                            </div>
                          ))}
                          {dayContent.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayContent.length - 2}개 더
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 범례 */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-200 rounded"></div>
                    <span>인지 단계 (홈페이지)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                    <span>고려 단계 (상담)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-200 rounded"></div>
                    <span>결정 단계 (구매)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 통계 요약 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📝</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">총 콘텐츠</dt>
                      <dd className="text-lg font-medium text-gray-900">{contents.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">발행 완료</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {contents.filter(c => c.status === 'published').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📋</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">초안</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {contents.filter(c => c.status === 'draft').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">예약됨</dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {contents.filter(c => c.status === 'scheduled').length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 트리 뷰 */}
          {view === 'tree' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">트리 뷰 - 멀티채널 콘텐츠 구조</h2>
                <p className="text-sm text-gray-600 mt-1">원본 콘텐츠와 파생 콘텐츠의 계층 구조를 확인하세요</p>
              </div>
              <div className="p-6">
                {convertToTreeStructure(contents).map((rootContent) => (
                  <div key={rootContent.id} className="mb-6">
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <button
                        onClick={() => toggleNode(rootContent.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {expandedNodes.has(rootContent.id) ? '📂' : '📁'}
                      </button>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{rootContent.title}</h3>
                        <p className="text-sm text-gray-600">
                          {rootContent.derived_content_count || 0}개 파생 콘텐츠
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleMultichannelGeneration(rootContent.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          멀티채널 생성
                        </button>
                        <button
                          onClick={() => {
                            const blogPostId = rootContent.blog_post_id;
                            if (blogPostId) {
                              window.open(`/admin/blog?edit=${blogPostId}`, '_blank');
                            } else {
                              alert('편집할 수 있는 블로그 포스트가 연결되지 않았습니다.');
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          편집
                        </button>
                      </div>
                    </div>
                    
                    {expandedNodes.has(rootContent.id) && rootContent.children && (
                      <div className="ml-6 mt-3 space-y-2">
                        {rootContent.children.map((child) => (
                          <div key={child.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                            <span className="text-gray-400">└─</span>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900">{child.title}</span>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  child.target_audience_type === 'existing_customer' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {child.target_audience_type === 'existing_customer' ? '기존고객' : '신규고객'}
                                </span>
                                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                  {child.channel_type}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">
                                상태: {child.status} | 
                                멀티채널: {child.multichannel_status} |
                                이미지: {child.image_generation_status}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              {child.image_generation_status === 'pending' && (
                                <button
                                  onClick={() => handleImageGeneration(
                                    child.id, 
                                    child.target_audience_type || 'new_customer',
                                    [child.channel_type || 'kakao']
                                  )}
                                  className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                                >
                                  이미지 생성
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  const blogPostId = child.blog_post_id;
                                  if (blogPostId) {
                                    window.open(`/admin/blog?edit=${blogPostId}`, '_blank');
                                  } else {
                                    alert('편집할 수 있는 블로그 포스트가 연결되지 않았습니다.');
                                  }
                                }}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                편집
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 탭 뷰 */}
          {view === 'tab' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">탭 뷰 - 타겟별 콘텐츠</h2>
                <p className="text-sm text-gray-600 mt-1">타겟 오디언스별로 콘텐츠를 확인하세요</p>
              </div>
              
              {/* 탭 헤더 */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setSelectedTargetAudience('all')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      selectedTargetAudience === 'all'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    전체 ({contents.length})
                  </button>
                  <button
                    onClick={() => setSelectedTargetAudience('existing_customer')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      selectedTargetAudience === 'existing_customer'
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    기존 고객 ({contents.filter(c => c.target_audience_type === 'existing_customer').length})
                  </button>
                  <button
                    onClick={() => setSelectedTargetAudience('new_customer')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      selectedTargetAudience === 'new_customer'
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    신규 고객 ({contents.filter(c => c.target_audience_type === 'new_customer').length})
                  </button>
                </nav>
              </div>

              {/* 탭 콘텐츠 */}
              <div className="p-6">
                {(() => {
                  const filteredContents = selectedTargetAudience === 'all' 
                    ? contents 
                    : contents.filter(c => c.target_audience_type === selectedTargetAudience);
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredContents.map((content) => (
                        <div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{content.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded ${
                              content.target_audience_type === 'existing_customer' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {content.target_audience_type === 'existing_customer' ? '기존' : '신규'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">{content.content_type}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{content.content_date}</span>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => window.open(`/admin/blog?edit=${content.blog_post_id || content.id}`, '_blank')}
                                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                편집
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* 테이블 뷰 */}
          {view === 'table' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">테이블 뷰 - 전체 콘텐츠</h2>
                <p className="text-sm text-gray-600 mt-1">모든 콘텐츠를 테이블 형태로 확인하세요</p>
              </div>
              
              {/* 필터 */}
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedTargetAudience}
                    onChange={(e) => setSelectedTargetAudience(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="all">전체 타겟</option>
                    <option value="existing_customer">기존 고객</option>
                    <option value="new_customer">신규 고객</option>
                  </select>
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="all">전체 채널</option>
                    <option value="blog">블로그</option>
                    <option value="kakao">카카오톡</option>
                    <option value="sms">SMS</option>
                    <option value="naver_blog">네이버 블로그</option>
                    <option value="google_ads">구글 광고</option>
                    <option value="instagram">인스타그램</option>
                    <option value="facebook">페이스북</option>
                  </select>
                </div>
              </div>

              {/* 테이블 */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        타겟
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        채널
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        날짜
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contents
                      .filter(content => 
                        (selectedTargetAudience === 'all' || content.target_audience_type === selectedTargetAudience) &&
                        (selectedChannel === 'all' || content.channel_type === selectedChannel)
                      )
                      .map((content) => (
                        <tr key={content.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                              {content.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {content.is_root_content ? '🌳 루트' : '└─ 파생'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded ${
                              content.target_audience_type === 'existing_customer' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {content.target_audience_type === 'existing_customer' ? '기존고객' : '신규고객'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {content.channel_type || 'blog'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded ${
                              content.status === 'published' ? 'bg-green-100 text-green-800' :
                              content.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {content.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {content.content_date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => window.open(`/admin/blog?edit=${content.blog_post_id || content.id}`, '_blank')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                편집
                              </button>
                              
                              {/* 채널별 생성 드롭다운 */}
                              <div className="relative inline-block text-left">
                                <div>
                                  <button
                                    type="button"
                                    className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-2 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    onClick={() => {
                                      const dropdown = document.getElementById(`channel-dropdown-${content.id}`);
                                      if (dropdown) {
                                        dropdown.classList.toggle('hidden');
                                      }
                                    }}
                                  >
                                    채널 생성
                                    <svg className="-mr-1 ml-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                </div>
                                
                                <div
                                  id={`channel-dropdown-${content.id}`}
                                  className="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
                                >
                                  <div className="py-1" role="menu">
                                    <button
                                      onClick={() => {
                                        window.open(`/admin/sms?calendarId=${content.id}`, '_blank');
                                        document.getElementById(`channel-dropdown-${content.id}`)?.classList.add('hidden');
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      📱 SMS/MMS 생성
                                    </button>
                                    <button
                                      onClick={() => {
                                        // 카카오 에디터는 추후 구현
                                        alert('카카오 채널 에디터는 준비 중입니다.');
                                        document.getElementById(`channel-dropdown-${content.id}`)?.classList.add('hidden');
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      💬 카카오 채널 생성
                                    </button>
                                    <button
                                      onClick={() => {
                                        // 네이버 블로그 에디터는 추후 구현
                                        alert('네이버 블로그 에디터는 준비 중입니다.');
                                        document.getElementById(`channel-dropdown-${content.id}`)?.classList.add('hidden');
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      📝 네이버 블로그 생성
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {content.is_root_content && (
                                <button
                                  onClick={() => handleMultichannelGeneration(content.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  멀티채널
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
